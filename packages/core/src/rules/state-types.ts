// markdown-it ships no bundled type declarations for its deep `lib/**/*.mjs`
// entry points, and @types/markdown-it only covers the package root. These
// are minimal structural types covering exactly what the rule plugins use.
import type MarkdownIt from "markdown-it";

export interface Token {
  type: string;
  tag: string;
  nesting: -1 | 0 | 1;
  content: string;
  markup: string;
  block: boolean;
  map: [number, number] | null;
  children: Token[] | null;
  meta: unknown;
  attrs: [string, string][] | null;
  attrSet(name: string, value: string): void;
  attrJoin(name: string, value: string): void;
}

export function makeToken(
  type: string,
  tag: string,
  nesting: -1 | 0 | 1,
): Token {
  const attrs: [string, string][] = [];
  return {
    type,
    tag,
    nesting,
    content: "",
    markup: "",
    block: true,
    map: null,
    children: null,
    meta: null,
    attrs,
    attrSet(name, value) {
      const existing = attrs.find(([attrName]) => attrName === name);
      if (existing) existing[1] = value;
      else attrs.push([name, value]);
    },
    attrJoin(name, value) {
      const existing = attrs.find(([attrName]) => attrName === name);
      if (existing) existing[1] = `${existing[1]} ${value}`;
      else attrs.push([name, value]);
    },
  };
}

export interface StateBlock {
  src: string;
  env: unknown;
  line: number;
  bMarks: number[];
  eMarks: number[];
  tShift: number[];
  md: MarkdownIt;
  push(type: string, tag: string, nesting: -1 | 0 | 1): Token;
}

export interface StateInline {
  src: string;
  env: unknown;
  pos: number;
  posMax: number;
  md: MarkdownIt;
  push(type: string, tag: string, nesting: -1 | 0 | 1): Token;
}

export interface StateCore {
  tokens: Token[];
  env: unknown;
}
