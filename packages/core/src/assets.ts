import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

/**
 * Rewrites every local `<img src="...">` and CSS `url(...)` reference in `html`.
 * Both reference a local asset path the same way; the only thing that differs
 * between "inline as a data URI" and "copy into an assets folder" is what
 * `resolvePath` does with the path once found.
 */
export async function rewriteAssetPaths(
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

/** Inlines every local image/CSS asset referenced by `html` as a `data:` URI, for a standalone PDF. */
export async function inlineLocalAssetUrlsForPdf(
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

/**
 * Copies every local image/CSS asset referenced by `html` into an `assets/`
 * folder next to `outputPath`, and rewrites the references to point there.
 */
export async function materializeLocalImageAssets(
  html: string,
  markdownPath: string,
  outputPath: string,
): Promise<{ html: string; missingSources: string[] }> {
  const mdDir = dirname(markdownPath);
  const outAssetsDir = join(dirname(outputPath), "assets");

  const pathToName = new Map<string, string>();
  const usedNames = new Set<string>();
  const missingSources = new Set<string>();

  const rewritten = await rewriteAssetPaths(html, async (rawPath) => {
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

  return { html: rewritten, missingSources: [...missingSources] };
}
