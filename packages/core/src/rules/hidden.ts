import type MarkdownIt from "markdown-it";
import type { StateBlock } from "./state-types.ts";

const marker = "@hidden";
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const ID_SUFFIX_RE = /\s*\{\.([a-zA-Z0-9_-]+)\}\s*$/;

// A line starting with @hidden is removed from the final render.
// Example:
//   @hidden this never appears in the HTML output
//
// `@hidden ## Heading {.id}` is a special case: it still becomes a real
// (empty, invisible) heading token carrying the `.id` class, so
// rules/regions.ts can still anchor a region to this section even though
// nothing about it is visible.
function hiddenRule(
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
  ) {
    return false;
  }

  if (silent) return true;

  const rest = state.src.slice(pos + marker.length, max).trim();
  const headingMatch = rest.match(HEADING_RE);

  if (headingMatch) {
    const [, hashes, text] = headingMatch;
    const idMatch = text.match(ID_SUFFIX_RE);
    const tag = `h${hashes.length}`;

    const openToken = state.push("heading_open", tag, 1);
    openToken.markup = hashes;
    openToken.meta = { hidden: true };
    if (idMatch) openToken.attrSet("class", idMatch[1]);

    const inlineToken = state.push("inline", "", 0);
    inlineToken.content = "";
    inlineToken.children = [];

    const closeToken = state.push("heading_close", tag, -1);
    closeToken.meta = { hidden: true };

    state.line = startLine + 1;
    return true;
  }

  state.line = startLine + 1; // advance without pushing a token -> line is dropped

  return true;
}

export default function hiddenPlugin(md: MarkdownIt): void {
  md.block.ruler.before("paragraph", "hidden", hiddenRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  md.core.ruler.after("block", "hidden", (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length - 2; i++) {
      if (tokens[i].type !== "paragraph_open") continue;
      if (tokens[i + 1].type !== "inline") continue;
      if (!tokens[i + 1].content.trimStart().startsWith("@hidden")) continue;
      if (tokens[i + 2].type !== "paragraph_close") continue;

      tokens.splice(i, 3);
      i -= 1;
    }
  });

  const defaultHeadingOpen = md.renderer.rules.heading_open;
  const defaultHeadingClose = md.renderer.rules.heading_close;

  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    if ((tokens[idx].meta as { hidden?: boolean } | null)?.hidden) return "";
    return defaultHeadingOpen
      ? defaultHeadingOpen(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
    if ((tokens[idx].meta as { hidden?: boolean } | null)?.hidden) return "";
    return defaultHeadingClose
      ? defaultHeadingClose(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options);
  };
}
