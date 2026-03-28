import { dirname, fromFileUrl, join } from "@std/path";

/** Converts a limited subset of Markdown into a styled HTML document. */
export class MarkdownHtmlGenerator {
  /** Applies inline markdown formatting (code, emphasis, links) to plain text. */
  private formatInline(text: string): string {
    const escaped = this.escapeHtml(text);
    return escaped
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" rel="noopener noreferrer">$1</a>',
      );
  }

  /** Converts markdown blocks (headings, paragraphs, and bullet lists) to HTML. */
  private markdownToHtml(markdown: string): string {
    const lines = markdown.replaceAll("\r\n", "\n").split("\n");
    const out: string[] = [];
    let paragraph: string[] = [];
    let bullets: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length === 0) return;
      out.push(`<p>${this.formatInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    };

    const flushBullets = () => {
      if (bullets.length === 0) return;
      out.push("<ul>");
      for (const item of bullets) {
        out.push(`<li>${this.formatInline(item)}</li>`);
      }
      out.push("</ul>");
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
        out.push(`<h${level}>${this.formatInline(heading[2])}</h${level}>`);
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
    return out.join("\n");
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

    const content = this.markdownToHtml(markdown);

    const html = this.generateHtmlTemplate(content, css);

    await Deno.writeTextFile(outputPath, html);
  }
}

if (import.meta.main) {
  // deno run --allow-read --allow-write ./src/generate_html.ts
  const rootPath = dirname(dirname(fromFileUrl(import.meta.url)));
  const generator = new MarkdownHtmlGenerator();
  await generator.generateHtml(
    join(rootPath, "resume.md"),
    join(rootPath, "styles.css"),
    join(rootPath, "out", "resume.html"),
  );
}
