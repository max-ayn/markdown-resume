import type MarkdownIt from "markdown-it";
import type { StateCore } from "./state-types.ts";

export default function headingAttrsPlugin(md: MarkdownIt): void {
  function headingAttrs(state: StateCore): void {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "heading_open") continue;

      const inlineToken = tokens[i + 1];
      if (inlineToken?.type !== "inline") continue;

      const match = inlineToken.content.match(/\s*\{\.([a-zA-Z0-9_-]+)\}\s*$/);
      if (match) {
        inlineToken.content = inlineToken.content.slice(0, match.index);
        // `md.parseInline()` would re-run the whole core ruler chain
        // (including plugins registered after this one, e.g. regionsPlugin)
        // on this single-token reparse. Use the inline-only parser instead.
        const children: NonNullable<typeof inlineToken.children> = [];
        // `md.inline.parse` is typed against the real markdown-it Token,
        // which our local structural type doesn't fully mirror.
        md.inline.parse(inlineToken.content, md, state.env, children as never);
        inlineToken.children = children;
        tokens[i].attrSet("class", match[1]);
      }
    }
  }

  md.core.ruler.push("heading_attrs", headingAttrs);
}
