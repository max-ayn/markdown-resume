import {
  BlockAst,
  BlockAttributesAst,
  FieldAst,
  KnownFieldName,
  ListItemAst,
  MarkdownLineAst,
  NormalizedConfiguration,
  ParseArtifacts,
  RegionConfiguration,
  ResumeAstDocument,
  SectionAst,
  ValidationIssue,
  ValidationResult,
} from "./types.ts";
import { parseBoolean, slugify, stripQuotes } from "./utils.ts";

type NumberedLine = {
  number: number;
  text: string;
};

type FrontMatterResult = {
  rawLines: NumberedLine[];
  bodyLines: NumberedLine[];
};

type HeadingState = {
  h1Headings: Array<{ text: string; line: number }>;
};

type SectionDraft = {
  title: string;
  titleHidden: boolean;
  headingLine: number;
  startIndex: number;
  endIndex: number;
  id: string;
  region: string;
  blocks: BlockDraft[];
  markdown: MarkdownLineAst[];
};

type PreambleDraft = {
  startIndex: number;
  endIndex: number;
  blocks: BlockDraft[];
  markdown: MarkdownLineAst[];
};

type SourceLine = {
  line: number;
  text: string;
};

type BlockDraft = {
  rawAttrs: string;
  attrs: BlockAttributesAst;
  hidden: boolean;
  region: string;
  source: {
    startLine: number;
    endLine: number;
  };
  rawLines: SourceLine[];
  pendingLines: SourceLine[];
  fields: FieldAst[];
  items: ListItemAst[];
  markdown: MarkdownLineAst[];
  children: BlockDraft[];
};

const KNOWN_FIELDS: ReadonlySet<KnownFieldName> = new Set([
  "title",
  "date",
  "org",
  "summary",
  "image",
  "links",
  "stack",
  "note",
  "meta",
]);

export class SemanticResumeParser {
  public parseAndSerialize(markdown: string): ParseArtifacts {
    const ast = this.parse(markdown);
    return {
      ast,
      serializedAst: JSON.stringify(ast, null, 2),
    };
  }

  public parse(markdown: string): ResumeAstDocument {
    // 1. parse YAML front matter if present
    const stage1 = this.parseFrontMatter(markdown);

    // 2. normalize global config
    const stage2 = this.normalizeGlobalConfiguration(stage1.rawLines);

    // 3. parse H1
    const stage3 = this.parseH1(stage1.bodyLines);

    // 4. parse H2 sections
    const stage4 = this.parseSections(stage1.bodyLines);

    // 5. parse `block` fences
    this.parseBlockFences(stage1.bodyLines, stage4.preamble, stage4.sections);

    // 6. parse block attributes
    this.parseBlockAttributes(stage4.preamble.blocks);
    for (const section of stage4.sections) {
      this.parseBlockAttributes(section.blocks);
    }

    // 7. parse block field directives
    this.parseBlockFieldDirectives(stage4.preamble.blocks);
    for (const section of stage4.sections) {
      this.parseBlockFieldDirectives(section.blocks);
    }

    // 8. parse `@hidden` markers
    this.parseHiddenMarkers(stage4.preamble.blocks);
    for (const section of stage4.sections) {
      this.parseHiddenMarkers(section.blocks);
    }

    // 9. parse list items and inline icon syntax
    this.parseListItemsAndIcons(stage4.preamble.blocks);
    for (const section of stage4.sections) {
      this.parseListItemsAndIcons(section.blocks);
    }

    // 10. resolve section ids
    this.resolveSectionIds(stage4.sections);

    // 11. resolve section regions from config
    this.resolveSectionRegions(stage4.sections, stage2);

    // 12. let blocks inherit section region unless overridden
    this.inheritBlockRegions(stage4.preamble.blocks, stage2.defaultRegion);
    for (const section of stage4.sections) {
      this.inheritBlockRegions(section.blocks, section.region);
    }

    // 13. build AST
    const ast = this.buildAst(stage2, stage3, stage4.preamble, stage4.sections);

    // 14. validate AST
    ast.validation = this.validateAst(ast, stage3.h1Headings.length);

    // 15. render HTML or serialize for AI
    // `core_bis` focuses on canonical AST output for downstream renderers/AI.

    return ast;
  }

  private normalizeLineEndings(markdown: string): string {
    return markdown.replaceAll("\r\n", "\n");
  }

  private parseFrontMatter(markdown: string): FrontMatterResult {
    const normalized = this.normalizeLineEndings(markdown);
    const allLines = normalized.split("\n");

    let start = 0;
    while (start < allLines.length && allLines[start].trim() === "") {
      start += 1;
    }

    if (start >= allLines.length || allLines[start].trim() !== "---") {
      return {
        rawLines: [],
        bodyLines: allLines.map((text, index) => ({ number: index + 1, text })),
      };
    }

    let end = -1;
    for (let i = start + 1; i < allLines.length; i += 1) {
      if (allLines[i].trim() === "---") {
        end = i;
        break;
      }
    }

    if (end === -1) {
      return {
        rawLines: [],
        bodyLines: allLines.map((text, index) => ({ number: index + 1, text })),
      };
    }

    const rawLines = allLines
      .slice(start + 1, end)
      .map((text, index) => ({ number: start + index + 2, text }));

    const bodyLines = allLines
      .slice(end + 1)
      .map((text, index) => ({ number: end + index + 2, text }));

    return { rawLines, bodyLines };
  }

  private normalizeGlobalConfiguration(
    rawFrontMatter: NumberedLine[],
  ): NormalizedConfiguration {
    const raw: Record<string, unknown> = {};
    const parsedRegions: Record<string, RegionConfiguration> = {};

    let i = 0;
    while (i < rawFrontMatter.length) {
      const line = rawFrontMatter[i].text;
      const topLevel = line.match(/^([a-zA-Z0-9_.-]+)\s*:\s*(.*)$/);
      if (!topLevel) {
        i += 1;
        continue;
      }

      const key = topLevel[1];
      const value = topLevel[2].trim();

      if (key === "regions" && value === "") {
        const parsed = this.parseRegionConfiguration(rawFrontMatter, i + 1);
        Object.assign(parsedRegions, parsed.regions);
        i = parsed.nextIndex;
        continue;
      }

      if (value.length > 0) {
        raw[key] = stripQuotes(value);
        i += 1;
        continue;
      }

      const nestedRows: string[] = [];
      let j = i + 1;
      while (j < rawFrontMatter.length) {
        const row = rawFrontMatter[j].text;
        if (!row.startsWith("  ")) break;
        nestedRows.push(row);
        j += 1;
      }

      if (nestedRows.length === 0) {
        raw[key] = "";
        i += 1;
        continue;
      }

      const listValues = this.parseNestedList(nestedRows);
      if (listValues !== null) {
        raw[key] = listValues;
        i = j;
        continue;
      }

      const objectValues = this.parseNestedObject(nestedRows);
      if (objectValues !== null) {
        raw[key] = objectValues;
        i = j;
        continue;
      }

      raw[key] = "";
      i += 1;
    }

    const regions: Record<string, RegionConfiguration> = {
      header: { enabled: true, sections: [], props: {} },
      main: { enabled: true, sections: [], props: {} },
      sidebar: { enabled: true, sections: [], props: {} },
      footer: { enabled: true, sections: [], props: {} },
    };

    for (const [regionName, parsed] of Object.entries(parsedRegions)) {
      regions[regionName] = parsed;
    }

    const sectionToRegions = new Map<string, string[]>();
    for (const [regionName, region] of Object.entries(regions)) {
      for (const sectionId of region.sections) {
        if (!sectionToRegions.has(sectionId)) {
          sectionToRegions.set(sectionId, []);
        }
        sectionToRegions.get(sectionId)?.push(regionName);
      }
    }

    const sectionRegionMap: Record<string, string> = {};
    const sectionRegionConflicts: Array<
      { sectionId: string; regions: string[] }
    > = [];

    for (const [sectionId, regionNames] of sectionToRegions.entries()) {
      if (regionNames.length > 0) {
        sectionRegionMap[sectionId] = regionNames[0];
      }
      if (regionNames.length > 1) {
        sectionRegionConflicts.push({
          sectionId,
          regions: [...regionNames],
        });
      }
    }

    return {
      raw,
      regions,
      sectionRegionMap,
      sectionRegionConflicts,
      defaultRegion: "main",
    };
  }

  private parseRegionConfiguration(
    lines: NumberedLine[],
    startIndex: number,
  ): { regions: Record<string, RegionConfiguration>; nextIndex: number } {
    const regions: Record<string, RegionConfiguration> = {};
    let i = startIndex;

    while (i < lines.length) {
      const row = lines[i].text;
      if (!row.startsWith("  ")) break;

      const regionStart = row.match(/^\s{2}([a-zA-Z0-9_-]+)\s*:\s*$/);
      if (!regionStart) {
        i += 1;
        continue;
      }

      const regionName = slugify(regionStart[1]);
      const current: RegionConfiguration = {
        enabled: true,
        sections: [],
        props: {},
      };

      i += 1;
      while (i < lines.length) {
        const child = lines[i].text;
        if (!child.startsWith("    ")) break;

        const field = child.match(/^\s{4}([a-zA-Z0-9_.-]+)\s*:\s*(.*)$/);
        if (!field) {
          i += 1;
          continue;
        }

        const key = field[1];
        const value = field[2].trim();

        if (key === "sections") {
          const sections: string[] = [];

          if (value.length > 0) {
            sections.push(...this.parseSectionListValue(value));
            i += 1;
          } else {
            i += 1;
            while (i < lines.length) {
              const sectionRow = lines[i].text;
              if (!sectionRow.startsWith("      ")) break;

              const listMatch = sectionRow.match(/^\s*-\s*(.+)$/);
              if (listMatch) {
                const sectionId = slugify(stripQuotes(listMatch[1]));
                if (sectionId) sections.push(sectionId);
              }
              i += 1;
            }
          }

          current.sections = sections;
          continue;
        }

        if (key === "enabled") {
          const parsedBoolean = parseBoolean(value);
          if (parsedBoolean !== null) {
            current.enabled = parsedBoolean;
          }
        } else {
          current.props[key] = stripQuotes(value);
        }

        i += 1;
      }

      regions[regionName] = current;
    }

    return { regions, nextIndex: i };
  }

  private parseH1(lines: NumberedLine[]): HeadingState {
    const h1Headings: Array<{ text: string; line: number }> = [];
    let depth = 0;

    for (const line of lines) {
      const trimmed = line.text.trim();

      if (this.isBlockOpenLine(trimmed)) {
        depth += 1;
        continue;
      }

      if (trimmed === ":::" && depth > 0) {
        depth -= 1;
        continue;
      }

      if (depth === 0 && trimmed.startsWith("# ")) {
        h1Headings.push({ text: trimmed.slice(2).trim(), line: line.number });
      }
    }

    return { h1Headings };
  }

  private parseSections(
    lines: NumberedLine[],
  ): { preamble: PreambleDraft; sections: SectionDraft[] } {
    const sectionHeadings: Array<
      { title: string; titleHidden: boolean; line: number; index: number }
    > = [];
    let depth = 0;

    for (let i = 0; i < lines.length; i += 1) {
      const trimmed = lines[i].text.trim();

      if (this.isBlockOpenLine(trimmed)) {
        depth += 1;
        continue;
      }

      if (trimmed === ":::" && depth > 0) {
        depth -= 1;
        continue;
      }

      const parsedHeading = depth === 0
        ? this.parseSectionHeading(trimmed)
        : null;
      if (parsedHeading) {
        sectionHeadings.push({
          title: parsedHeading.title,
          titleHidden: parsedHeading.hidden,
          line: lines[i].number,
          index: i,
        });
      }
    }

    const preamble: PreambleDraft = {
      startIndex: 0,
      endIndex: sectionHeadings.length > 0
        ? sectionHeadings[0].index - 1
        : lines.length - 1,
      blocks: [],
      markdown: [],
    };

    const sections: SectionDraft[] = [];
    for (let i = 0; i < sectionHeadings.length; i += 1) {
      const heading = sectionHeadings[i];
      const next = sectionHeadings[i + 1];

      sections.push({
        title: heading.title,
        titleHidden: heading.titleHidden,
        headingLine: heading.line,
        startIndex: heading.index + 1,
        endIndex: next ? next.index - 1 : lines.length - 1,
        id: "",
        region: "main",
        blocks: [],
        markdown: [],
      });
    }

    return { preamble, sections };
  }

  private parseSectionHeading(
    trimmed: string,
  ): { title: string; hidden: boolean } | null {
    const visible = trimmed.match(/^##\s+(.+)$/);
    if (visible) {
      return {
        title: visible[1].trim(),
        hidden: false,
      };
    }

    const hidden = trimmed.match(/^@hidden\s+##\s+(.+)$/);
    if (hidden) {
      return {
        title: hidden[1].trim(),
        hidden: true,
      };
    }

    return null;
  }

  private parseBlockFences(
    lines: NumberedLine[],
    preamble: PreambleDraft,
    sections: SectionDraft[],
  ): void {
    const preambleContent = this.parseContentRange(
      lines,
      preamble.startIndex,
      preamble.endIndex,
    );
    preamble.blocks = preambleContent.blocks;
    preamble.markdown = preambleContent.markdown;

    for (const section of sections) {
      const content = this.parseContentRange(
        lines,
        section.startIndex,
        section.endIndex,
      );
      section.blocks = content.blocks;
      section.markdown = content.markdown;
    }
  }

  private parseContentRange(
    lines: NumberedLine[],
    startIndex: number,
    endIndex: number,
  ): { blocks: BlockDraft[]; markdown: MarkdownLineAst[] } {
    const blocks: BlockDraft[] = [];
    const markdown: MarkdownLineAst[] = [];

    if (startIndex > endIndex || startIndex < 0 || endIndex >= lines.length) {
      return { blocks, markdown };
    }

    let i = startIndex;
    while (i <= endIndex) {
      const trimmed = lines[i].text.trim();

      if (this.isBlockOpenLine(trimmed)) {
        const parsed = this.parseBlockAt(lines, i, endIndex);
        blocks.push(parsed.block);
        i = parsed.nextIndex;
        continue;
      }

      if (
        trimmed.length > 0 &&
        !trimmed.startsWith("# ") &&
        !trimmed.startsWith("## ")
      ) {
        const parsedLine = this.parseStandaloneMarkdownLine(
          trimmed,
          lines[i].number,
        );
        if (parsedLine) markdown.push(parsedLine);
      }

      i += 1;
    }

    return { blocks, markdown };
  }

  private parseBlockAt(
    lines: NumberedLine[],
    startIndex: number,
    maxIndex: number,
  ): { block: BlockDraft; nextIndex: number } {
    const openLine = lines[startIndex];
    const openMatch = openLine.text.trim().match(
      /^:::\s*block(?:\{([^}]*)\})?\s*$/,
    );
    const rawAttrs = openMatch?.[1] ?? "";

    const block: BlockDraft = {
      rawAttrs,
      attrs: {
        props: {},
      },
      hidden: false,
      region: "main",
      source: {
        startLine: openLine.number,
        endLine: openLine.number,
      },
      rawLines: [],
      pendingLines: [],
      fields: [],
      items: [],
      markdown: [],
      children: [],
    };

    let i = startIndex + 1;
    while (i <= maxIndex) {
      const trimmed = lines[i].text.trim();

      if (this.isBlockOpenLine(trimmed)) {
        const parsedChild = this.parseBlockAt(lines, i, maxIndex);
        block.children.push(parsedChild.block);
        i = parsedChild.nextIndex;
        continue;
      }

      if (trimmed === ":::") {
        block.source.endLine = lines[i].number;
        return { block, nextIndex: i + 1 };
      }

      block.rawLines.push({ line: lines[i].number, text: lines[i].text });
      i += 1;
    }

    block.source.endLine = lines[maxIndex]?.number ?? openLine.number;
    return { block, nextIndex: maxIndex + 1 };
  }

  private parseBlockAttributes(blocks: BlockDraft[]): void {
    for (const block of blocks) {
      block.attrs = this.parseBlockAttributeString(block.rawAttrs);
      this.parseBlockAttributes(block.children);
    }
  }

  private parseBlockAttributeString(raw: string): BlockAttributesAst {
    const attrs: Record<string, string> = {};
    const matches = raw.matchAll(
      /([a-zA-Z0-9_-]+)\s*=\s*("([^"]*)"|'([^']*)'|[^\s}]+)/g,
    );

    for (const match of matches) {
      const key = match[1].toLowerCase();
      const value = stripQuotes(match[3] ?? match[4] ?? match[2] ?? "");
      attrs[key] = value;
    }

    const known: BlockAttributesAst = {
      kind: attrs.kind,
      role: attrs.role,
      variant: attrs.variant,
      region: attrs.region,
      class: attrs.class,
      props: {},
    };

    for (const [key, value] of Object.entries(attrs)) {
      if (
        key === "kind" || key === "role" || key === "variant" ||
        key === "region" || key === "class"
      ) {
        continue;
      }
      known.props[key] = value;
    }

    return known;
  }

  private parseBlockFieldDirectives(blocks: BlockDraft[]): void {
    for (const block of blocks) {
      const fields: FieldAst[] = [];
      const pendingLines: SourceLine[] = [];

      for (const sourceLine of block.rawLines) {
        const trimmed = sourceLine.text.trim();
        if (trimmed.length === 0) continue;

        if (trimmed.startsWith("### ")) {
          fields.push({
            name: "title",
            value: trimmed.slice(4).trim(),
            hidden: false,
            known: true,
            line: sourceLine.line,
          });
          continue;
        }

        if (trimmed.startsWith("@")) {
          const directive = trimmed.match(/^@([a-zA-Z0-9_-]+)\s*(.*)$/);
          if (directive) {
            const name = directive[1].toLowerCase();
            fields.push({
              name,
              value: directive[2].trim(),
              hidden: false,
              known: KNOWN_FIELDS.has(name as KnownFieldName),
              line: sourceLine.line,
            });
            continue;
          }
        }

        pendingLines.push(sourceLine);
      }

      block.fields = fields;
      block.pendingLines = pendingLines;
      this.parseBlockFieldDirectives(block.children);
    }
  }

  private parseHiddenMarkers(blocks: BlockDraft[]): void {
    for (const block of blocks) {
      const normalizedFields: FieldAst[] = [];
      const hiddenMarkdown: MarkdownLineAst[] = [];

      for (const field of block.fields) {
        if (field.name !== "hidden") {
          normalizedFields.push(field);
          continue;
        }

        const hiddenValue = field.value.trim();
        if (hiddenValue.length === 0) {
          block.hidden = true;
          continue;
        }

        const hiddenField = this.parseHiddenAsField(hiddenValue, field.line);
        if (hiddenField) {
          normalizedFields.push(hiddenField);
          continue;
        }

        hiddenMarkdown.push({
          value: hiddenValue,
          hidden: true,
          line: field.line,
        });
      }

      const normalizedPendingLines: SourceLine[] = [];
      for (const sourceLine of block.pendingLines) {
        const trimmed = sourceLine.text.trim();
        const hiddenMatch = trimmed.match(/^@hidden(?:\s+|$)(.*)$/);

        if (!hiddenMatch) {
          normalizedPendingLines.push(sourceLine);
          continue;
        }

        const hiddenValue = hiddenMatch[1].trim();
        if (hiddenValue.length === 0) {
          block.hidden = true;
          continue;
        }

        const hiddenField = this.parseHiddenAsField(
          hiddenValue,
          sourceLine.line,
        );
        if (hiddenField) {
          normalizedFields.push(hiddenField);
          continue;
        }

        hiddenMarkdown.push({
          value: hiddenValue,
          hidden: true,
          line: sourceLine.line,
        });
      }

      block.fields = normalizedFields;
      block.markdown.push(...hiddenMarkdown);
      block.pendingLines = normalizedPendingLines;

      this.parseHiddenMarkers(block.children);
    }
  }

  private parseHiddenAsField(rawValue: string, line: number): FieldAst | null {
    const directive = rawValue.match(/^@([a-zA-Z0-9_-]+)\s*(.*)$/);
    if (!directive) return null;

    const name = directive[1].toLowerCase();
    const value = directive[2].trim();

    if (name === "hidden") return null;

    return {
      name,
      value,
      hidden: true,
      known: KNOWN_FIELDS.has(name as KnownFieldName),
      line,
    };
  }

  private parseListItemsAndIcons(blocks: BlockDraft[]): void {
    for (const block of blocks) {
      const items: ListItemAst[] = [];
      const markdown = [...block.markdown];

      for (const sourceLine of block.pendingLines) {
        const trimmed = sourceLine.text.trim();
        if (trimmed.length === 0) continue;

        if (trimmed.startsWith("- ")) {
          const parsed = this.parseListItem(
            trimmed.slice(2).trim(),
            sourceLine.line,
          );
          if (parsed) items.push(parsed);
          continue;
        }

        markdown.push({
          value: trimmed,
          hidden: false,
          line: sourceLine.line,
        });
      }

      block.items = items;
      block.markdown = markdown.sort((a, b) => a.line - b.line);
      block.pendingLines = [];

      this.parseListItemsAndIcons(block.children);
    }
  }

  private parseListItem(rawItem: string, line: number): ListItemAst | null {
    if (rawItem.length === 0) return null;

    let value = rawItem;
    let hidden = false;

    const hiddenMatch = value.match(/^@hidden(?:\s+|$)(.*)$/);
    if (hiddenMatch) {
      hidden = true;
      value = hiddenMatch[1].trim();
      if (value.length === 0) return null;
    }

    const iconMatch = value.match(/^@icon\s+([a-zA-Z0-9_.:-]+)\s*\|\s*(.+)$/);
    if (iconMatch) {
      return {
        value: iconMatch[2].trim(),
        hidden,
        icon: iconMatch[1],
        line,
      };
    }

    return {
      value,
      hidden,
      line,
    };
  }

  private resolveSectionIds(sections: SectionDraft[]): void {
    for (const section of sections) {
      section.id = slugify(section.title);
    }
  }

  private resolveSectionRegions(
    sections: SectionDraft[],
    configuration: NormalizedConfiguration,
  ): void {
    for (const section of sections) {
      section.region = configuration.sectionRegionMap[section.id] ??
        configuration.defaultRegion;
    }
  }

  private inheritBlockRegions(
    blocks: BlockDraft[],
    inheritedRegion: string,
  ): void {
    for (const block of blocks) {
      const explicitRegion = block.attrs.region?.trim();
      block.region = explicitRegion && explicitRegion.length > 0
        ? explicitRegion
        : inheritedRegion;

      this.inheritBlockRegions(block.children, block.region);
    }
  }

  private buildAst(
    configuration: NormalizedConfiguration,
    headingState: HeadingState,
    preamble: PreambleDraft,
    sections: SectionDraft[],
  ): ResumeAstDocument {
    const title = headingState.h1Headings[0]?.text;

    return {
      type: "resume-document",
      version: "core_bis/v1",
      config: configuration,
      title,
      preamble: {
        blocks: preamble.blocks.map((block) => this.finalizeBlock(block)),
        markdown: preamble.markdown,
      },
      sections: sections.map((section) => this.finalizeSection(section)),
      validation: {
        errors: [],
        warnings: [],
      },
    };
  }

  private finalizeSection(section: SectionDraft): SectionAst {
    return {
      id: section.id,
      title: section.title,
      titleHidden: section.titleHidden,
      region: section.region,
      blocks: section.blocks.map((block) => this.finalizeBlock(block)),
      markdown: section.markdown,
      source: {
        headingLine: section.headingLine,
      },
    };
  }

  private finalizeBlock(block: BlockDraft): BlockAst {
    const knownFields: Partial<Record<KnownFieldName, FieldAst[]>> = {};

    for (const field of block.fields) {
      if (!field.known) continue;
      const key = field.name as KnownFieldName;
      if (!knownFields[key]) knownFields[key] = [];
      knownFields[key]?.push(field);
    }

    return {
      type: "block",
      hidden: block.hidden,
      attrs: block.attrs,
      region: block.region,
      fields: block.fields,
      knownFields,
      items: block.items,
      markdown: block.markdown,
      children: block.children.map((child) => this.finalizeBlock(child)),
      source: block.source,
    };
  }

  private validateAst(
    ast: ResumeAstDocument,
    h1Count: number,
  ): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    if (h1Count !== 1) {
      warnings.push({
        code: "recommended-single-h1",
        message: `Expected exactly one H1 (found ${h1Count}).`,
      });
    }

    const seenSections = new Set<string>();
    for (const section of ast.sections) {
      if (seenSections.has(section.id)) {
        warnings.push({
          code: "duplicate-section-id",
          message: `Duplicate section id '${section.id}'.`,
          line: section.source.headingLine,
        });
      }
      seenSections.add(section.id);
    }

    for (const conflict of ast.config.sectionRegionConflicts) {
      errors.push({
        code: "section-region-conflict",
        message:
          `Section '${conflict.sectionId}' is assigned to multiple regions: ${
            conflict.regions.join(", ")
          }.`,
      });
    }

    for (const block of ast.preamble.blocks) {
      this.validateBlock(block, errors);
    }

    for (const section of ast.sections) {
      for (const block of section.blocks) {
        this.validateBlock(block, errors);
      }
    }

    return { errors, warnings };
  }

  private validateBlock(block: BlockAst, errors: ValidationIssue[]): void {
    const hasMeaningfulContent = block.fields.length > 0 ||
      block.items.length > 0 ||
      block.markdown.length > 0 ||
      block.children.length > 0;

    if (!hasMeaningfulContent) {
      errors.push({
        code: "invalid-empty-block",
        message: "Block must contain at least one meaningful content element.",
        line: block.source.startLine,
      });
    }

    if (!block.attrs.props || typeof block.attrs.props !== "object") {
      errors.push({
        code: "unknown-attrs-not-preserved",
        message:
          "Unknown block attributes must be preserved under attrs.props.",
        line: block.source.startLine,
      });
    }

    for (const field of block.fields) {
      if (field.name === "hidden") {
        errors.push({
          code: "hidden-field-not-normalized",
          message:
            "Hidden directives must be normalized to hidden flags in AST.",
          line: field.line,
        });
      }
      if (!field.known && field.name.trim().length === 0) {
        errors.push({
          code: "unknown-directive-not-preserved",
          message:
            "Unknown directives must be preserved with a directive name.",
          line: field.line,
        });
      }
    }

    for (const item of block.items) {
      if (!item.hidden && item.value.trim().startsWith("@hidden")) {
        errors.push({
          code: "hidden-item-not-retained",
          message:
            "Hidden list items must be retained with hidden=true in AST.",
          line: item.line,
        });
      }
    }

    for (const line of block.markdown) {
      if (!line.hidden && line.value.trim().startsWith("@hidden")) {
        errors.push({
          code: "hidden-line-not-retained",
          message:
            "Hidden markdown lines must be retained with hidden=true in AST.",
          line: line.line,
        });
      }
    }

    for (const child of block.children) {
      this.validateBlock(child, errors);
    }
  }

  private parseSectionListValue(value: string): string[] {
    const raw = value.trim();
    if (raw.length === 0) return [];

    const values = raw.startsWith("[") && raw.endsWith("]")
      ? raw.slice(1, -1).split(",")
      : [raw];

    const out: string[] = [];
    for (const candidate of values) {
      const id = slugify(stripQuotes(candidate.trim()));
      if (id) out.push(id);
    }
    return out;
  }

  private parseNestedList(rows: string[]): string[] | null {
    const out: string[] = [];

    for (const row of rows) {
      const listMatch = row.match(/^\s*-\s*(.+)$/);
      if (!listMatch) return null;
      out.push(stripQuotes(listMatch[1]));
    }

    return out;
  }

  private parseNestedObject(rows: string[]): Record<string, string> | null {
    const out: Record<string, string> = {};

    for (const row of rows) {
      const pair = row.match(/^\s{2}([a-zA-Z0-9_.-]+)\s*:\s*(.*)$/);
      if (!pair) return null;
      out[pair[1]] = stripQuotes(pair[2]);
    }

    return out;
  }

  private parseStandaloneMarkdownLine(
    trimmed: string,
    line: number,
  ): MarkdownLineAst | null {
    const hiddenMatch = trimmed.match(/^@hidden(?:\s+|$)(.*)$/);
    if (!hiddenMatch) {
      return {
        value: trimmed,
        hidden: false,
        line,
      };
    }

    const hiddenValue = hiddenMatch[1].trim();
    return {
      value: hiddenValue,
      hidden: true,
      line,
    };
  }

  private isBlockOpenLine(trimmed: string): boolean {
    return /^:::\s*block(?:\{[^}]*\})?\s*$/.test(trimmed);
  }
}
