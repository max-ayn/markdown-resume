import type MarkdownIt from "markdown-it";
import type { StateBlock } from "./state-types.ts";

const marker = "@note";

function noteRule(
  state: StateBlock,
  startLine: number,
  _endLine: number,
  silent: boolean,
): boolean {
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  if (state.src.slice(pos, pos + marker.length) !== marker) return false;
  const nextChar = state.src[pos + marker.length];
  if (
    nextChar !== undefined && nextChar !== " " && nextChar !== "\n" &&
    nextChar !== "\r"
  ) return false;

  const content = state.src.slice(pos + marker.length, max).trim();
  if (!content) return false;

  if (silent) return true;

  state.push("blockquote_open", "blockquote", 1).markup = "@note";

  state.push("paragraph_open", "p", 1);
  const inlineToken = state.push("inline", "", 0);
  inlineToken.content = content;
  inlineToken.map = [startLine, startLine + 1];
  inlineToken.children = [];
  state.push("paragraph_close", "p", -1);

  state.push("blockquote_close", "blockquote", -1).markup = "@note";

  state.line = startLine + 1;
  return true;
}

export default function notePlugin(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "note", noteRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
}
