import { dirname, fromFileUrl, join } from "@std/path";

type FrontMatter = {
  template?: string;
  name?: string;
  title?: string;
  photo?: string;
  sidebarSections: Set<string>;
  theme: Record<string, string>;
  meta: Record<string, string>;
};

type Token =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | {
    type: "directive";
    name: string;
    attrs: Record<string, string>;
    lines: string[];
  };

type Section = {
  title: string;
  slug: string;
  region: "main" | "sidebar" | string;
  tokens: Token[];
};

type StyledValue = {
  value: string;
  styleKey: string | null;
};

export class MarkdownHtmlGenerator {
  private readonly defaultSidebar = new Set(["skills", "languages", "interests"]);

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  private stripQuotes(value: string): string {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  private parseFrontMatter(markdown: string): { body: string; frontMatter: FrontMatter } {
    const lines = markdown.replaceAll("\r\n", "\n").split("\n");
    if (lines.length > 0 && lines[0].charCodeAt(0) === 0xfeff) {
      lines[0] = lines[0].slice(1);
    }

    let idx = 0;
    while (idx < lines.length && lines[idx].trim() === "") idx += 1;
    if (idx >= lines.length || lines[idx].trim() !== "---") {
      return {
        body: lines.join("\n"),
        frontMatter: {
          sidebarSections: new Set(this.defaultSidebar),
          theme: {},
          meta: {},
        },
      };
    }

    let end = -1;
    for (let i = idx + 1; i < lines.length; i += 1) {
      if (lines[i].trim() === "---") {
        end = i;
        break;
      }
    }

    if (end === -1) {
      return {
        body: lines.join("\n"),
        frontMatter: {
          sidebarSections: new Set(this.defaultSidebar),
          theme: {},
          meta: {},
        },
      };
    }

    const frontMatter: FrontMatter = {
      sidebarSections: new Set(this.defaultSidebar),
      theme: {},
      meta: {},
    };

    const raw = lines.slice(idx + 1, end);

    for (let i = 0; i < raw.length; i += 1) {
      const line = raw[i];
      const keyValue = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (!keyValue) continue;

      const key = keyValue[1];
      const value = keyValue[2].trim();

      if (key === "template") frontMatter.template = this.stripQuotes(value);
      if (key === "name") frontMatter.name = this.stripQuotes(value);
      if (key === "title") frontMatter.title = this.stripQuotes(value);
      if (key === "photo") frontMatter.photo = this.stripQuotes(value);

      if (key === "sidebar_sections") {
        if (value.startsWith("[") && value.endsWith("]")) {
          const parts = value.slice(1, -1).split(",");
          for (const part of parts) {
            const slug = this.slugify(this.stripQuotes(part));
            if (slug) frontMatter.sidebarSections.add(slug);
          }
        } else if (value.length > 0) {
          const parts = value.split(",");
          for (const part of parts) {
            const slug = this.slugify(this.stripQuotes(part));
            if (slug) frontMatter.sidebarSections.add(slug);
          }
        } else {
          for (let j = i + 1; j < raw.length; j += 1) {
            const item = raw[j].trim();
            if (!item.startsWith("- ")) {
              i = j - 1;
              break;
            }
            const slug = this.slugify(this.stripQuotes(item.slice(2)));
            if (slug) frontMatter.sidebarSections.add(slug);
            if (j === raw.length - 1) i = j;
          }
        }
      }

      if (key === "theme") {
        for (let j = i + 1; j < raw.length; j += 1) {
          const child = raw[j];
          if (!child.startsWith("  ")) {
            i = j - 1;
            break;
          }
          const childMatch = child.trim().match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);
          if (!childMatch) continue;
          const themeKey = this.slugify(childMatch[1]);
          const themeValue = this.stripQuotes(childMatch[2]);
          if (themeKey && themeValue) frontMatter.theme[themeKey] = themeValue;
          if (j === raw.length - 1) i = j;
        }
      }

      if (
        key !== "template" && key !== "name" && key !== "title" && key !== "photo" &&
        key !== "sidebar_sections" && key !== "theme"
      ) {
        frontMatter.meta[key] = this.stripQuotes(value);
      }
    }

    return {
      body: lines.slice(end + 1).join("\n"),
      frontMatter,
    };
  }

  private parseInlineGlobals(markdown: string): { body: string; inline: Partial<FrontMatter> } {
    const lines = markdown.replaceAll("\r\n", "\n").split("\n");
    const inline: Partial<FrontMatter> = {
      sidebarSections: new Set<string>(),
      theme: {},
      meta: {},
    };

    let i = 0;
    while (i < lines.length) {
      const raw = lines[i].trim();
      if (raw === "") {
        i += 1;
        continue;
      }
      if (raw.startsWith("#")) break;
      if (!raw.startsWith("@")) break;

      const match = raw.match(/^@([a-zA-Z0-9_-]+)\s*(.*)$/);
      if (!match) {
        i += 1;
        continue;
      }

      const key = match[1].toLowerCase();
      const value = this.stripQuotes(match[2].trim());

      if (key === "template") inline.template = value;
      else if (key === "name") inline.name = value;
      else if (key === "title") inline.title = value;
      else if (key === "photo") inline.photo = value;
      else if (key === "sidebar") {
        const parts = value.split(",");
        for (const part of parts) {
          const slug = this.slugify(part);
          if (slug) (inline.sidebarSections as Set<string>).add(slug);
        }
      } else if (key === "accent") {
        (inline.theme as Record<string, string>).accent = value;
      } else if (key.startsWith("theme-")) {
        const themeKey = this.slugify(key.slice(6));
        if (themeKey) (inline.theme as Record<string, string>)[themeKey] = value;
      } else {
        (inline.meta as Record<string, string>)[key] = value;
      }
      i += 1;
    }

    return {
      body: lines.slice(i).join("\n"),
      inline,
    };
  }

  private escapeHtml(text: string): string {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  private parseStyleMarker(text: string): StyledValue {
    const trimmed = text.trim();
    const match = trimmed.match(/^\[([a-zA-Z0-9_-]+)\](?:\s+|$)([\s\S]*)$/);
    if (!match) {
      return { value: trimmed, styleKey: null };
    }

    const styleKey = this.slugify(match[1]);
    return {
      value: match[2].trim(),
      styleKey: styleKey || null,
    };
  }

  private renderTextElement(tag: string, className: string, rawText: string): string {
    const parsed = this.parseStyleMarker(rawText);
    const classList = [className];
    if (parsed.styleKey) {
      classList.push(`${className}--${parsed.styleKey}`);
    }
    const classAttr = classList.join(" ");
    return `<${tag} class="${classAttr}">${this.formatInline(parsed.value)}</${tag}>`;
  }

  private formatInline(text: string): string {
    const escaped = this.escapeHtml(text);
    return escaped
      .replace(/\\\s*/g, "<br />")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
  }

  private parseDirectiveAttrs(raw: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const matches = raw.matchAll(/([a-zA-Z0-9_-]+)\s*=\s*([^\s}]+)/g);
    for (const match of matches) {
      attrs[match[1]] = this.stripQuotes(match[2]);
    }
    return attrs;
  }

  private regionAttr(region: string | undefined): string {
    const value = (region ?? "").trim();
    return value ? ` data-region="${this.escapeHtml(value)}"` : "";
  }

  private blockClassAttr(
    baseClasses: string[],
    attrs: Record<string, string>,
    extraClasses: string[] = [],
  ): string {
    const classes = [...baseClasses, ...extraClasses];
    const variant = this.slugify(attrs.variant ?? "");
    if (variant) classes.push(`is-${variant}`);
    const userClass = attrs.class?.trim();
    if (userClass) {
      for (const c of userClass.split(/\s+/)) {
        if (c) classes.push(c);
      }
    }
    return classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
  }

  private tokenize(markdown: string): Token[] {
    const lines = markdown.replaceAll("\r\n", "\n").split("\n");
    const tokens: Token[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === "") {
        i += 1;
        continue;
      }

      const directiveOpen = line.match(/^:::\s*([a-zA-Z0-9_-]+)(?:\{([^}]*)\})?\s*$/);
      if (directiveOpen) {
        const name = directiveOpen[1].toLowerCase();
        const attrs = this.parseDirectiveAttrs(directiveOpen[2] ?? "");
        const blockLines: string[] = [];
        i += 1;
        while (i < lines.length && lines[i].trim() !== ":::") {
          blockLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length && lines[i].trim() === ":::") i += 1;
        tokens.push({ type: "directive", name, attrs, lines: blockLines });
        continue;
      }

      if (line.startsWith("### ")) {
        tokens.push({ type: "h3", text: line.slice(4).trim() });
        i += 1;
        continue;
      }
      if (line.startsWith("## ")) {
        tokens.push({ type: "h2", text: line.slice(3).trim() });
        i += 1;
        continue;
      }
      if (line.startsWith("# ")) {
        tokens.push({ type: "h1", text: line.slice(2).trim() });
        i += 1;
        continue;
      }

      if (line.startsWith("- ")) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("- ")) {
          items.push(lines[i].trim().slice(2).trim());
          i += 1;
        }
        tokens.push({ type: "list", items });
        continue;
      }

      const para: string[] = [];
      while (i < lines.length) {
        const next = lines[i].trim();
        if (
          next === "" || next.startsWith("#") || next.startsWith(":::") ||
          next === ":::" || next.startsWith("- ")
        ) {
          break;
        }
        para.push(next);
        i += 1;
      }
      if (para.length > 0) {
        tokens.push({ type: "paragraph", text: para.join(" ") });
      }
    }

    return tokens;
  }

  private renderList(items: string[], listClass?: string, itemClass?: string): string {
    const listAttr = listClass ? ` class="${listClass}"` : "";
    const out = [`<ul${listAttr}>`];
    for (const rawItem of items) {
      const parsed = this.parseStyleMarker(rawItem);
      const classes: string[] = [];
      if (itemClass) classes.push(itemClass);
      if (parsed.styleKey) classes.push(`resume-item--${parsed.styleKey}`);
      const itemAttr = classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
      out.push(`<li${itemAttr}>${this.formatInline(parsed.value)}</li>`);
    }
    out.push("</ul>");
    return out.join("\n");
  }

  private parseItems(lines: string[]): string[] {
    const items: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) items.push(trimmed.slice(2).trim());
    }
    return items;
  }

  private renderGroupList(lines: string[], attrs: Record<string, string>): string {
    const classAttr = this.blockClassAttr(["resume-group-list"], attrs);
    const region = this.regionAttr(attrs.region);
    const items = this.parseItems(lines);
    const out = [`<ul${classAttr}${region}>`];
    for (const item of items) {
      const match = item.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
      if (match) {
        out.push(
          `<li class="resume-group-list__item"><span class="resume-group-list__label">${
            this.formatInline(match[1])
          }:</span> <span class="resume-group-list__value">${this.formatInline(match[2])}</span></li>`,
        );
      } else {
        out.push(`<li class="resume-group-list__item">${this.formatInline(item)}</li>`);
      }
    }
    out.push("</ul>");
    return out.join("\n");
  }

  private renderDirectiveBlock(token: Extract<Token, { type: "directive" }>): string {
    if (token.name === "entry") return this.renderEntry(token);

    const text = token.lines.map((v) => v.trim()).filter(Boolean).join(" ");
    const markdown = token.lines.join("\n");
    const items = this.parseItems(token.lines);

    if (token.name === "lead") {
      return `<p${this.blockClassAttr(["resume-lead"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        this.formatInline(text)
      }</p>`;
    }
    if (token.name === "note") {
      return `<p${this.blockClassAttr(["resume-note"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        this.formatInline(text)
      }</p>`;
    }
    if (token.name === "tags") {
      return this.renderList(items, `resume-taglist${token.attrs.variant ? ` is-${this.slugify(token.attrs.variant)}` : ""}`, "resume-tag");
    }
    if (token.name === "fact-list") {
      const list = this.renderList(items);
      return `<div${this.blockClassAttr(["resume-fact-list"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        list
      }</div>`;
    }
    if (token.name === "group-list") return this.renderGroupList(token.lines, token.attrs);
    if (token.name === "image") {
      const src = token.lines.map((v) => v.trim()).find(Boolean) ?? "";
      const alt = token.attrs.alt?.trim() || "Image";
      return `<figure${this.blockClassAttr(["resume-image"], token.attrs)}${this.regionAttr(token.attrs.region)}><img src="${
        this.escapeHtml(src)
      }" alt="${this.escapeHtml(alt)}" /></figure>`;
    }
    if (token.name === "header") {
      return `<header${this.blockClassAttr(["resume-header"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        this.formatInline(text)
      }</header>`;
    }
    if (token.name === "footer") {
      return `<footer${this.blockClassAttr(["resume-footer"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        this.formatInline(text)
      }</footer>`;
    }
    if (token.name === "quote") {
      return `<blockquote${this.blockClassAttr(["resume-quote"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        this.formatInline(text)
      }</blockquote>`;
    }
    if (token.name === "callout") {
      return `<aside${this.blockClassAttr(["resume-callout"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        this.formatInline(text)
      }</aside>`;
    }
    if (token.name === "container") {
      return `<div${this.blockClassAttr(["resume-container"], token.attrs)}${this.regionAttr(token.attrs.region)}>${
        this.formatInline(text)
      }</div>`;
    }
    if (token.name === "divider") {
      return `<hr${this.blockClassAttr(["resume-divider"], token.attrs)}${this.regionAttr(token.attrs.region)} />`;
    }
    if (token.name === "html") {
      return `<div${this.blockClassAttr(["resume-html"], token.attrs)}${this.regionAttr(token.attrs.region)}>${markdown}</div>`;
    }

    return `<div${this.blockClassAttr(["resume-custom", `resume-custom--${this.slugify(token.name)}`], token.attrs)}${
      this.regionAttr(token.attrs.region)
    }>${this.formatInline(text)}</div>`;
  }

  private renderEntry(token: Extract<Token, { type: "directive" }>): string {
    let title = "";
    let meta = "";
    let links = "";
    let summaryLine = "";
    let image = "";
    const stack: string[] = [];
    const summary: string[] = [];
    const highlights: string[] = [];

    for (const raw of token.lines) {
      const line = raw.trim();
      if (line === "") continue;
      if (line.startsWith("### ")) {
        title = line.slice(4).trim();
      } else if (line.startsWith("@meta ")) {
        meta = line.slice(6).trim();
      } else if (line.startsWith("@stack ")) {
        const parts = line.slice(7).split(",");
        for (const part of parts) {
          const value = part.trim();
          if (value) stack.push(value);
        }
      } else if (line.startsWith("@links ")) {
        links = line.slice(7).trim();
      } else if (line.startsWith("@summary ")) {
        summaryLine = line.slice(9).trim();
      } else if (line.startsWith("@image ")) {
        image = line.slice(7).trim();
      } else if (line.startsWith("- ")) {
        highlights.push(line.slice(2).trim());
      } else {
        summary.push(line);
      }
    }

    const kind = token.attrs.kind ? this.slugify(token.attrs.kind) : "generic";
    const attr = this.blockClassAttr(["resume-entry", `resume-entry--${kind}`], token.attrs);
    const region = this.regionAttr(token.attrs.region);
    const out = [`<article${attr}${region}>`];
    if (title) out.push(this.renderTextElement("h3", "resume-entry__title", title));
    if (meta) out.push(this.renderTextElement("p", "resume-entry__meta", meta));
    if (links) out.push(this.renderTextElement("p", "resume-entry__links", links));
    if (image) {
      out.push(
        `<figure class="resume-entry__image"><img src="${this.escapeHtml(image)}" alt="Entry image" /></figure>`,
      );
    }
    const mergedSummary = [summaryLine, ...summary].filter(Boolean).join(" ");
    if (mergedSummary.length > 0) {
      out.push(this.renderTextElement("p", "resume-entry__summary", mergedSummary));
    }
    if (stack.length > 0) out.push(this.renderList(stack, "resume-entry__stack"));
    if (highlights.length > 0) out.push(this.renderList(highlights, "resume-entry__highlights"));
    out.push("</article>");
    return out.join("\n");
  }

  private renderSection(section: Section): string {
    const out = [
      `<section class="resume-section resume-section--${section.slug}" data-section="${this.escapeHtml(section.slug)}" data-region="${
        this.escapeHtml(section.region)
      }">`,
      `<h2 class="resume-section__title">${this.formatInline(section.title)}</h2>`,
    ];

    let pendingSubtitle: string | null = null;

    for (const token of section.tokens) {
      if (token.type === "h3") {
        pendingSubtitle = token.text;
        continue;
      }

      if (token.type === "directive") {
        if (pendingSubtitle) {
          out.push(this.renderTextElement("h3", "resume-section__subtitle", pendingSubtitle));
          pendingSubtitle = null;
        }
        out.push(this.renderDirectiveBlock(token));
        continue;
      }

      if (token.type === "paragraph") {
        if (pendingSubtitle) {
          out.push(this.renderTextElement("h3", "resume-section__subtitle", pendingSubtitle));
          pendingSubtitle = null;
        }
        const parsed = this.parseStyleMarker(token.text);
        const classAttr = parsed.styleKey ? ` class="resume-block--${parsed.styleKey}"` : "";
        out.push(`<p${classAttr}>${this.formatInline(parsed.value)}</p>`);
        continue;
      }

      if (token.type === "list") {
        if (pendingSubtitle) {
          out.push(`<h3 class="resume-section__subtitle">${this.formatInline(pendingSubtitle)}</h3>`);
          pendingSubtitle = null;
        }
        out.push(this.renderList(token.items));
      }
    }

    out.push("</section>");
    return out.join("\n");
  }

  private renderLooseTokens(tokens: Token[]): string {
    if (tokens.length === 0) return "";

    const out: string[] = [];
    let pendingSubtitle: string | null = null;

    for (const token of tokens) {
      if (token.type === "h3") {
        pendingSubtitle = token.text;
        continue;
      }

      if (token.type === "paragraph") {
        if (pendingSubtitle) {
          out.push(this.renderTextElement("h3", "resume-section__subtitle", pendingSubtitle));
          pendingSubtitle = null;
        }
        const parsed = this.parseStyleMarker(token.text);
        const classAttr = parsed.styleKey ? ` class="resume-block--${parsed.styleKey}"` : "";
        out.push(`<p${classAttr}>${this.formatInline(parsed.value)}</p>`);
        continue;
      }

      if (token.type === "list") {
        if (pendingSubtitle) {
          out.push(this.renderTextElement("h3", "resume-section__subtitle", pendingSubtitle));
          pendingSubtitle = null;
        }
        out.push(this.renderList(token.items));
        continue;
      }

      if (token.type === "directive") {
        if (pendingSubtitle) {
          out.push(this.renderTextElement("h3", "resume-section__subtitle", pendingSubtitle));
          pendingSubtitle = null;
        }
        out.push(this.renderDirectiveBlock(token));
      }
    }

    return out.join("\n");
  }

  private renderResume(markdown: string, frontMatter: FrontMatter): string {
    const tokens = this.tokenize(markdown);

    let name = frontMatter.name || "Resume";
    let title = frontMatter.title || "";

    const firstSection = tokens.findIndex((t) => t.type === "h2");
    const headEnd = firstSection === -1 ? tokens.length : firstSection;

    for (let i = 0; i < headEnd; i += 1) {
      const token = tokens[i];
      if (token.type === "h1") name = token.text;
    }

    let contactItems: string[] = [];
    const introTokens: Token[] = [];
    for (let i = 0; i < headEnd; i += 1) {
      const token = tokens[i];
      if (token.type === "directive" && token.name === "contact") {
        contactItems = this.parseItems(token.lines);
        if (contactItems.length === 0) {
          contactItems = token.lines.map((v) => v.trim()).filter(Boolean);
        }
        continue;
      }

      if (token.type !== "h1") introTokens.push(token);
    }

    const sections: Section[] = [];
    let current: Section | null = null;
    for (let i = headEnd; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.type === "h2") {
        if (current) sections.push(current);
        const slug = this.slugify(token.text);
        const region = frontMatter.sidebarSections.has(slug) ? "sidebar" : "main";
        current = { title: token.text, slug, region, tokens: [] };
      } else if (current) {
        current.tokens.push(token);
      }
    }
    if (current) sections.push(current);

    const sidebar = sections.filter((s) => s.region === "sidebar");
    const main = sections.filter((s) => s.region !== "sidebar");

    const photoHtml = frontMatter.photo
      ? `<figure class="resume-photo"><img src="${this.escapeHtml(frontMatter.photo)}" alt="Profile photo" /></figure>`
      : "";
    const contactHtml = contactItems.length > 0
      ? `<div class="resume-contact">${this.renderList(contactItems)}</div>`
      : "";
    const titleHtml = title ? this.renderTextElement("p", "resume-title", title) : "";

    return `<section class="resume-layout">
      <aside class="resume-sidebar">
        ${photoHtml}
        ${contactHtml}
        ${sidebar.map((s) => this.renderSection(s)).join("\n")}
      </aside>
      <section class="resume-main">
        <header class="resume-header">
          <h1>${this.formatInline(name)}</h1>
          ${titleHtml}
        </header>
        ${this.renderLooseTokens(introTokens)}
        ${main.map((s) => this.renderSection(s)).join("\n")}
      </section>
    </section>`;
  }

  private buildThemeOverride(theme: Record<string, string>): string {
    const entries = Object.entries(theme);
    if (entries.length === 0) return "";
    const vars = entries
      .filter(([k, v]) => k.length > 0 && v.length > 0)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join("\n");
    return vars ? `:root {\n${vars}\n}` : "";
  }

  private generateHtmlTemplate(content: string, style: string): string {
    return `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Resume</title>
            <style>${style}</style>
          </head>
          <body>
            <main class="page">
              ${content}
            </main>
          </body>
        </html>`;
  }

  public renderDocument(markdown: string, css: string): string {
    const { body: yamlBody, frontMatter } = this.parseFrontMatter(markdown);
    const { body, inline } = this.parseInlineGlobals(yamlBody);
    const merged: FrontMatter = {
      ...frontMatter,
      template: inline.template ?? frontMatter.template,
      name: inline.name ?? frontMatter.name,
      title: inline.title ?? frontMatter.title,
      photo: inline.photo ?? frontMatter.photo,
      sidebarSections: (inline.sidebarSections && inline.sidebarSections.size > 0)
        ? inline.sidebarSections
        : frontMatter.sidebarSections,
      theme: { ...frontMatter.theme, ...(inline.theme ?? {}) },
      meta: { ...frontMatter.meta, ...(inline.meta ?? {}) },
    };
    const content = this.renderResume(body, merged);
    const themeOverride = this.buildThemeOverride(merged.theme);
    const mergedCss = themeOverride ? `${themeOverride}\n${css}` : css;
    return this.generateHtmlTemplate(content, mergedCss);
  }

  public async generateHtml(
    markdownPath: string,
    cssPath: string,
    outputPath: string,
  ): Promise<void> {
    const markdown = await Deno.readTextFile(markdownPath);
    const css = await Deno.readTextFile(cssPath);
    await Deno.mkdir(dirname(outputPath), { recursive: true });
    const html = this.renderDocument(markdown, css);
    await Deno.writeTextFile(outputPath, html);
  }
}

if (import.meta.main) {
  const rootPath = dirname(dirname(fromFileUrl(import.meta.url)));
  const generator = new MarkdownHtmlGenerator();
  await generator.generateHtml(
    join(rootPath, "resume/resume.md"),
    join(rootPath, "resume/styles.css"),
    join(rootPath, "out", "resume.html"),
  );
}
