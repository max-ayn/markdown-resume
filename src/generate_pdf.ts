import { dirname, fromFileUrl, join } from "@std/path";
import { chromium } from "playwright";

type PdfPage = {
  emulateMedia(options: { media: "print" | "screen" }): Promise<void>;
  setContent(
    html: string,
    options: { waitUntil: "load" | "domcontentloaded" | "networkidle" },
  ): Promise<void>;
  evaluate<R, Arg>(pageFunction: string | ((arg: Arg) => R), arg?: Arg): Promise<R>;
  pdf(options: {
    path: string;
    format: "A4";
    printBackground: boolean;
    preferCSSPageSize: boolean;
    margin: { top: string; right: string; bottom: string; left: string };
    displayHeaderFooter: boolean;
    scale: number;
  }): Promise<void>;
};

type PdfBrowser = {
  newPage(options: { viewport: { width: number; height: number } }): Promise<PdfPage>;
  close(): Promise<void>;
};

type PdfEngine = {
  launch(): Promise<PdfBrowser>;
};

/** Options controlling how the HTML page is rendered before PDF export. */
export type GeneratePdfOptions = {
  /** Page title used by Playwright for diagnostics and metadata. */
  title?: string;
};

/** Renders HTML markup to a PDF file using Playwright Chromium. */
export class HtmlToPdfGenerator {
  private readonly engine: PdfEngine;

  /** Creates a PDF generator with an optional browser engine override for testing. */
  constructor(engine: PdfEngine = chromium as unknown as PdfEngine) {
    this.engine = engine;
  }

  /**
   * Writes a PDF from an HTML string.
   *
   * @param html Full HTML document string to render.
   * @param outputPath Destination PDF file path.
   * @param options Optional rendering options.
   * @returns A promise that resolves when the PDF has been written.
   */
  public async generate(
    html: string,
    outputPath: string,
    options: GeneratePdfOptions = {},
  ): Promise<void> {
    if (html.trim().length === 0) {
      throw new Error("Cannot generate PDF from empty HTML content.");
    }
    if (outputPath.trim().length === 0) {
      throw new Error("Output path must not be empty.");
    }
    await Deno.mkdir(dirname(outputPath), { recursive: true });

    const browser = await this.engine.launch();

    try {
      const page = await browser.newPage({
        viewport: { width: 794, height: 1123 },
      });
      await page.emulateMedia({ media: "print" });
      await page.setContent(html, { waitUntil: "networkidle" });
      if (options.title) {
        await page.evaluate(
          (title) => {
            (globalThis as unknown as { document: { title: string } }).document
              .title = title;
          },
          options.title,
        );
      }
      await page.evaluate("document.fonts.ready");
      await page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        displayHeaderFooter: false,
        scale: 1,
      });
    } finally {
      await browser.close();
    }
  }
}

if (import.meta.main) {
  // deno run --allow-read --allow-write --allow-env --allow-sys --allow-run ./src/generate_pdf.ts
  const rootPath = dirname(dirname(fromFileUrl(import.meta.url)));
  const htmlContent = await Deno.readTextFile(join(rootPath, "out", "resume.html"));
  const generator = new HtmlToPdfGenerator();
  await generator.generate(
    htmlContent,
    join(rootPath, "out", "resume.pdf"),
    { title: "Resume" },
  );
}
