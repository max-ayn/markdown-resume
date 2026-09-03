import type MarkdownIt from "markdown-it";
import type { StateBlock } from "./state-types.ts";

type FieldsEnv = {
  custom?: {
    field?: string[];
  };
};

const DEFAULT_FIELD_NAMES = ["title", "subtitle", "summary"] as const;

function getFieldNames(env: FieldsEnv): string[] {
  const names = env.custom?.field?.filter(Boolean);
  return names?.length ? names : [...DEFAULT_FIELD_NAMES];
}

function fieldRule(
  state: StateBlock,
  startLine: number,
  _endLine: number,
  silent: boolean,
): boolean {
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const line = state.src.slice(pos, max);

  const names = getFieldNames(state.env as FieldsEnv).sort(
    (a, b) => b.length - a.length,
  );
  const match = names.find((name) => line.startsWith(`@${name}`));
  if (!match) return false;

  const marker = `@${match}`;
  const nextChar = line[marker.length];
  if (
    nextChar !== undefined &&
    nextChar !== " " &&
    nextChar !== "\n" &&
    nextChar !== "\r"
  )
    return false;

  const content = line.slice(marker.length).trim();
  if (!content) return false;

  if (silent) return true;

  const openToken = state.push(`${match}_open`, "div", 1);
  openToken.attrSet("class", `resume-field resume-field--${match}`);
  openToken.map = [startLine, startLine + 1];

  const inlineToken = state.push("inline", "", 0);
  inlineToken.content = content;
  inlineToken.map = [startLine, startLine + 1];
  inlineToken.children = [];

  state.push(`${match}_close`, "div", -1);
  state.line = startLine + 1;

  return true;
}

export default function fieldsPlugin(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "field", fieldRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
}
