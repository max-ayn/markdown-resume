import { dirname, extname, resolve } from "@std/path";
import { MarkdownHtmlGenerator } from "../../../src/generate_html.ts";

const htmlGenerator = new MarkdownHtmlGenerator();

type RenderInput = {
  markdown: string;
  css: string;
  markdownPath?: string;
  cssPath?: string;
};

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function toDataUrl(bytes: Uint8Array, path: string): string {
  const mime = MIME_BY_EXT[extname(path).toLowerCase()] ??
    "application/octet-stream";
  return `data:${mime};base64,${toBase64(bytes)}`;
}

function isRemoteOrAbsolutePath(value: string): boolean {
  const v = value.trim();
  return v.startsWith("http://") || v.startsWith("https://") ||
    v.startsWith("data:") || v.startsWith("blob:") || v.startsWith("file:") ||
    v.startsWith("/") || v.startsWith("#");
}

function stripCssUrlWrapper(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

async function tryInlineAsset(path: string): Promise<string | null> {
  try {
    const stat = await Deno.stat(path);
    if (!stat.isFile) return null;
    const bytes = await Deno.readFile(path);
    return toDataUrl(bytes, path);
  } catch {
    return null;
  }
}

async function inlineCssUrls(css: string, cssDir: string): Promise<string> {
  let out = "";
  let cursor = 0;
  const regex = /url\(([^)]+)\)/g;

  for (const match of css.matchAll(regex)) {
    const full = match[0];
    const raw = match[1];
    const index = match.index ?? 0;
    out += css.slice(cursor, index);
    cursor = index + full.length;

    const assetRef = stripCssUrlWrapper(raw);
    if (isRemoteOrAbsolutePath(assetRef)) {
      out += full;
      continue;
    }

    const fsPath = resolve(cssDir, assetRef);
    const inlined = await tryInlineAsset(fsPath);
    out += inlined ? `url("${inlined}")` : full;
  }

  out += css.slice(cursor);
  return out;
}

async function inlineImageSrcs(html: string, markdownDir: string): Promise<string> {
  let out = "";
  let cursor = 0;
  const regex = /(<img[^>]*\ssrc=")([^"]+)(")/g;

  for (const match of html.matchAll(regex)) {
    const full = match[0];
    const prefix = match[1];
    const src = match[2];
    const suffix = match[3];
    const index = match.index ?? 0;
    out += html.slice(cursor, index);
    cursor = index + full.length;

    if (isRemoteOrAbsolutePath(src)) {
      out += full;
      continue;
    }

    const fsPath = resolve(markdownDir, src);
    const inlined = await tryInlineAsset(fsPath);
    out += inlined ? `${prefix}${inlined}${suffix}` : full;
  }

  out += html.slice(cursor);
  return out;
}

export async function renderWithAssets(input: RenderInput): Promise<string> {
  const markdownPath = input.markdownPath?.trim() || "";
  const cssPath = input.cssPath?.trim() || "";
  const markdownDir = markdownPath ? dirname(markdownPath) : Deno.cwd();
  const cssDir = cssPath ? dirname(cssPath) : markdownDir;
  const css = await inlineCssUrls(input.css, cssDir);
  const html = htmlGenerator.renderDocument(input.markdown, css);
  return await inlineImageSrcs(html, markdownDir);
}

