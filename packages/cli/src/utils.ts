import { readdir, stat } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type FrontmatterData,
  measurePageOverflow,
  resolvePageDimensionsMm,
} from "@markdown-resume/core";
import { consola } from "consola";

export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// `pnpm run cli -- <args>` forwards the `--` itself instead of stripping it.
export function normalizeArgv(rawArgv: readonly string[]): string[] {
  return rawArgv[0] === "--" ? rawArgv.slice(1) : [...rawArgv];
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
export async function resolveInputFolder(inputFolder: string): Promise<string> {
  const stats = await stat(inputFolder).catch(() => null);
  return stats?.isFile() ? dirname(inputFolder) : inputFolder;
}

export async function resolveInputMarkdownPath(
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
      )}); pass --md <filename> to disambiguate.`,
    );
  }
  return resolve(inputFolder, matches[0]);
}

export async function resolveStylePath(
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
      )}); pass --style <path> to disambiguate.`,
    );
  }
  return resolve(inputFolder, matches[0]);
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Warns if `html` overflows a single physical page. Only runs when `single_page: true`. Returns whether it warned. */
export async function warnIfOverflowing(
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

  consola.warn(
    `Content overflows a single page by ${Math.round(
      overflow.overflowRatio * 100,
    )}% (~${overflow.estimatedPages.toFixed(2)} pages).`,
  );
  return true;
}
