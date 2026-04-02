import { define } from "../../../utils.ts";
import { fromFileUrl, join } from "@std/path";
import { renderWithAssets } from "../_render_with_assets.ts";

interface GenerateRequest {
  instruction?: string;
  markdown?: string;
  css?: string;
  markdownPath?: string;
  cssPath?: string;
  preset?: "modern" | string;
  includePreviewImage?: boolean;
}

interface GenerateResult {
  markdown: string;
  css: string;
  notes?: string;
}

const REQUIRED_SECTIONS = [
  "Summary",
  "Experience",
  "Projects",
  "Education",
  "Skills",
  "Languages",
  "Interests",
] as const;

const ALLOWED_SELECTOR_BASES = [
  ":root",
  "*",
  "html",
  "body",
  ".page",
  ".resume-layout",
  ".resume-sidebar",
  ".resume-main",
  ".resume-header",
  ".resume-contact",
  ".resume-section",
] as const;

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const OPENAI_TIMEOUT_MS = 60_000;
const limiter = new Map<string, { startedAt: number; count: number }>();
function checkRateLimit(
  key: string,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const item = limiter.get(key);

  if (!item || now - item.startedAt >= WINDOW_MS) {
    limiter.set(key, { startedAt: now, count: 1 });
    return { ok: true };
  }

  if (item.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.ceil(
      (WINDOW_MS - (now - item.startedAt)) / 1000,
    );
    return { ok: false, retryAfterSec };
  }

  item.count += 1;
  limiter.set(key, item);
  return { ok: true };
}

function extractJsonObject(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function validateRequiredSections(markdown: string): string | null {
  const headings = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, ""));

  let pointer = -1;
  for (const expected of REQUIRED_SECTIONS) {
    const nextIndex = headings.findIndex((value, idx) =>
      idx > pointer && value === expected
    );
    if (nextIndex === -1) {
      return `Missing or out-of-order section: ${expected}`;
    }
    pointer = nextIndex;
  }

  return null;
}

function isAllowedSelector(selector: string): boolean {
  const normalized = selector.trim();
  if (normalized.length === 0) return true;
  if (normalized.startsWith("@")) return true;

  const primary = normalized.split(/\s|>|\+|~/)[0];
  if (primary.startsWith(".resume-section--")) return true;

  for (const base of ALLOWED_SELECTOR_BASES) {
    if (
      primary === base ||
      primary.startsWith(`${base}:`) ||
      primary.startsWith(`${base}::`) ||
      primary.startsWith(`${base}[`)
    ) {
      return true;
    }
  }

  return false;
}

function validateCssSelectors(css: string): string | null {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const regex = /([^{}]+)\{/g;

  for (const match of cleaned.matchAll(regex)) {
    const selectorGroup = match[1].trim();
    if (selectorGroup.startsWith("@")) continue;

    const selectors = selectorGroup.split(",").map((v) => v.trim()).filter(
      Boolean,
    );
    for (const selector of selectors) {
      if (!isAllowedSelector(selector)) {
        return `Forbidden selector outside semantic resume scope: ${selector}`;
      }
    }
  }

  return null;
}

function parseResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;

  const outputText = root.output_text;
  if (typeof outputText === "string" && outputText.trim().length > 0) {
    return outputText;
  }

  const choices = root.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as Record<string, unknown>;
    const message = first.message as Record<string, unknown> | undefined;
    const content = message?.content;

    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const text = (item as Record<string, unknown>).text;
          return typeof text === "string" ? text : "";
        })
        .join("\n");
    }
  }

  return "";
}

function buildSystemPrompt(): string {
  return [
    "You generate a resume in Markdown and CSS.",
    "Return strict JSON only. No markdown fences. No prose outside JSON.",
    'JSON schema: { "markdown": string, "css": string, "notes"?: string }.',
    "Language must be English.",
    "Ensure markdown has section headings in this order:",
    "## Summary, ## Experience, ## Projects, ## Education, ## Skills, ## Languages, ## Interests",
    "If user asks to move sections to sidebar, use markdown front matter option:",
    "---",
    "sidebar_sections:",
    "  - projects",
    "---",
    "CSS is constrained to semantic resume selectors only:",
    ".page, .resume-layout, .resume-sidebar, .resume-main, .resume-header, .resume-contact, .resume-section, .resume-section--*",
    "Also allowed: :root, *, html, body, @media, @page.",
    "Default style preset is modern unless user instruction overrides it.",
  ].join("\n");
}

function buildUserPrompt(
  data: Required<Pick<GenerateRequest, "instruction" | "markdown" | "css">> & {
    preset: string;
  },
): string {
  return [
    `Style preset: ${data.preset}`,
    "User instruction:",
    data.instruction,
    "Current markdown:",
    data.markdown,
    "Current css:",
    data.css,
  ].join("\n\n");
}

function uint8ToBase64(data: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export const handler = define.handlers({
  async POST(ctx) {
    const ip = ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local";
    const limit = checkRateLimit(ip);
    if (!limit.ok) {
      return new Response("Rate limit exceeded", {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSec) },
      });
    }

    let body: GenerateRequest;
    try {
      body = await ctx.req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    const instruction = typeof body.instruction === "string"
      ? body.instruction.trim()
      : "";
    const markdown = typeof body.markdown === "string" ? body.markdown : "";
    const css = typeof body.css === "string" ? body.css : "";
    const preset = typeof body.preset === "string" && body.preset.length > 0
      ? body.preset
      : "modern";
    const markdownPath = typeof body.markdownPath === "string"
      ? body.markdownPath
      : "";
    const cssPath = typeof body.cssPath === "string" ? body.cssPath : "";
    const includePreviewImage = body.includePreviewImage !== false;

    if (instruction.length === 0) {
      return new Response("Instruction is required", { status: 400 });
    }
    if (instruction.length > 2000) {
      return new Response("Instruction is too long (max 2000 chars)", {
        status: 400,
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response("Missing OPENAI_API_KEY in environment", {
        status: 500,
      });
    }

    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.4-mini";
    let imageDataUrl = "";
    if (includePreviewImage) {
      const previewHtml = await renderWithAssets({
        markdown,
        css,
        markdownPath,
        cssPath,
      });
      const tempDir = await Deno.makeTempDir({ prefix: "resume-chat-image-" });
      const htmlPath = join(tempDir, "preview.html");
      const imagePath = join(tempDir, "preview.png");
      await Deno.writeTextFile(htmlPath, previewHtml);

      try {
        const workerPath = fromFileUrl(
          new URL("../../../scripts/preview_image_worker.ts", import.meta.url),
        );
        const command = new Deno.Command("deno", {
          args: [
            "run",
            "--allow-read",
            "--allow-write",
            "--allow-env",
            "--allow-sys",
            "--allow-run",
            workerPath,
            htmlPath,
            imagePath,
          ],
          stdout: "piped",
          stderr: "piped",
        });

        const result = await command.output();
        if (result.code === 0) {
          const imageBytes = await Deno.readFile(imagePath);
          imageDataUrl = `data:image/png;base64,${uint8ToBase64(imageBytes)}`;
        } else {
          const err = new TextDecoder().decode(result.stderr).trim();
          console.error(
            `[chat.generate] preview_image_failed ${
              err || `exit ${result.code}`
            }`,
          );
        }
      } finally {
        await Deno.remove(tempDir, { recursive: true }).catch(() => undefined);
      }
    }

    const userContent = [
      {
        type: "text",
        text: buildUserPrompt({ instruction, markdown, css, preset }),
      },
      ...(imageDataUrl
        ? [{
          type: "image_url",
          image_url: { url: imageDataUrl },
        }]
        : []),
    ];

    const payload = {
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.3,
    };

    const startedAt = Date.now();
    console.log(
      `[chat.generate] start ip=${ip} model=${model} instruction_chars=${instruction.length} md_chars=${markdown.length} css_chars=${css.length} with_image=${
        imageDataUrl.length > 0
      }`,
    );

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("aborted")) {
        console.error(
          `[chat.generate] timeout model=${model} timeout_ms=${OPENAI_TIMEOUT_MS}`,
        );
        return new Response("LLM request timed out", { status: 504 });
      }
      console.error(`[chat.generate] request_error ${message}`);
      return new Response("LLM request failed", { status: 502 });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        `[chat.generate] upstream_error status=${response.status} body=${errText}`,
      );
      return new Response("LLM request failed", { status: 502 });
    }

    const raw = await response.json();
    const text = parseResponseText(raw);
    const jsonText = extractJsonObject(text);
    if (!jsonText) {
      console.error("[chat.generate] invalid_output no_json_object");
      return new Response("LLM output was not valid JSON", { status: 502 });
    }

    let parsed: GenerateResult;
    try {
      parsed = JSON.parse(jsonText) as GenerateResult;
    } catch {
      console.error("[chat.generate] invalid_output parse_error");
      return new Response("LLM output JSON parse failed", { status: 502 });
    }

    if (
      !parsed || typeof parsed !== "object" ||
      typeof parsed.markdown !== "string" ||
      typeof parsed.css !== "string"
    ) {
      return new Response("LLM output schema invalid", { status: 502 });
    }

    const markdownUnchanged = parsed.markdown === markdown;
    const cssUnchanged = parsed.css === css;
    if (markdownUnchanged && cssUnchanged) {
      return new Response(
        "No changes generated. Please refine your instruction.",
        { status: 409 },
      );
    }

    const sectionError = validateRequiredSections(parsed.markdown);
    if (sectionError) {
      return new Response(`Generated markdown invalid: ${sectionError}`, {
        status: 502,
      });
    }

    const cssError = validateCssSelectors(parsed.css);
    if (cssError) {
      return new Response(`Generated CSS invalid: ${cssError}`, {
        status: 502,
      });
    }

    console.log(
      `[chat.generate] ok ip=${ip} model=${model} elapsed_ms=${
        Date.now() - startedAt
      } out_md_chars=${parsed.markdown.length} out_css_chars=${parsed.css.length}`,
    );

    return Response.json(parsed);
  },
});
