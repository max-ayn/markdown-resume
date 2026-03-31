import { dirname, fromFileUrl, join } from "@std/path";

type FrontMatter = {
  template?: string;
  name?: string;
  title?: string;
  photo?: string;
  sidebarSections: Set<string>;
  theme: Record<string, string>;
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
        },
      };
    }

    const frontMatter: FrontMatter = {
      sidebarSections: new Set(this.defaultSidebar),
      theme: {},
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
    }

    return {
      body: lines.slice(end + 1).join("\n"),
      frontMatter,
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

  private renderEntry(token: Extract<Token, { type: "directive" }>): string {
    let title = "";
    let meta = "";
    let links = "";
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
      } else if (line.startsWith("- ")) {
        highlights.push(line.slice(2).trim());
      } else {
        summary.push(line);
      }
    }

    const kind = token.attrs.kind ? this.slugify(token.attrs.kind) : "generic";
    const out = [`<article class="resume-entry resume-entry--${kind}">`];
    if (title) out.push(this.renderTextElement("h3", "resume-entry__title", title));
    if (meta) out.push(this.renderTextElement("p", "resume-entry__meta", meta));
    if (links) out.push(this.renderTextElement("p", "resume-entry__links", links));
    if (summary.length > 0) {
      out.push(this.renderTextElement("p", "resume-entry__summary", summary.join(" ")));
    }
    if (stack.length > 0) out.push(this.renderList(stack, "resume-entry__stack"));
    if (highlights.length > 0) out.push(this.renderList(highlights, "resume-entry__highlights"));
    out.push("</article>");
    return out.join("\n");
  }

  private renderSection(section: Section): string {
    const out = [
      `<section class="resume-section resume-section--${section.slug}">`,
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

        if (token.name === "entry") {
          out.push(this.renderEntry(token));
          continue;
        }

        if (token.name === "lead") {
          const text = token.lines.map((v) => v.trim()).filter(Boolean).join(" ");
          out.push(this.renderTextElement("p", "resume-lead", text));
          continue;
        }

        if (token.name === "note") {
          const text = token.lines.map((v) => v.trim()).filter(Boolean).join(" ");
          out.push(this.renderTextElement("p", "resume-note", text));
          continue;
        }

        if (token.name === "tags") {
          const items = this.parseItems(token.lines);
          out.push(this.renderList(items, "resume-taglist", "resume-tag"));
          continue;
        }

        if (token.name === "fact-list") {
          const items = this.parseItems(token.lines);
          out.push(`<div class="resume-fact-list">${this.renderList(items)}</div>`);
          continue;
        }

        const fallback = token.lines.map((v) => v.trim()).filter(Boolean).join(" ");
        if (fallback) out.push(`<p>${this.formatInline(fallback)}</p>`);
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
        if (token.name === "lead") {
          const text = token.lines.map((v) => v.trim()).filter(Boolean).join(" ");
          out.push(this.renderTextElement("p", "resume-lead", text));
          continue;
        }
        if (token.name === "note") {
          const text = token.lines.map((v) => v.trim()).filter(Boolean).join(" ");
          out.push(this.renderTextElement("p", "resume-note", text));
          continue;
        }
        if (token.name === "entry") {
          out.push(this.renderEntry(token));
          continue;
        }
        if (token.name === "tags") {
          const items = this.parseItems(token.lines);
          out.push(this.renderList(items, "resume-taglist", "resume-tag"));
          continue;
        }
        if (token.name === "fact-list") {
          const items = this.parseItems(token.lines);
          out.push(`<div class="resume-fact-list">${this.renderList(items)}</div>`);
          continue;
        }

        const fallback = token.lines.map((v) => v.trim()).filter(Boolean).join(" ");
        if (fallback) out.push(`<p>${this.formatInline(fallback)}</p>`);
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
        current = { title: token.text, slug: this.slugify(token.text), tokens: [] };
      } else if (current) {
        current.tokens.push(token);
      }
    }
    if (current) sections.push(current);

    const sidebar = sections.filter((s) => frontMatter.sidebarSections.has(s.slug));
    const main = sections.filter((s) => !frontMatter.sidebarSections.has(s.slug));

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
    const { body, frontMatter } = this.parseFrontMatter(markdown);
    const content = this.renderResume(body, frontMatter);
    const themeOverride = this.buildThemeOverride(frontMatter.theme);
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
