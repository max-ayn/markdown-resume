import type MarkdownIt from "markdown-it";
import type { StateBlock, Token } from "./state-types.ts";

interface ImageBank {
  resolve: (path: string) => string;
}

type ImageBanks = Record<string, ImageBank>;
type ImageEnv = {
  images?: Record<string, string>;
};

// Each key resolves a path to a final URL. `@image:bank path` uses one of
// these; plain `@image key` looks `key` up in the frontmatter `images` map.
export const IMAGE_BANKS: ImageBanks = {
  assets: {
    resolve: (name) => `/assets/img/${name}`,
  },
  cdn: {
    resolve: (name) => `https://cdn.example.com/images/${name}`,
  },
};

export function makeImagePlugin(banks: ImageBanks) {
  return function imagePlugin(md: MarkdownIt): void {
    function imageRule(
      state: StateBlock,
      startLine: number,
      _endLine: number,
      silent: boolean,
    ): boolean {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const marker = "@image";

      if (state.src.slice(pos, pos + marker.length) !== marker) return false;

      const rest = state.src.slice(pos + marker.length, max).trim();
      if (!rest) return false;

      if (silent) return true;

      const env = state.env as ImageEnv;
      let src = "";
      let alt = "";
      let caption: string | null = null;

      const bankMatch = rest.match(/^:([a-zA-Z0-9_-]+)\s+(.*)$/);
      if (bankMatch) {
        const [, bankKey, tail] = bankMatch;
        const bank = banks[bankKey];
        if (!bank) return false;

        const [pathRaw, captionRaw] = tail.split("|");
        const filePath = pathRaw.trim();
        src = bank.resolve(filePath);
        caption = captionRaw !== undefined ? captionRaw.trim() : null;
        alt = caption || filePath;
      } else {
        const [imageKeyRaw, captionRaw] = rest.split("|");
        const imageKey = imageKeyRaw.trim();
        const filePath = env.images?.[imageKey];
        if (!filePath) return false;

        src = filePath;
        caption = captionRaw !== undefined ? captionRaw.trim() : null;
        alt = caption || imageKey;
      }

      const token: Token = state.push("image_block", "", 0);
      token.block = true;
      token.meta = { src, alt, caption };
      token.map = [startLine, startLine + 1];

      state.line = startLine + 1;
      return true;
    }

    md.block.ruler.before("paragraph", "image_block", imageRule, {
      alt: ["paragraph", "reference", "blockquote", "list"],
    });

    md.renderer.rules.image_block = (tokens, idx) => {
      const { src, alt, caption } = tokens[idx].meta as {
        src: string;
        alt: string;
        caption: string | null;
      };
      const img = `<img src="${src}" alt="${alt}" class="resume-block__image image-block-img" />`;

      if (caption) {
        const captionHtml = md.renderInline(caption);
        return `<figure class="resume-block__image image-block">${img}<figcaption>${captionHtml}</figcaption></figure>\n`;
      }

      return `<figure class="resume-block__image image-block">${img}</figure>\n`;
    };
  };
}
