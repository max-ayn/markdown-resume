import {
  BlockAst,
  FieldAst,
  MarkdownLineAst,
  ResumeAstDocument,
  SectionAst,
} from "./types.ts";
import { stripQuotes } from "./utils.ts";

export type SerializeRawMarkdownOptions = {
  includeHidden?: boolean;
};

type MarkdownEntry =
  | { line: number; type: "line"; data: MarkdownLineAst }
  | { line: number; type: "block"; data: BlockAst };

/**
 * Serializes a semantic resume AST into plain Markdown without custom block
 * fences or directive syntax.
 */
export function serializeResumeToRawMarkdown(
  ast: ResumeAstDocument,
  options: SerializeRawMarkdownOptions = {},
): string {
  const includeHidden = options.includeHidden ?? false;
  const imageMap = extractImageMap(ast);
  const out: string[] = [];

  if (ast.title && ast.title.trim().length > 0) {
    out.push(`# ${ast.title.trim()}`);
  }

  const preambleLines = serializeEntries(
    ast.preamble.markdown,
    ast.preamble.blocks,
    imageMap,
    includeHidden,
  );
  if (preambleLines.length > 0) {
    if (out.length > 0) out.push("");
    out.push(...preambleLines);
  }

  for (const section of ast.sections) {
    const sectionLines = serializeSection(section, imageMap, includeHidden);
    if (sectionLines.length === 0) continue;

    if (out.length > 0) out.push("");
    out.push(...sectionLines);
  }

  return normalizeBlankLines(out).join("\n");
}

function serializeSection(
  section: SectionAst,
  imageMap: Record<string, string>,
  includeHidden: boolean,
): string[] {
  const body = serializeEntries(
    section.markdown,
    section.blocks,
    imageMap,
    includeHidden,
  );

  if (section.titleHidden && !includeHidden) return body;
  const prefix = section.titleHidden ? "@hidden " : "";
  return [`${prefix}## ${section.title}`, ...body];
}

function serializeEntries(
  markdown: MarkdownLineAst[],
  blocks: BlockAst[],
  imageMap: Record<string, string>,
  includeHidden: boolean,
): string[] {
  const entries: MarkdownEntry[] = [
    ...markdown.map((line) => ({
      line: line.line,
      type: "line" as const,
      data: line,
    })),
    ...blocks.map((block) => ({
      line: block.source.startLine,
      type: "block" as const,
      data: block,
    })),
  ];

  entries.sort((a, b) => a.line - b.line);

  const out: string[] = [];
  for (const entry of entries) {
    if (entry.type === "line") {
      if (entry.data.hidden && !includeHidden) continue;
      if (entry.data.value.trim().length === 0) continue;
      out.push(entry.data.value.trim());
      continue;
    }

    const blockLines = serializeBlock(entry.data, imageMap, includeHidden);
    if (blockLines.length > 0) out.push(...blockLines);
  }

  return out;
}

function serializeBlock(
  block: BlockAst,
  imageMap: Record<string, string>,
  includeHidden: boolean,
): string[] {
  if (block.hidden && !includeHidden) return [];

  const entries: Array<
    | { line: number; kind: "field"; value: FieldAst }
    | { line: number; kind: "item"; value: BlockAst["items"][number] }
    | { line: number; kind: "line"; value: MarkdownLineAst }
    | { line: number; kind: "child"; value: BlockAst }
  > = [];

  for (const field of block.fields) {
    entries.push({ line: field.line, kind: "field", value: field });
  }
  for (const item of block.items) {
    entries.push({ line: item.line, kind: "item", value: item });
  }
  for (const line of block.markdown) {
    entries.push({ line: line.line, kind: "line", value: line });
  }
  for (const child of block.children) {
    entries.push({ line: child.source.startLine, kind: "child", value: child });
  }

  entries.sort((a, b) => a.line - b.line);

  const out: string[] = [];
  for (const entry of entries) {
    if (entry.kind === "field") {
      if (entry.value.hidden && !includeHidden) continue;
      const rendered = serializeField(entry.value, imageMap);
      if (rendered.length > 0) out.push(...rendered);
      continue;
    }

    if (entry.kind === "item") {
      if (entry.value.hidden && !includeHidden) continue;
      const itemValue = entry.value.icon
        ? `${entry.value.icon}: ${entry.value.value}`
        : entry.value.value;
      if (itemValue.trim().length === 0) continue;
      out.push(`- ${itemValue.trim()}`);
      continue;
    }

    if (entry.kind === "line") {
      if (entry.value.hidden && !includeHidden) continue;
      if (entry.value.value.trim().length === 0) continue;
      out.push(entry.value.value.trim());
      continue;
    }

    const childLines = serializeBlock(entry.value, imageMap, includeHidden);
    if (childLines.length > 0) out.push(...childLines);
  }

  return out;
}

function serializeField(
  field: FieldAst,
  imageMap: Record<string, string>,
): string[] {
  const value = field.value.trim();
  if (value.length === 0) return [];

  if (field.name === "title") return [`### ${value}`];
  if (field.name === "image") {
    return [`![Image](${resolveImageReference(value, imageMap)})`];
  }

  return [value];
}

function extractImageMap(ast: ResumeAstDocument): Record<string, string> {
  const rawImages = ast.config.raw.images;
  if (!rawImages || typeof rawImages !== "object" || Array.isArray(rawImages)) {
    return {};
  }

  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawImages)) {
    if (typeof value !== "string") continue;
    const normalizedKey = stripQuotes(key).trim();
    if (normalizedKey.length === 0) continue;
    out[normalizedKey] = value.trim();
  }

  return out;
}

function resolveImageReference(
  reference: string,
  imageMap: Record<string, string>,
): string {
  const key = stripQuotes(reference).trim();
  if (key.length === 0) return key;
  const mapped = imageMap[key];
  if (!mapped || mapped.trim().length === 0) return key;
  return mapped;
}

function normalizeBlankLines(lines: string[]): string[] {
  const out: string[] = [];
  let previousWasBlank = true;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    const isBlank = trimmed.length === 0;
    if (isBlank && previousWasBlank) continue;
    out.push(trimmed);
    previousWasBlank = isBlank;
  }

  while (out.length > 0 && out[out.length - 1].trim().length === 0) {
    out.pop();
  }

  return out;
}
