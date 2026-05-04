import {
  basename,
  dirname,
  fromFileUrl,
  join,
  relative,
  resolve,
  toFileUrl,
} from "@std/path";
import { SemanticResumeHtmlRenderer } from "@core";
import { SemanticResumeParser } from "@core";
import { HtmlToPdfGenerator } from "@core";
import { serializeResumeToRawMarkdown } from "@core";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const DEFAULT_PDF_OUTPUT = join(ROOT, "out", "resume_bis.pdf");

type RunOptions = {
  inputMarkdown: string;
  outputRawMarkdown: string | null;
  rawIncludeHidden: boolean;
  outputHtml: string | null;
  wantsPdf: boolean;
  outputPdf: string;
  cssPath: string | null;
  debugHidden: boolean;
};

function readArgValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function requireArgValue(args: string[], flag: string): string {
  const value = readArgValue(args, flag);
  if (value && value.trim().length > 0) return value;
  throw new Error(`Missing required flag ${flag}. Please add ${flag} <path>.`);
}

function parseRunOptions(args: string[]): RunOptions {
  const wantsPdf = args.includes("--pdf");
  return {
    inputMarkdown: requireArgValue(args, "--md"),
    outputRawMarkdown: readArgValue(args, "--raw-md-out"),
    rawIncludeHidden: args.includes("--raw-md-include-hidden"),
    outputHtml: readArgValue(args, "--html-out"),
    wantsPdf,
    outputPdf: readArgValue(args, "--pdf-out") ?? DEFAULT_PDF_OUTPUT,
    cssPath: readArgValue(args, "--css"),
    debugHidden: args.includes("--debug-hidden"),
  };
}

function escapeHtmlAttr(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeStylesheetListValue(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  return [];
}

function collectStylesheetUrls(
  rawConfig: Record<string, unknown>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const key of ["stylesheets", "icons", "icon", "fonts", "font"]) {
    const values = normalizeStylesheetListValue(rawConfig[key]);
    for (const value of values) {
      if (seen.has(value)) continue;
      seen.add(value);
      out.push(value);
    }
  }

  return out;
}

function buildHtmlDocument(
  content: string,
  css: string,
  options: { lang?: string; stylesheets?: string[] } = {},
): string {
  const lang = options.lang?.trim() || "en";
  const links = (options.stylesheets ?? [])
    .map((href) => `<link rel="stylesheet" href="${escapeHtmlAttr(href)}" />`)
    .join("\n    ");

  return `<!doctype html>
<html lang="${escapeHtmlAttr(lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Resume</title>
    ${links}
    <style>${css}</style>
  </head>
  <body>
    <main class="page">
${content}
    </main>
  </body>
</html>`;
}

function injectBaseHref(html: string, baseDir: string): string {
  const normalizedBaseDir = resolve(baseDir);
  const baseHref = toFileUrl(`${normalizedBaseDir}/`).href;
  const baseTag = `<base href="${escapeHtmlAttr(baseHref)}" />`;

  if (/<base\s+/i.test(html)) {
    return html.replace(/<base[^>]*>/i, baseTag);
  }

  return html.replace(/<head>/i, `<head>\n    ${baseTag}`);
}

function inferMimeType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function inlineLocalAssetUrlsForPdf(
  html: string,
  baseDir: string,
): Promise<string> {
  const imgRegex = /(<img[^>]*\ssrc=")([^"]+)(")/g;
  const cssUrlRegex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  const cache = new Map<string, string>();

  const inlinePath = async (rawPath: string): Promise<string | null> => {
    if (isExternalOrAbsolutePath(rawPath)) return null;
    const { path } = splitPathAndSuffix(rawPath);
    const resolved = resolve(baseDir, path);
    const cached = cache.get(resolved);
    if (cached) return cached;

    try {
      const stat = await Deno.stat(resolved);
      if (!stat.isFile) return null;
      const bytes = await Deno.readFile(resolved);
      const dataUri = `data:${inferMimeType(resolved)};base64,${
        bytesToBase64(bytes)
      }`;
      cache.set(resolved, dataUri);
      return dataUri;
    } catch {
      return null;
    }
  };

  let rewritten = "";
  let cursor = 0;
  for (const match of html.matchAll(imgRegex)) {
    const full = match[0];
    const prefix = match[1];
    const src = match[2];
    const suffix = match[3];
    const index = match.index ?? 0;
    rewritten += html.slice(cursor, index);
    cursor = index + full.length;

    const inlined = await inlinePath(src);
    if (!inlined) {
      rewritten += full;
      continue;
    }
    rewritten += `${prefix}${escapeHtmlAttr(inlined)}${suffix}`;
  }
  rewritten += html.slice(cursor);

  let cssRewritten = "";
  cursor = 0;
  for (const match of rewritten.matchAll(cssUrlRegex)) {
    const full = match[0];
    const quote = match[1] ?? "";
    const rawPath = match[2];
    const index = match.index ?? 0;
    cssRewritten += rewritten.slice(cursor, index);
    cursor = index + full.length;

    const inlined = await inlinePath(rawPath);
    if (!inlined) {
      cssRewritten += full;
      continue;
    }
    cssRewritten += `url(${quote}${escapeHtmlAttr(inlined)}${quote})`;
  }
  cssRewritten += rewritten.slice(cursor);

  return cssRewritten;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isExternalOrAbsolutePath(path: string): boolean {
  const value = path.trim();
  return value.startsWith("/") || value.startsWith("http://") ||
    value.startsWith("https://") || value.startsWith("data:") ||
    value.startsWith("file:");
}

function splitPathAndSuffix(value: string): { path: string; suffix: string } {
  const match = value.match(/^([^?#]+)([?#].*)?$/);
  if (!match) return { path: value, suffix: "" };
  return { path: match[1], suffix: match[2] ?? "" };
}

async function materializeLocalImageAssets(
  html: string,
  markdownPath: string,
  outputPath: string,
): Promise<string> {
  const imgRegex = /(<img[^>]*\ssrc=")([^"]+)(")/g;
  const cssUrlRegex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  const mdDir = dirname(markdownPath);
  const outDir = dirname(outputPath);
  const outAssetsDir = join(outDir, "assets");

  const pathToName = new Map<string, string>();
  const usedNames = new Set<string>();
  const missingSources = new Set<string>();

  const materializePath = async (rawPath: string): Promise<string | null> => {
    if (isExternalOrAbsolutePath(rawPath)) return null;

    const { path, suffix } = splitPathAndSuffix(rawPath);
    const sourcePath = resolve(mdDir, path);

    try {
      const stat = await Deno.stat(sourcePath);
      if (!stat.isFile) {
        missingSources.add(sourcePath);
        return null;
      }
    } catch {
      missingSources.add(sourcePath);
      return null;
    }

    let assetName = pathToName.get(sourcePath);
    if (!assetName) {
      const originalName = basename(sourcePath);
      assetName = originalName;

      let counter = 2;
      while (usedNames.has(assetName)) {
        const dot = originalName.lastIndexOf(".");
        if (dot === -1) assetName = `${originalName}-${counter}`;
        else {
          assetName = `${originalName.slice(0, dot)}-${counter}${
            originalName.slice(dot)
          }`;
        }
        counter += 1;
      }

      usedNames.add(assetName);
      pathToName.set(sourcePath, assetName);
    }

    if (!assetName) return null;

    await Deno.mkdir(outAssetsDir, { recursive: true });
    await Deno.copyFile(sourcePath, join(outAssetsDir, assetName));
    return `./assets/${assetName}${suffix}`;
  };

  let result = "";
  let cursor = 0;
  for (const match of html.matchAll(imgRegex)) {
    const full = match[0];
    const prefix = match[1];
    const src = match[2];
    const suffix = match[3];
    const index = match.index ?? 0;

    result += html.slice(cursor, index);
    cursor = index + full.length;

    const materialized = await materializePath(src);
    if (!materialized) {
      result += full;
      continue;
    }
    result += `${prefix}${escapeHtml(materialized)}${suffix}`;
  }
  result += html.slice(cursor);

  let cssRewritten = "";
  cursor = 0;
  for (const match of result.matchAll(cssUrlRegex)) {
    const full = match[0];
    const quote = match[1] ?? "";
    const rawPath = match[2];
    const index = match.index ?? 0;

    cssRewritten += result.slice(cursor, index);
    cursor = index + full.length;

    const materialized = await materializePath(rawPath);
    if (!materialized) {
      cssRewritten += full;
      continue;
    }
    cssRewritten += `url(${quote}${escapeHtml(materialized)}${quote})`;
  }
  cssRewritten += result.slice(cursor);

  for (const missingSource of missingSources) {
    console.warn(
      `Image source not found: ${
        relative(ROOT, missingSource)
      } (from ${markdownPath})`,
    );
  }
  return cssRewritten;
}

export async function run(args: string[] = Deno.args): Promise<void> {
  const options = parseRunOptions(args);

  const markdown = await Deno.readTextFile(options.inputMarkdown);
  const parser = new SemanticResumeParser();
  const ast = parser.parse(markdown);
  console.log(
    `Validation: ${ast.validation.errors.length} error(s), ${ast.validation.warnings.length} warning(s)`,
  );

  if (options.outputRawMarkdown) {
    const rawMarkdown = serializeResumeToRawMarkdown(ast, {
      includeHidden: options.rawIncludeHidden,
    });
    await Deno.mkdir(dirname(options.outputRawMarkdown), { recursive: true });
    await Deno.writeTextFile(options.outputRawMarkdown, rawMarkdown);
    console.log(
      `Raw markdown written to ${relative(ROOT, options.outputRawMarkdown)}`,
    );
  }

  if (!options.outputHtml && !options.wantsPdf) return;

  const renderer = new SemanticResumeHtmlRenderer();
  const htmlFragment = renderer.render(ast, {
    debugHidden: options.debugHidden,
  });
  const css = options.cssPath
    ? await Deno.readTextFile(options.cssPath)
    : ".is-hidden-source { outline: 1px dashed #cc8b00; opacity: 0.75; }";
  const stylesheets = collectStylesheetUrls(ast.config.raw);
  const lang = typeof ast.config.raw.lang === "string"
    ? ast.config.raw.lang
    : "en";

  const htmlDocument = buildHtmlDocument(htmlFragment, css, {
    lang,
    stylesheets,
  });
  const materializationAnchorPath = options.outputHtml ??
    join(dirname(options.outputPdf), "resume_bis.html");
  const htmlWithLocalAssets = await materializeLocalImageAssets(
    htmlDocument,
    options.inputMarkdown,
    materializationAnchorPath,
  );

  if (options.outputHtml) {
    await Deno.mkdir(dirname(options.outputHtml), { recursive: true });
    await Deno.writeTextFile(options.outputHtml, htmlWithLocalAssets);

    const hiddenLabel = options.debugHidden ? "on" : "off";
    console.log(
      `HTML written to ${
        relative(ROOT, options.outputHtml)
      } (debug-hidden: ${hiddenLabel})`,
    );
  }

  if (!options.wantsPdf) return;

  if (!options.outputHtml) {
    await Deno.mkdir(dirname(materializationAnchorPath), { recursive: true });
    await Deno.writeTextFile(materializationAnchorPath, htmlWithLocalAssets);
  }

  const pdfGenerator = new HtmlToPdfGenerator();
  const pdfHtmlWithBase = injectBaseHref(
    htmlWithLocalAssets,
    dirname(materializationAnchorPath),
  );
  const pdfHtml = await inlineLocalAssetUrlsForPdf(
    pdfHtmlWithBase,
    dirname(materializationAnchorPath),
  );
  await pdfGenerator.generate(pdfHtml, options.outputPdf, {
    title: "Resume",
    sourceHtmlPath: materializationAnchorPath,
  });
  console.log(`PDF written to ${relative(ROOT, options.outputPdf)}`);
}

if (import.meta.main) {
  run().catch((error) => {
    console.error(error);
    Deno.exit(1);
  });
}
