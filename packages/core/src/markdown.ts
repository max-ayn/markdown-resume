import MarkdownIt from "markdown-it";
import matter from "gray-matter";

import containerPlugin from "./rules/container.ts";
import datePlugin from "./rules/date.ts";
import fieldsPlugin from "./rules/fields.ts";
import notePlugin from "./rules/note.ts";
import { ICON_PROVIDERS, makeIconPlugin } from "./rules/icon.ts";
import pairPlugin from "./rules/pair.ts";
import { IMAGE_BANKS, makeImagePlugin } from "./rules/image.ts";
import stackPlugin from "./rules/stack.ts";
import hiddenPlugin from "./rules/hidden.ts";
import headingAttrsPlugin from "./rules/headingAttrs.ts";
import regionsPlugin from "./rules/regions.ts";
import { validateDocument } from "./validation.ts";
import type { FrontmatterData, RenderResult } from "./types.ts";

export const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(containerPlugin);
md.use(datePlugin);
md.use(fieldsPlugin);
md.use(notePlugin);
md.use(makeIconPlugin(ICON_PROVIDERS));
md.use(pairPlugin);
md.use(makeImagePlugin(IMAGE_BANKS));
md.use(hiddenPlugin);
md.use(stackPlugin);
md.use(headingAttrsPlugin);
md.use(regionsPlugin);

function normaliseDateFormat(pattern: string) {
  return pattern
    .replace(/\bmm\b/g, "MMM")
    .replace(/\bYYYY\b/g, "yyyy")
    .replace(/\bYY\b/g, "yy");
}

function parseDateConfig(dateConfig: FrontmatterData["date"]) {
  const formats: Record<string, string> = {};
  let defaultFormat = "MMM yyyy";

  const entries = Array.isArray(dateConfig)
    ? dateConfig
    : dateConfig
    ? [dateConfig]
    : [];

  entries.forEach((entry) => {
    Object.entries(entry).forEach(([key, value]) => {
      if (key === "default") {
        defaultFormat = normaliseDateFormat(value);
        return;
      }
      formats[key] = normaliseDateFormat(value);
    });
  });

  return { formats, default: defaultFormat };
}

function buildEnv(data: FrontmatterData) {
  return {
    images: data.images ?? {},
    custom: {
      field: data.custom?.field ?? ["title", "subtitle", "summary"],
    },
    date: parseDateConfig(data.date),
    regions: data.regions ?? {},
  };
}

export function renderMarkdown(raw: string): RenderResult {
  const { data, content } = matter(raw);
  const frontmatter = data as FrontmatterData;
  const issues = validateDocument(content, frontmatter);
  const env = buildEnv(frontmatter);
  const html = md.render(content, env);

  return { data: frontmatter, html, issues };
}
