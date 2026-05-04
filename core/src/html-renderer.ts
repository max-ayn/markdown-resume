import {
  BlockAst,
  MarkdownLineAst,
  ResumeAstDocument,
  SectionAst,
} from "./types.ts";
import { slugify, stripQuotes } from "./utils.ts";

export type RenderOptions = {
  debugHidden?: boolean;
};

const BUILTIN_REGION_ORDER = ["header", "main", "sidebar", "footer"] as const;

export class SemanticResumeHtmlRenderer {
  private activeImageMap: Record<string, string> | null = null;

  public render(ast: ResumeAstDocument, options: RenderOptions = {}): string {
    this.activeImageMap = this.extractImageMap(ast);

    const regionContent = this.createRegionBuckets();

    try {
      if (ast.title) {
        this.pushToRegion(
          regionContent,
          "header",
          `<h1 class="resume-title">${this.formatInline(ast.title)}</h1>`,
        );
      }

      for (const line of ast.preamble.markdown) {
        const rendered = this.renderStandaloneLine(line, options);
        if (rendered) this.pushToRegion(regionContent, "main", rendered);
      }

      for (const block of ast.preamble.blocks) {
        const rendered = this.renderBlock(block, options);
        if (rendered) this.pushToRegion(regionContent, block.region, rendered);
      }

      for (const section of ast.sections) {
        const rendered = this.renderSection(section, options);
        if (rendered) {
          this.pushToRegion(regionContent, section.region, rendered);
        }
      }

      const out: string[] = ['<article class="resume">'];
      const additionalRegions = [...regionContent.keys()].filter((region) =>
        !BUILTIN_REGION_ORDER.includes(
          region as (typeof BUILTIN_REGION_ORDER)[number],
        )
      ).sort();

      for (const region of [...BUILTIN_REGION_ORDER, ...additionalRegions]) {
        const items = regionContent.get(region) ?? [];
        out.push(
          `<div class="resume-region resume-region--${
            this.escapeHtml(region)
          }" data-region="${this.escapeHtml(region)}">`,
        );
        out.push(...items);
        out.push("</div>");
      }

      out.push("</article>");
      return out.join("\n");
    } finally {
      this.activeImageMap = null;
    }
  }

  private createRegionBuckets(): Map<string, string[]> {
    const buckets = new Map<string, string[]>();
    for (const region of BUILTIN_REGION_ORDER) buckets.set(region, []);
    return buckets;
  }

  private pushToRegion(
    buckets: Map<string, string[]>,
    rawRegion: string,
    html: string,
  ): void {
    const region = this.normalizeRegion(rawRegion);
    if (!buckets.has(region)) buckets.set(region, []);
    buckets.get(region)?.push(html);
  }

  private normalizeRegion(rawRegion: string): string {
    const normalized = rawRegion.trim().toLowerCase();
    if (normalized.length === 0) return "main";
    return normalized;
  }

  private renderSection(
    section: SectionAst,
    options: RenderOptions,
  ): string | null {
    const sectionClasses = [
      "resume-section",
      `resume-section--${this.escapeHtml(section.id)}`,
    ];

    const out: string[] = [
      `<section class="${sectionClasses.join(" ")}" data-section="${
        this.escapeHtml(section.id)
      }" data-region="${this.escapeHtml(section.region)}">`,
    ];

    if (!this.shouldSkipHidden(section.titleHidden, options)) {
      const titleClasses = ["resume-section__title"];
      const hiddenTitleClass = this.hiddenClass(section.titleHidden, options);
      if (hiddenTitleClass) titleClasses.push(hiddenTitleClass);
      out.push(
        `<h2 class="${titleClasses.join(" ")}">${
          this.formatInline(section.title)
        }</h2>`,
      );
    }

    for (const line of section.markdown) {
      const rendered = this.renderLine(line, "resume-section__line", options);
      if (rendered) out.push(rendered);
    }

    for (const block of section.blocks) {
      const rendered = this.renderBlock(block, options);
      if (rendered) out.push(rendered);
    }

    out.push("</section>");
    return out.join("\n");
  }

  private renderBlock(block: BlockAst, options: RenderOptions): string | null {
    if (this.shouldSkipHidden(block.hidden, options)) return null;

    const classes = ["resume-block"];
    if (block.attrs.kind) {
      classes.push(`resume-block--${slugify(block.attrs.kind)}`);
    }
    if (block.attrs.role) {
      classes.push(`resume-block--${slugify(block.attrs.role)}`);
    }
    if (block.attrs.variant) classes.push(`is-${slugify(block.attrs.variant)}`);

    if (block.attrs.class) {
      for (const className of block.attrs.class.trim().split(/\s+/)) {
        if (className) classes.push(className);
      }
    }

    const hiddenClass = this.hiddenClass(block.hidden, options);
    if (hiddenClass) classes.push(hiddenClass);

    const out: string[] = [
      `<article class="${classes.join(" ")}" data-region="${
        this.escapeHtml(block.region)
      }">`,
    ];

    for (const field of block.fields) {
      if (this.shouldSkipHidden(field.hidden, options)) continue;

      if (field.name === "title") {
        out.push(
          this.renderFieldTag(
            "h3",
            "resume-block__title",
            field.value,
            field.hidden,
            options,
          ),
        );
        continue;
      }

      if (field.name === "image") {
        const resolvedImageSource = this.resolveImageReference(field.value);
        const hiddenFieldClass = this.hiddenClass(field.hidden, options);
        const figureClasses = ["resume-block__image"];
        if (hiddenFieldClass) figureClasses.push(hiddenFieldClass);
        out.push(
          `<figure class="${figureClasses.join(" ")}"><img src="${
            this.escapeHtml(resolvedImageSource)
          }" alt="Image" /></figure>`,
        );
        continue;
      }

      if (field.name === "stack") {
        out.push(this.renderStackField(field.value, field.hidden, options));
        continue;
      }

      out.push(
        this.renderFieldTag(
          "p",
          `resume-block__field resume-block__field--${slugify(field.name)}`,
          field.value,
          field.hidden,
          options,
        ),
      );
    }

    const visibleItems = block.items.filter((item) =>
      !this.shouldSkipHidden(item.hidden, options)
    );
    if (visibleItems.length > 0) {
      const blockRole = slugify(block.attrs.role ?? "");
      out.push('<ul class="resume-block__items">');
      for (const item of visibleItems) {
        const itemClasses = ["resume-block__item"];
        const itemHiddenClass = this.hiddenClass(item.hidden, options);
        if (itemHiddenClass) itemClasses.push(itemHiddenClass);

        if (blockRole === "icon-list") {
          out.push(this.renderIconListItem(itemClasses, item.value));
          continue;
        }

        if (blockRole === "meter-list") {
          out.push(this.renderMeterListItem(itemClasses, item.value));
          continue;
        }

        if (item.icon) {
          const iconSlug = slugify(item.icon);
          out.push(
            `<li class="${
              itemClasses.join(" ")
            }"><span class="resume-block__icon resume-block__icon--${
              this.escapeHtml(iconSlug)
            } material-symbols-outlined" data-icon="${
              this.escapeHtml(item.icon)
            }">${
              this.escapeHtml(item.icon)
            }</span> <span class="resume-block__item-text">${
              this.formatInline(item.value)
            }</span></li>`,
          );
        } else {
          out.push(
            `<li class="${itemClasses.join(" ")}">${
              this.formatInline(item.value)
            }</li>`,
          );
        }
      }
      out.push("</ul>");
    }

    for (const line of block.markdown) {
      const rendered = this.renderLine(line, "resume-block__line", options);
      if (rendered) out.push(rendered);
    }

    for (const child of block.children) {
      const rendered = this.renderBlock(child, options);
      if (rendered) out.push(rendered);
    }

    out.push("</article>");
    return out.join("\n");
  }

  private renderIconListItem(itemClasses: string[], rawValue: string): string {
    const { left, right } = this.splitPipePair(rawValue);
    if (!right) {
      return `<li class="${itemClasses.join(" ")}">${
        this.formatInline(left)
      }</li>`;
    }

    return `<li class="${itemClasses.join(" ")}"><span class="resume-block__item-label">${
      this.formatInline(left)
    }</span><span class="resume-block__item-value">${
      this.formatInline(right)
    }</span></li>`;
  }

  private renderMeterListItem(itemClasses: string[], rawValue: string): string {
    const { left, right } = this.splitPipePair(rawValue);
    if (!right) {
      return `<li class="${itemClasses.join(" ")}">${
        this.formatInline(left)
      }</li>`;
    }

    const percentage = this.parseMeterPercentage(right);
    const clamped = Math.max(0, Math.min(100, percentage));

    return `<li class="${itemClasses.join(" ")}"><div class="resume-meter"><span class="resume-meter__label">${
      this.formatInline(left)
    }</span><span class="resume-meter__value">${
      this.formatInline(right)
    }</span><div class="resume-meter__track"><div class="resume-meter__fill" style="width: ${
      clamped
    }%;"></div></div></div></li>`;
  }

  private splitPipePair(rawValue: string): { left: string; right: string | null } {
    const separator = rawValue.indexOf("|");
    if (separator < 0) {
      return { left: rawValue.trim(), right: null };
    }

    const left = rawValue.slice(0, separator).trim();
    const right = rawValue.slice(separator + 1).trim();
    if (right.length === 0) return { left, right: null };
    return { left, right };
  }

  private parseMeterPercentage(rawValue: string): number {
    const match = rawValue.match(/-?\d+(?:\.\d+)?/);
    if (!match) return 0;
    return Number(match[0]);
  }

  private renderStandaloneLine(
    line: MarkdownLineAst,
    options: RenderOptions,
  ): string | null {
    return this.renderLine(line, "resume-line", options);
  }

  private renderLine(
    line: MarkdownLineAst,
    baseClass: string,
    options: RenderOptions,
  ): string | null {
    if (this.shouldSkipHidden(line.hidden, options)) return null;

    if (line.value.trim() === "---") {
      const classes = ["resume-separator"];
      const hiddenClass = this.hiddenClass(line.hidden, options);
      if (hiddenClass) classes.push(hiddenClass);
      return `<hr class="${classes.join(" ")}" />`;
    }

    const classes = [baseClass];
    const hiddenClass = this.hiddenClass(line.hidden, options);
    if (hiddenClass) classes.push(hiddenClass);

    return `<p class="${classes.join(" ")}">${
      this.formatInline(line.value)
    }</p>`;
  }

  private renderFieldTag(
    tag: "h3" | "p",
    className: string,
    value: string,
    hidden: boolean,
    options: RenderOptions,
  ): string {
    const classes = [className];
    const hiddenClass = this.hiddenClass(hidden, options);
    if (hiddenClass) classes.push(hiddenClass);
    return `<${tag} class="${classes.join(" ")}">${
      this.formatInline(value)
    }</${tag}>`;
  }

  private renderStackField(
    rawValue: string,
    hidden: boolean,
    options: RenderOptions,
  ): string {
    const tokens = rawValue.split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (tokens.length === 0) {
      return this.renderFieldTag(
        "p",
        "resume-block__field resume-block__field--stack",
        rawValue,
        hidden,
        options,
      );
    }

    const classes = ["resume-block__stack"];
    const hiddenClass = this.hiddenClass(hidden, options);
    if (hiddenClass) classes.push(hiddenClass);

    const out = [`<div class="${classes.join(" ")}">`];
    for (const token of tokens) {
      out.push(
        `<span class="resume-block__stack-badge">${
          this.formatInline(token)
        }</span>`,
      );
    }
    out.push("</div>");
    return out.join("");
  }

  private shouldSkipHidden(hidden: boolean, options: RenderOptions): boolean {
    return hidden && !options.debugHidden;
  }

  private hiddenClass(hidden: boolean, options: RenderOptions): string | null {
    if (hidden && options.debugHidden) return "is-hidden-source";
    return null;
  }

  private escapeHtml(text: string): string {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  private formatInline(text: string): string {
    const escaped = this.escapeHtml(text);

    return escaped
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)\s]+)\)/g,
        '<a href="$2" rel="noopener noreferrer">$1</a>',
      );
  }

  private extractImageMap(ast: ResumeAstDocument): Record<string, string> {
    const rawImages = ast.config.raw.images;
    if (
      !rawImages || typeof rawImages !== "object" || Array.isArray(rawImages)
    ) {
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

  private resolveImageReference(reference: string): string {
    const key = stripQuotes(reference).trim();
    if (key.length === 0) return key;

    const mapped = this.activeImageMap?.[key];
    if (!mapped || mapped.trim().length === 0) return key;
    return mapped;
  }
}
