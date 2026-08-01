import type MarkdownIt from "markdown-it";
import type { StateBlock, Token } from "./state-types.ts";

function pairRule(
  state: StateBlock,
  startLine: number,
  _endLine: number,
  silent: boolean,
): boolean {
  const pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];
  const marker = "@pair";

  if (state.src.slice(pos, pos + marker.length) !== marker) return false;

  const nextChar = state.src[pos + marker.length];
  if (nextChar !== undefined && nextChar !== " " && nextChar !== "\n" && nextChar !== "\r") {
    return false;
  }

  const rest = state.src.slice(pos + marker.length, max).trim();
  if (!rest || !rest.includes("|")) return false;

  if (silent) return true;

  const [labelRaw, valueRaw] = rest.split("|");
  const token: Token = state.push("pair", "", 0);
  token.block = true;
  token.meta = { label: labelRaw.trim(), value: valueRaw.trim() };
  token.map = [startLine, startLine + 1];

  state.line = startLine + 1;
  return true;
}

export default function pairPlugin(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "pair", pairRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.renderer.rules.pair = (tokens, idx) => {
    const { label, value } = tokens[idx].meta as { label: string; value: string };
    const labelHtml = md.renderInline(label);
    const valueHtml = md.renderInline(value);

    const numericValue = parseFloat(value);
    const style = Number.isFinite(numericValue) ? ` style="--pair-value: ${numericValue}%"` : "";

    return `<div class="resume-pair" data-value="${md.utils.escapeHtml(value)}"${style}><span class="resume-pair__label">${labelHtml}</span><span class="resume-pair__value">${valueHtml}</span></div>\n`;
  };
}
