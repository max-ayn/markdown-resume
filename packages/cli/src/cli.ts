import { watch } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type FrontmatterData,
  HtmlToPdfGenerator,
  measurePageOverflow,
  renderMarkdown,
} from "@markdown-resume/core";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

type GlobalFlags = {
  inputFolder: string;
  outputFolder: string;
  mdFlag: string | null;
  styleFlag: string | null;
  wantsPdf: boolean;
  force: boolean;
  watch: boolean;
};

function readArgValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function parseGlobalFlags(args: string[]): GlobalFlags {
  return {
    inputFolder: readArgValue(args, "-i") ?? ".",
    outputFolder: readArgValue(args, "-o") ?? ".",
    mdFlag: readArgValue(args, "-md"),
    styleFlag: readArgValue(args, "-style"),
    wantsPdf: args.includes("-pdf") || args.includes("--with-pdf"),
    force: args.includes("-f") || args.includes("--force"),
    watch: args.includes("-w") || args.includes("--watch"),
  };
}

async function findFilesByExtension(
  folder: string,
  extension: string,
): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === extension)
    .map((entry) => entry.name)
    .sort();
}

// `-i` normally names a folder to search, but pointing it straight at a
// resume.md is a natural thing to try, so resolve it to the containing
// folder up front rather than failing with a raw ENOTDIR from readdir.
async function resolveInputFolder(inputFolder: string): Promise<string> {
  const stats = await stat(inputFolder).catch(() => null);
  return stats?.isFile() ? dirname(inputFolder) : inputFolder;
}

async function resolveInputMarkdownPath(
  inputFolder: string,
  mdFlag: string | null,
): Promise<string> {
  if (mdFlag) return resolve(inputFolder, mdFlag);

  const stats = await stat(inputFolder).catch(() => null);
  if (stats?.isFile()) return resolve(inputFolder);

  const matches = await findFilesByExtension(inputFolder, ".md");
  if (matches.length === 0) {
    throw new Error(`No markdown file found in ${inputFolder}.`);
  }
  if (matches.length > 1) {
    throw new Error(
      `Multiple markdown files found in ${inputFolder} (${matches.join(
        ", ",
      )}); pass -md <filename> to disambiguate.`,
    );
  }
  return resolve(inputFolder, matches[0]);
}

async function resolveStylePath(
  inputFolder: string,
  styleFlag: string | null,
): Promise<string | null> {
  if (styleFlag) return resolve(inputFolder, styleFlag);

  const matches = await findFilesByExtension(inputFolder, ".css");
  if (matches.length === 0) {
    // ponytail: no external stylesheet is fine — markdown-it passes a
    // `<style>` block embedded in the markdown straight through as-is.
    return null;
  }
  if (matches.length > 1) {
    throw new Error(
      `Multiple stylesheets found in ${inputFolder} (${matches.join(
        ", ",
      )}); pass -style <path> to disambiguate.`,
    );
  }
  return resolve(inputFolder, matches[0]);
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeStylesheetListValue(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => normalizeStylesheetListValue(entry));
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>).flatMap((value) =>
      normalizeStylesheetListValue(value),
    );
  }

  return [];
}

function extractPrimaryFontName(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const name = extractPrimaryFontName(entry);
      if (name) return name;
    }
    return null;
  }

  if (raw && typeof raw === "object") {
    const firstKey = Object.keys(raw as Record<string, unknown>)[0];
    return firstKey?.trim() || null;
  }

  return null;
}

function collectStylesheetUrls(rawConfig: Record<string, unknown>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const key of ["stylesheets", "icons", "icon", "fonts"]) {
    const values = normalizeStylesheetListValue(rawConfig[key]);
    for (const value of values) {
      if (seen.has(value)) continue;
      seen.add(value);
      out.push(value);
    }
  }

  return out;
}

function formatPageMargin(margin: string | number | undefined): string {
  if (typeof margin === "number") return margin === 0 ? "0" : `${margin}mm`;
  const trimmed = margin?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "0";
}

const PAGE_DIMENSIONS_MM: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
};

function resolvePageDimensionsMm(size: string): {
  width: number;
  height: number;
} {
  return PAGE_DIMENSIONS_MM[size.trim().toUpperCase()] ?? PAGE_DIMENSIONS_MM.A4;
}

const DEFAULT_FONT_FALLBACK_STACK =
  '"Avenir Next", "Segoe UI", Arial, sans-serif';

function buildHtmlDocument(
  content: string,
  css: string,
  options: {
    lang?: string;
    stylesheets?: string[];
    page?: { size?: string; margin?: string | number };
    font?: { family?: string };
  } = {},
): string {
  const lang = options.lang?.trim() || "en";
  const links = (options.stylesheets ?? [])
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join("\n    ");
  const pageSize = options.page?.size?.trim() || "A4";
  const pageMargin = formatPageMargin(options.page?.margin);
  const { width: pageWidthMm, height: pageHeightMm } =
    resolvePageDimensionsMm(pageSize);
  const fontName = options.font?.family?.trim();
  const fontFamilyRule = fontName
    ? `body { font-family: "${fontName}", ${DEFAULT_FONT_FALLBACK_STACK}; }`
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Resume</title>
    ${links}
    <style>${css}</style>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page {
        width: ${pageWidthMm}mm;
        min-height: ${pageHeightMm}mm;
        box-shadow: 0 2.6mm 7.2mm rgb(0 0 0 / 16%);
        overflow: hidden;
      }
      .resume-region { min-width: 0; }
      @page { size: ${pageSize}; margin: ${pageMargin}; }
      @media print {
        body { background: #fff; }
        .page { margin: 0; box-shadow: none; }
      }
      ${fontFamilyRule}
    </style>
  </head>
  <body>
    <main class="page resume">
${content}
    </main>
  </body>
</html>`;
}

function injectBaseHref(html: string, baseDir: string): string {
  const normalizedBaseDir = resolve(baseDir);
  const baseHref = pathToFileURL(`${normalizedBaseDir}/`).href;
  const baseTag = `<base href="${escapeHtml(baseHref)}" />`;

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

function isExternalOrAbsolutePath(path: string): boolean {
  const value = path.trim();
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("file:")
  );
}

function splitPathAndSuffix(value: string): { path: string; suffix: string } {
  const match = value.match(/^([^?#]+)([?#].*)?$/);
  if (!match) return { path: value, suffix: "" };
  return { path: match[1], suffix: match[2] ?? "" };
}

// Both `<img src="...">` and CSS `url(...)` reference a local asset path
// the same way; the only thing that differs between "inline as a data URI
// for a standalone PDF" and "copy into an assets folder next to the HTML"
// is what `resolvePath` does with that path once found.
async function rewriteAssetPaths(
  html: string,
  resolvePath: (rawPath: string) => Promise<string | null>,
): Promise<string> {
  async function rewriteMatches(
    source: string,
    regex: RegExp,
    replace: (match: RegExpMatchArray, resolved: string) => string,
  ): Promise<string> {
    let result = "";
    let cursor = 0;
    for (const match of source.matchAll(regex)) {
      const index = match.index ?? 0;
      result += source.slice(cursor, index);
      cursor = index + match[0].length;

      const resolved = await resolvePath(match[2]);
      result += resolved ? replace(match, resolved) : match[0];
    }
    return result + source.slice(cursor);
  }

  const withImagesRewritten = await rewriteMatches(
    html,
    /(<img[^>]*\ssrc=")([^"]+)(")/g,
    (match, resolved) => `${match[1]}${escapeHtml(resolved)}${match[3]}`,
  );
  return rewriteMatches(
    withImagesRewritten,
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
    (match, resolved) =>
      `url(${match[1] ?? ""}${escapeHtml(resolved)}${match[1] ?? ""})`,
  );
}

async function inlineLocalAssetUrlsForPdf(
  html: string,
  baseDir: string,
): Promise<string> {
  const cache = new Map<string, string>();

  return rewriteAssetPaths(html, async (rawPath) => {
    if (isExternalOrAbsolutePath(rawPath)) return null;
    const { path } = splitPathAndSuffix(rawPath);
    const resolved = resolve(baseDir, path);
    const cached = cache.get(resolved);
    if (cached) return cached;

    try {
      const stats = await stat(resolved);
      if (!stats.isFile()) return null;
      const bytes = await readFile(resolved);
      const dataUri = `data:${inferMimeType(resolved)};base64,${bytes.toString(
        "base64",
      )}`;
      cache.set(resolved, dataUri);
      return dataUri;
    } catch {
      return null;
    }
  });
}

async function materializeLocalImageAssets(
  html: string,
  markdownPath: string,
  outputPath: string,
): Promise<string> {
  const mdDir = dirname(markdownPath);
  const outAssetsDir = join(dirname(outputPath), "assets");

  const pathToName = new Map<string, string>();
  const usedNames = new Set<string>();
  const missingSources = new Set<string>();

  const result = await rewriteAssetPaths(html, async (rawPath) => {
    if (isExternalOrAbsolutePath(rawPath)) return null;

    const { path, suffix } = splitPathAndSuffix(rawPath);
    const sourcePath = resolve(mdDir, path);

    try {
      const stats = await stat(sourcePath);
      if (!stats.isFile()) {
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
          assetName = `${originalName.slice(0, dot)}-${counter}${originalName.slice(
            dot,
          )}`;
        }
        counter += 1;
      }

      usedNames.add(assetName);
      pathToName.set(sourcePath, assetName);
    }

    await mkdir(outAssetsDir, { recursive: true });
    await copyFile(sourcePath, join(outAssetsDir, assetName));
    return `./assets/${assetName}${suffix}`;
  });

  for (const missingSource of missingSources) {
    console.warn(
      `Image source not found: ${relative(
        ROOT,
        missingSource,
      )} (from ${markdownPath})`,
    );
  }
  return result;
}

async function runRender(args: string[]): Promise<void> {
  const flags = parseGlobalFlags(args);
  if (flags.watch) return watchAndRerender(flags);
  await renderOnce(flags);
}

async function watchAndRerender(flags: GlobalFlags): Promise<void> {
  const watchFolder = await resolveInputFolder(flags.inputFolder);

  let running = false;
  let pending = false;
  const rerender = async () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await renderOnce(flags);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    } finally {
      running = false;
      if (pending) {
        pending = false;
        void rerender();
      }
    }
  };

  let timer: ReturnType<typeof setTimeout> | null = null;
  const scheduleRerender = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(rerender, 150);
  };

  // Register the watcher before the (possibly slow) initial render so a
  // save made while that render is still in flight isn't missed: fs.watch
  // only reports changes that occur after it starts listening.
  // ponytail: recursive fs.watch is macOS/Windows-only; add a directory
  // walker + per-file watchers if Linux support is ever needed.
  watch(watchFolder, { recursive: true }, scheduleRerender);
  console.log(
    `Watching ${relative(ROOT, watchFolder)} for changes... (ctrl-c to stop)`,
  );
  await rerender();
  await new Promise<never>(() => {});
}

function buildResumeHtmlDocument(
  data: FrontmatterData,
  htmlFragment: string,
  css: string,
): string {
  const lang = typeof data.lang === "string" ? data.lang : "en";
  const fontFamily =
    data.font?.family?.trim() ||
    extractPrimaryFontName(data.fonts) ||
    undefined;

  return buildHtmlDocument(htmlFragment, css, {
    lang,
    stylesheets: collectStylesheetUrls(data),
    page: data.page,
    font: { family: fontFamily },
  });
}

/** Warns on stdout if `html` overflows a single physical page. Only runs when `single_page: true`. Returns whether it warned. */
async function warnIfOverflowing(
  data: FrontmatterData,
  html: string,
  sourceHtmlPath: string,
): Promise<boolean> {
  if (data.single_page !== true) return false;

  const { height: pageHeightMm } = resolvePageDimensionsMm(
    data.page?.size?.trim() || "A4",
  );
  const overflow = await measurePageOverflow(html, {
    pageHeightMm,
    sourceHtmlPath,
  });
  if (overflow.overflowRatio <= 0.02) return false;

  console.log(
    `Warning: content overflows a single page by ${Math.round(
      overflow.overflowRatio * 100,
    )}% (~${overflow.estimatedPages.toFixed(2)} pages).`,
  );
  return true;
}

async function renderOnce(flags: GlobalFlags): Promise<void> {
  const { inputFolder, outputFolder, mdFlag, styleFlag, wantsPdf } = flags;

  const inputMarkdown = await resolveInputMarkdownPath(inputFolder, mdFlag);
  const stylePath = await resolveStylePath(
    await resolveInputFolder(inputFolder),
    styleFlag,
  );
  const outputBasename = basename(inputMarkdown, extname(inputMarkdown));
  const outputHtml = join(outputFolder, `${outputBasename}.html`);
  const outputPdf = join(outputFolder, `${outputBasename}.pdf`);

  const markdown = await readFile(inputMarkdown, "utf-8");
  const { data, html: htmlFragment, issues } = renderMarkdown(markdown);
  console.log(`Validation: ${issues.length} issue(s)`);
  for (const issue of issues) {
    console.log(
      `  ${issue.line ? `line ${issue.line}: ` : ""}${issue.message}`,
    );
  }

  const css = stylePath ? await readFile(stylePath, "utf-8") : "";
  const htmlDocument = buildResumeHtmlDocument(data, htmlFragment, css);
  const htmlWithLocalAssets = await materializeLocalImageAssets(
    htmlDocument,
    inputMarkdown,
    outputHtml,
  );

  await mkdir(dirname(outputHtml), { recursive: true });
  await writeFile(outputHtml, htmlWithLocalAssets, "utf-8");
  console.log(`HTML written to ${relative(ROOT, outputHtml)}`);

  await warnIfOverflowing(data, htmlWithLocalAssets, outputHtml);

  if (!wantsPdf) return;

  const pdfGenerator = new HtmlToPdfGenerator();
  const pdfHtmlWithBase = injectBaseHref(
    htmlWithLocalAssets,
    dirname(outputHtml),
  );
  const pdfHtml = await inlineLocalAssetUrlsForPdf(
    pdfHtmlWithBase,
    dirname(outputHtml),
  );
  await pdfGenerator.generate(pdfHtml, outputPdf, {
    title: "Resume",
    sourceHtmlPath: outputHtml,
    pageFormat: data.page?.size,
    pageMargin: formatPageMargin(data.page?.margin),
  });
  console.log(`PDF written to ${relative(ROOT, outputPdf)}`);
}

async function runCheck(args: string[]): Promise<void> {
  const { inputFolder, mdFlag } = parseGlobalFlags(args);
  const inputMarkdown = await resolveInputMarkdownPath(inputFolder, mdFlag);
  const markdown = await readFile(inputMarkdown, "utf-8");
  const { data, html: htmlFragment, issues } = renderMarkdown(markdown);

  console.log(`Validation: ${issues.length} issue(s)`);
  for (const issue of issues) {
    console.log(
      `  ${issue.line ? `line ${issue.line}: ` : ""}${issue.message}`,
    );
  }
  if (issues.length > 0) process.exitCode = 1;

  if (data.single_page !== true) return;

  const stylePath = await resolveStylePath(
    await resolveInputFolder(inputFolder),
    null,
  );
  const css = stylePath ? await readFile(stylePath, "utf-8") : "";
  const htmlDocument = buildResumeHtmlDocument(data, htmlFragment, css);

  const tempDir = await mkdtemp(join(tmpdir(), "markdown-resume-check-"));
  try {
    const tempHtmlPath = join(tempDir, "resume.html");
    const htmlWithLocalAssets = await materializeLocalImageAssets(
      htmlDocument,
      inputMarkdown,
      tempHtmlPath,
    );
    await writeFile(tempHtmlPath, htmlWithLocalAssets, "utf-8");

    const overflowed = await warnIfOverflowing(
      data,
      htmlWithLocalAssets,
      tempHtmlPath,
    );
    if (overflowed) process.exitCode = 1;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const STYLE_BOILERPLATE = `:root {
  --page-bg: #dbe5ec;
  --paper: #fcfeff;
  --sidebar-bg: #d8e6ee;
  --sidebar-line: #b7cdda;
  --ink: #1f2b34;
  --muted: #506572;
  --soft: #6f8390;
  --line: #c6d8e3;
  --accent: #1c425b;
  --icon: #2b5f7d;
}

body {
  background: var(--page-bg);
  color: var(--ink);
  font-family: "Montserrat", "Avenir Next", "Segoe UI", Arial, sans-serif;
  font-size: 2.72mm;
  line-height: 1.42;
}

a {
  color: inherit;
  text-decoration: none;
}

.page {
  margin: 4.5mm auto;
  background: var(--paper);
}
`;

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function extractClassNames(html: string): string[] {
  const names = new Set<string>();
  for (const match of html.matchAll(/class="([^"]+)"/g)) {
    for (const name of match[1].trim().split(/\s+/)) {
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}

function buildEmptyClassCss(classNames: string[]): string {
  return classNames.map((name) => `.${name} {\n}\n`).join("\n");
}

async function runGenerateStyle(args: string[]): Promise<void> {
  const { inputFolder, outputFolder, mdFlag, styleFlag, force } =
    parseGlobalFlags(args);
  const outputPath = resolve(outputFolder, styleFlag ?? "styles.css");

  if (!force && (await pathExists(outputPath))) {
    throw new Error(
      `${relative(
        ROOT,
        outputPath,
      )} already exists; pass -style <name> to write elsewhere, or -f to overwrite.`,
    );
  }

  let content = STYLE_BOILERPLATE;
  try {
    const inputMarkdown = await resolveInputMarkdownPath(inputFolder, mdFlag);
    const markdown = await readFile(inputMarkdown, "utf-8");
    const { html } = renderMarkdown(markdown);
    content += `\n${buildEmptyClassCss(extractClassNames(html))}`;
  } catch {
    // No resume markdown found (e.g. scaffolding a brand-new project) -
    // fall back to boilerplate alone rather than failing the command.
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf-8");
  console.log(
    `Stylesheet boilerplate written to ${relative(ROOT, outputPath)}`,
  );
}

export async function run(
  rawArgs: string[] = process.argv.slice(2),
): Promise<void> {
  // `pnpm run cli -- <args>` forwards the `--` itself instead of stripping it.
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
  const [command, ...rest] = args;

  switch (command) {
    case "generate-style":
      return runGenerateStyle(rest);
    case "check":
      return runCheck(rest);
    default:
      return runRender(args);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
