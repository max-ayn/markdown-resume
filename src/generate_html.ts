import { dirname, fromFileUrl, join } from "@std/path";

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

/** Converts a limited subset of Markdown into a styled HTML document. */
export class MarkdownHtmlGenerator {
  /** Applies inline markdown formatting (code, emphasis, links) to plain text. */
  private formatInline(text: string): string {
    const escaped = this.escapeHtml(text);
    return escaped
      .replace(/\\\s*/g, "<br />")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" rel="noopener noreferrer">$1</a>',
      );
  }

  /** Converts markdown into normalized block tokens. */
  private markdownToBlocks(markdown: string): Block[] {
    const lines = markdown.replaceAll("\r\n", "\n").split("\n");
    const out: Block[] = [];
    let paragraph: string[] = [];
    let bullets: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length === 0) return;
      out.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    };

    const flushBullets = () => {
      if (bullets.length === 0) return;
      out.push({ kind: "list", items: bullets });
      bullets = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === "") {
        flushParagraph();
        flushBullets();
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushBullets();
        const level = heading[1].length;
        if (level <= 3) {
          out.push({
            kind: "heading",
            level: level as 1 | 2 | 3,
            text: heading[2],
          });
        } else {
          paragraph.push(line);
        }
        continue;
      }

      const bullet = line.match(/^- (.+)$/);
      if (bullet) {
        flushParagraph();
        bullets.push(bullet[1]);
        continue;
      }

      flushBullets();
      paragraph.push(line);
    }

    flushParagraph();
    flushBullets();
    return out;
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  private renderBlocks(blocks: Block[]): string {
    const out: string[] = [];
    for (const block of blocks) {
      if (block.kind === "heading") {
        out.push(
          `<h${block.level}>${this.formatInline(block.text)}</h${block.level}>`,
        );
      } else if (block.kind === "paragraph") {
        out.push(`<p>${this.formatInline(block.text)}</p>`);
      } else {
        out.push("<ul>");
        for (const item of block.items) {
          out.push(`<li>${this.formatInline(item)}</li>`);
        }
        out.push("</ul>");
      }
    }
    return out.join("\n");
  }

  /** Converts markdown blocks into a semantic two-column resume layout. */
  private markdownToHtml(markdown: string): string {
    const blocks = this.markdownToBlocks(markdown);
    if (blocks.length === 0) return "";
    const hasSummarySection = blocks.some((block) =>
      block.kind === "heading" &&
      block.level === 2 &&
      this.slugify(block.text) === "summary"
    );
    if (!hasSummarySection) return this.renderBlocks(blocks);

    let index = 0;
    let name = "Resume";
    if (blocks[0].kind === "heading" && blocks[0].level === 1) {
      name = blocks[0].text;
      index = 1;
    }

    let contactHtml = "";
    const maybeContact = blocks[index];
    if (maybeContact?.kind === "paragraph") {
      contactHtml =
        `<p class="resume-contact">${this.formatInline(maybeContact.text)}</p>`;
      index += 1;
    }

    const lead: Block[] = [];
    while (index < blocks.length) {
      const block = blocks[index];
      if (block.kind === "heading" && block.level === 2) break;
      lead.push(block);
      index += 1;
    }

    const sections: Array<{ title: string; slug: string; blocks: Block[] }> = [];
    let current: { title: string; slug: string; blocks: Block[] } | null = null;

    for (; index < blocks.length; index++) {
      const block = blocks[index];
      if (block.kind === "heading" && block.level === 2) {
        if (current) sections.push(current);
        const slug = this.slugify(block.text || "section");
        current = { title: block.text, slug, blocks: [block] };
      } else {
        if (!current) {
          lead.push(block);
        } else {
          current.blocks.push(block);
        }
      }
    }
    if (current) sections.push(current);

    const sidebarNames = new Set(["skills", "languages", "interests"]);
    const sidebarSections = sections.filter((section) =>
      sidebarNames.has(section.slug)
    );
    const mainSections = sections.filter((section) => !sidebarNames.has(section.slug));

    const renderSection = (section: { slug: string; blocks: Block[] }) =>
      `<section class="resume-section resume-section--${section.slug}">${this.renderBlocks(section.blocks)}</section>`;

    const leadHtml = lead.length > 0
      ? `<section class="resume-section resume-section--lead">${this.renderBlocks(lead)}</section>`
      : "";

    return `<section class="resume-layout">
      <aside class="resume-sidebar">
        ${contactHtml}
        ${sidebarSections.map(renderSection).join("\n")}
      </aside>
      <section class="resume-main">
        <header class="resume-header">
          <h1>${this.formatInline(name)}</h1>
        </header>
        ${leadHtml}
        ${mainSections.map(renderSection).join("\n")}
      </section>
    </section>`;
  }

  /** Escapes reserved HTML characters in text nodes. */
  private escapeHtml(text: string): string {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  /** Wraps rendered resume content into a full HTML document template. */
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

  /** Renders a complete HTML document from markdown + CSS strings. */
  public renderDocument(markdown: string, css: string): string {
    const content = this.markdownToHtml(markdown);
    return this.generateHtmlTemplate(content, css);
  }

  /**
   * Reads markdown and CSS files, renders HTML, and writes the output file.
   *
   * @param markdownPath Path to the markdown input file.
   * @param cssPath Path to the CSS stylesheet file.
   * @param outputPath Path where the generated HTML will be written.
   * @returns A promise that resolves when the HTML file is written.
   */
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
  // deno run --allow-read --allow-write ./src/generate_html.ts
  const rootPath = dirname(dirname(fromFileUrl(import.meta.url)));
  const generator = new MarkdownHtmlGenerator();
  await generator.generateHtml(
    join(rootPath, "resume/resume.md"),
    join(rootPath, "resume/styles.css"),
    join(rootPath, "out", "resume.html"),
  );
}
