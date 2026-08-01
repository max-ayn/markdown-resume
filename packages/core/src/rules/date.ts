import type MarkdownIt from "markdown-it";
import type { StateInline } from "./state-types.ts";
import { format, isValid, parse } from "date-fns";

type DateConfig = {
  formats?: Record<string, string>;
  default?: string;
};

type NormalizedDateConfig = {
  formats: Record<string, string>;
  default: string;
};

type DateEnv = {
  date?: DateConfig;
};

const DEFAULT_DATE_FORMAT = "MMM yyyy";
// Deliberately excludes a bare "yyyy" pattern: date-fns would fill in the
// current month/day, turning "2018" into something like "Jul 2018".
const INPUT_FORMATS = ["dd/MM/yyyy", "MMM yyyy", "yyyy-MM-dd"];

function normaliseFormat(pattern: string): string {
  return pattern
    .replace(/\bmm\b/g, "MMM")
    .replace(/\bYYYY\b/g, "yyyy")
    .replace(/\bYY\b/g, "yy");
}

function getFormats(env: DateEnv): NormalizedDateConfig {
  const formats = env.date?.formats ?? {};
  const output: Record<string, string> = {};

  Object.entries(formats).forEach(([key, value]) => {
    output[key] = normaliseFormat(value);
  });

  return {
    formats: output,
    default: normaliseFormat(env.date?.default ?? DEFAULT_DATE_FORMAT),
  };
}

function parseDateValue(raw: string) {
  if (raw.toLowerCase() === "today" || raw.toLowerCase() === "present") {
    return "today" as const;
  }

  for (const inputFormat of INPUT_FORMATS) {
    const parsed = parse(raw, inputFormat, new Date());
    if (isValid(parsed)) return parsed;
  }

  return null;
}

function renderDate(
  md: MarkdownIt,
  raw: string,
  key: string | null,
  env: DateEnv,
): string {
  const { formats, default: defaultFormat } = getFormats(env);
  const parsed = parseDateValue(raw);
  const outputFormat = key ? formats[key] ?? defaultFormat : defaultFormat;
  const value = parsed === "today"
    ? raw
    : parsed
    ? format(parsed, outputFormat)
    : raw;
  const className = key ? `date date-${key}` : "date";
  return `<span class="${className}">${md.utils.escapeHtml(value)}</span>`;
}

function dateRule(state: StateInline, silent: boolean): boolean {
  const start = state.pos;
  const src = state.src;
  const marker = "@date";

  if (src.slice(start, start + marker.length) !== marker) return false;

  let pos = start + marker.length;
  let key: string | null = null;

  if (src[pos] === ":") {
    pos++;
    const keyStart = pos;
    while (pos < state.posMax && /[a-zA-Z0-9_-]/.test(src[pos])) pos++;
    key = src.slice(keyStart, pos);
    if (!key) return false;
  }

  if (
    pos < state.posMax && src[pos] !== " " && src[pos] !== "\n" &&
    src[pos] !== "\r"
  ) return false;
  while (pos < state.posMax && src[pos] === " ") pos++;

  const rawStart = pos;
  while (
    pos < state.posMax && src[pos] !== "|" && src[pos] !== "–" &&
    src[pos] !== "—" && src[pos] !== "\n" && src[pos] !== "\r" &&
    // A " - " is a range separator between two @date directives, but a bare
    // "-" must stay available for the "yyyy-MM-dd" input format.
    !(src[pos] === "-" && src[pos - 1] === " " && src[pos + 1] === " ")
  ) {
    pos++;
  }

  const untrimmed = src.slice(rawStart, pos);
  const raw = untrimmed.trim();
  if (!raw) return false;

  if (!silent) {
    const token = state.push("date", "", 0);
    token.content = renderDate(state.md, raw, key, state.env as DateEnv);
    token.meta = { key };
  }

  // Only consume the trimmed value - trailing whitespace before a "|" or
  // dash (e.g. the space in "01/11/2024 – Present") must stay in the
  // stream so it still renders as a separating space.
  state.pos = rawStart + untrimmed.replace(/\s+$/, "").length;
  return true;
}

export default function datePlugin(md: MarkdownIt): void {
  md.inline.ruler.before("text", "date", dateRule);
  md.renderer.rules.date = (tokens, idx) => tokens[idx].content;
}
