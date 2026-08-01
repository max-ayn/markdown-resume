import type MarkdownIt from "markdown-it";
import type { StateBlock, Token } from "./state-types.ts";

const OPEN_RE = /^:::([a-zA-Z0-9_-]+)?(?:\{([^}]*)\})?\s*$/;

function parseAttrs(
  raw?: string,
): { classes: string[]; attrs: [string, string][] } {
  const classes: string[] = [];
  const attrs: [string, string][] = [];
  if (!raw) return { classes, attrs };

  raw.trim().split(/\s+/).forEach((token) => {
    if (!token) return;
    if (token.startsWith(".")) {
      classes.push(token.slice(1));
    } else if (token.includes("=")) {
      const [key, ...rest] = token.split("=");
      attrs.push([key, rest.join("=").replace(/^"|"$/g, "")]);
    }
  });

  return { classes, attrs };
}

function containerRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const startMax = state.eMarks[startLine];
  const firstLine = state.src.slice(startPos, startMax).trim();

  const match = firstLine.match(OPEN_RE);
  if (!match) return false;

  const [, name, attrsRaw] = match;

  let nextLine = startLine;
  let closed = false;

  while (nextLine < endLine) {
    nextLine++;
    const pos = state.bMarks[nextLine] + state.tShift[nextLine];
    const max = state.eMarks[nextLine];
    if (state.src.slice(pos, max).trim() === ":::") {
      closed = true;
      break;
    }
  }

  if (!closed) return false;
  if (silent) return true;

  const { classes, attrs } = parseAttrs(attrsRaw);
  classes.unshift("resume-block");
  if (name) classes.push(name);

  const openToken: Token = state.push("container_open", "div", 1);
  if (classes.length) openToken.attrSet("class", classes.join(" "));
  attrs.forEach(([key, value]) => {
    if (key === "role") {
      openToken.attrSet("data-region", value);
      openToken.attrJoin("class", `resume-block--${value}`);
      return;
    }
    if (key === "kind") {
      openToken.attrJoin("class", `resume-block--${value}`);
    }
    openToken.attrSet(`data-${key}`, value);
  });
  openToken.map = [startLine, nextLine];
  openToken.markup = ":::";

  // `md.block` is typed against the real markdown-it StateBlock, which our
  // local structural type doesn't fully mirror.
  state.md.block.tokenize(state as never, startLine + 1, nextLine);

  const closeToken: Token = state.push("container_close", "div", -1);
  closeToken.markup = ":::";
  state.line = nextLine + 1;

  return true;
}

export default function containerPlugin(md: MarkdownIt): void {
  md.block.ruler.before("fence", "container", containerRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
}
