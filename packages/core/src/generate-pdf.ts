import { mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { measureContentHeights } from "./measure-overflow.ts";

type PdfPage = {
  emulateMedia(options: { media: "print" | "screen" }): Promise<void>;
  goto(
    url: string,
    options: { waitUntil: "load" | "domcontentloaded" | "networkidle" },
  ): Promise<void>;
  setContent(
    html: string,
    options: { waitUntil: "load" | "domcontentloaded" | "networkidle" },
  ): Promise<void>;
  evaluate<R, Arg>(
    pageFunction: string | ((arg: Arg) => R),
    arg?: Arg,
  ): Promise<R>;
  pdf(options: {
    path: string;
    format: string;
    printBackground: boolean;
    preferCSSPageSize: boolean;
    margin: { top: string; right: string; bottom: string; left: string };
    displayHeaderFooter: boolean;
    scale: number;
  }): Promise<void>;
};

type PdfBrowser = {
  newPage(options: {
    viewport: { width: number; height: number };
  }): Promise<PdfPage>;
  close(): Promise<void>;
};

type PdfEngine = {
  launch(): Promise<PdfBrowser>;
};

/** Options controlling how the HTML page is rendered before PDF export. */
export type GeneratePdfOptions = {
  /** Page title used by Playwright for diagnostics and metadata. */
  title?: string;
  /** Optional source HTML file path for resolving relative assets in print rendering. */
  sourceHtmlPath?: string;
  /** Paper format passed to Playwright, e.g. "A4" or "Letter". Defaults to "A4". */
  pageFormat?: string;
  /** Uniform page margin (CSS length) applied to all sides. Defaults to "0". */
  pageMargin?: string;
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
    await mkdir(dirname(outputPath), { recursive: true });

    const browser = await this.engine.launch();

    try {
      const page = await browser.newPage({
        viewport: { width: 794, height: 1123 },
      });
      await page.emulateMedia({ media: "print" });
      if (options.sourceHtmlPath && options.sourceHtmlPath.trim().length > 0) {
        const sourceUrl = pathToFileURL(resolve(options.sourceHtmlPath)).href;
        await page.goto(sourceUrl, { waitUntil: "networkidle" });
      } else {
        await page.setContent(html, { waitUntil: "networkidle" });
      }
      if (options.title) {
        await page.evaluate((title) => {
          (
            globalThis as unknown as { document: { title: string } }
          ).document.title = title;
        }, options.title);
      }
      await page.evaluate("document.fonts.ready");
      const { contentHeightPx, pageHeightPx: a4HeightPx } = await page.evaluate(
        measureContentHeights,
        297,
      );
      const estimatedPages = contentHeightPx / Math.max(a4HeightPx, 1);
      // Only auto-shrink when content is effectively single-page.
      // For multi-page documents, keep scale=1 to avoid a narrow "shrunk" layout.
      const scale =
        estimatedPages > 1.02
          ? 1
          : Math.min(
              1,
              Math.max(0.55, a4HeightPx / Math.max(contentHeightPx, 1)),
            );
      const format = options.pageFormat?.trim() || "A4";
      const margin = options.pageMargin?.trim() || "0";
      await page.pdf({
        path: outputPath,
        format,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        displayHeaderFooter: false,
        scale,
      });
    } finally {
      await browser.close();
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const rootPath = dirname(dirname(fileURLToPath(import.meta.url)));
  const htmlContent = await readFile(
    join(rootPath, "out", "resume.html"),
    "utf-8",
  );
  const generator = new HtmlToPdfGenerator();
  await generator.generate(htmlContent, join(rootPath, "out", "resume.pdf"), {
    title: "Resume",
  });
}
