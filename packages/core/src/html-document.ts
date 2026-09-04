import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { FrontmatterData } from "./types.ts";

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

/** Uniform page margin (CSS length) as declared in frontmatter, or "0". */
export function formatPageMargin(margin: string | number | undefined): string {
  if (typeof margin === "number") return margin === 0 ? "0" : `${margin}mm`;
  const trimmed = margin?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "0";
}

const PAGE_DIMENSIONS_MM: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
};

/** Physical page dimensions in millimeters for a `page.size` value, defaulting to A4. */
export function resolvePageDimensionsMm(size: string): {
  width: number;
  height: number;
} {
  return PAGE_DIMENSIONS_MM[size.trim().toUpperCase()] ?? PAGE_DIMENSIONS_MM.A4;
}

const DEFAULT_FONT_FALLBACK_STACK =
  '"Avenir Next", "Segoe UI", Arial, sans-serif';

/** Wraps a rendered HTML fragment + CSS into a full standalone HTML document. */
export function buildHtmlDocument(
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

/** Builds the full resume HTML document from parsed frontmatter + rendered content. */
export function buildResumeHtmlDocument(
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

/** Injects/replaces a `<base href>` tag so relative asset URLs resolve against `baseDir`. */
export function injectBaseHref(html: string, baseDir: string): string {
  const normalizedBaseDir = resolve(baseDir);
  const baseHref = pathToFileURL(`${normalizedBaseDir}/`).href;
  const baseTag = `<base href="${escapeHtml(baseHref)}" />`;

  if (/<base\s+/i.test(html)) {
    return html.replace(/<base[^>]*>/i, baseTag);
  }

  return html.replace(/<head>/i, `<head>\n    ${baseTag}`);
}
