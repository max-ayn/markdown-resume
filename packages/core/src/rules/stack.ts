import type MarkdownIt from "markdown-it";
import type { StateBlock } from "./state-types.ts";

const marker = "@stack";

function stackRule(
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

  const line = state.src.slice(pos + marker.length, max).trim();
  if (!line) return false;

  if (silent) return true;

  const items = line.split(",").map((s) => s.trim()).filter(Boolean);

  const openToken = state.push("stack_open", "ul", 1);
  openToken.attrSet("class", "resume-block__stack stack-list");

  items.forEach((item) => {
    state.push("stack_item_open", "li", 1);
    const inlineToken = state.push("inline", "", 0);
    inlineToken.content = item;
    inlineToken.children = [];
    state.push("stack_item_close", "li", -1);
  });

  state.push("stack_close", "ul", -1);
  state.line = startLine + 1;

  return true;
}

export default function stackPlugin(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "stack", stackRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules.stack_item_open = () => '<li class="resume-block__stack-badge">';
}
