import type MarkdownIt from "markdown-it";
import type { StateBlock, Token } from "./state-types.ts";

interface IconProvider {
  url: (icon: string) => string;
}

type IconProviders = Record<string, IconProvider>;

// Provider dictionary: each key resolves an icon name to a CDN URL. Used
// only when a marker explicitly requests it (`@icon:fa name`); a bare
// `@icon name` renders as a plain icon-font span, matching the ligature-font
// setup (Material Symbols, Font Awesome webfont, ...) already loaded via the
// frontmatter `icons` stylesheet list.
export const ICON_PROVIDERS: IconProviders = {
  fa: {
    url: (icon) =>
      `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free/svgs/solid/${icon}.svg`,
  },
  // FontAwesome ships brand logos (github, linkedin, ...) in a separate
  // "brands" set from its "solid" glyph set - same CDN, different folder.
  "fa-brands": {
    url: (icon) =>
      `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free/svgs/brands/${icon}.svg`,
  },
  feather: {
    url: (icon) => `https://cdn.jsdelivr.net/npm/feather-icons/icons/${icon}.svg`,
  },
};

export function makeIconPlugin(providers: IconProviders) {
  return function iconPlugin(md: MarkdownIt): void {
    function iconRule(
      state: StateBlock,
      startLine: number,
      _endLine: number,
      silent: boolean,
    ): boolean {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const marker = "@icon";

      if (state.src.slice(pos, pos + marker.length) !== marker) return false;

      let cursor = pos + marker.length;
      let provider: string | null = null;

      if (state.src[cursor] === ":") {
        cursor++;
        const keyStart = cursor;
        while (cursor < max && /[a-zA-Z0-9_-]/.test(state.src[cursor])) cursor++;
        provider = state.src.slice(keyStart, cursor);
        if (!provider) return false;
      }

      const nextChar = state.src[cursor];
      if (
        nextChar !== undefined && nextChar !== " " && nextChar !== "\n" &&
        nextChar !== "\r"
      ) return false;

      const rest = state.src.slice(cursor, max).trim();
      if (!rest) return false;

      if (silent) return true;

      const [iconNameRaw, textRaw] = rest.split("|");
      const iconName = iconNameRaw.trim();
      const text = textRaw !== undefined ? textRaw.trim() : null;

      const token: Token = state.push("icon", "", 0);
      token.block = true;
      token.meta = { provider, icon: iconName, text };
      token.map = [startLine, startLine + 1];

      state.line = startLine + 1;
      return true;
    }

    md.block.ruler.before("paragraph", "icon", iconRule, {
      alt: ["paragraph", "reference", "blockquote", "list"],
    });

    md.renderer.rules.icon = (tokens, idx) => {
      const { provider, icon, text } = tokens[idx].meta as {
        provider: string | null;
        icon: string;
        text: string | null;
      };

      const iconHtml = provider && providers[provider]
        ? `<img src="${providers[provider].url(icon)}" class="icon icon-${provider}" alt="${icon}" />`
        : `<span class="resume-block__icon material-symbols-outlined" data-icon="${md.utils.escapeHtml(icon)}">${md.utils.escapeHtml(icon)}</span>`;

      if (text) {
        const textHtml = md.renderInline(text);
        return `<span class="icon-line resume-block__item"><span class="resume-block__icon-wrap">${iconHtml}</span><span class="icon-text resume-block__item-text">${textHtml}</span></span>\n`;
      }

      return `<span class="icon-line">${iconHtml}</span>\n`;
    };
  };
}
