import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

type OverflowPage = {
  emulateMedia(options: { media: "print" | "screen" }): Promise<void>;
  goto(
    url: string,
    options: { waitUntil: "load" | "domcontentloaded" | "networkidle" },
  ): Promise<void>;
  setContent(
    html: string,
    options: { waitUntil: "load" | "domcontentloaded" | "networkidle" },
  ): Promise<void>;
  evaluate<R, Arg>(pageFunction: string | ((arg: Arg) => R), arg?: Arg): Promise<R>;
};

type OverflowBrowser = {
  newPage(options: { viewport: { width: number; height: number } }): Promise<OverflowPage>;
  close(): Promise<void>;
};

type OverflowEngine = {
  launch(): Promise<OverflowBrowser>;
};

export type OverflowMeasurement = {
  contentHeightPx: number;
  pageHeightPx: number;
  estimatedPages: number;
  overflowRatio: number;
};

/**
 * Measures the rendered `.page` content height against one physical page
 * (`pageHeightMm` tall). Runs inside the browser via `page.evaluate` — must
 * stay a plain function with no outer closures.
 */
export function measureContentHeights(
  pageHeightMm: number,
): { contentHeightPx: number; pageHeightPx: number } {
  const doc = (globalThis as unknown as {
    document: {
      querySelector(selector: string): {
        scrollHeight: number;
        offsetHeight: number;
        getBoundingClientRect(): { height: number };
      } | null;
      documentElement: { scrollHeight: number };
      body: {
        scrollHeight: number;
        appendChild(node: unknown): void;
      };
      createElement(tag: string): {
        style: Record<string, string>;
        getBoundingClientRect(): { height: number };
        remove(): void;
      };
    };
  }).document;

  const pageEl = doc.querySelector(".page");
  const contentHeightPx = pageEl
    ? Math.max(
      pageEl.scrollHeight,
      pageEl.offsetHeight,
      pageEl.getBoundingClientRect().height,
    )
    : Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);

  const probe = doc.createElement("div");
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  probe.style.top = "0";
  probe.style.height = `${pageHeightMm}mm`;
  probe.style.width = "1px";
  doc.body.appendChild(probe);
  const pageHeightPx = probe.getBoundingClientRect().height;
  probe.remove();

  return { contentHeightPx, pageHeightPx };
}

/**
 * Renders `html` in a headless browser and measures how many physical pages
 * (`pageHeightMm` tall, default 297 = A4) the content spans.
 */
export async function measurePageOverflow(
  html: string,
  options: {
    pageHeightMm?: number;
    sourceHtmlPath?: string;
    engine?: OverflowEngine;
  } = {},
): Promise<OverflowMeasurement> {
  const pageHeightMm = options.pageHeightMm ?? 297;
  const engine = options.engine ?? (chromium as unknown as OverflowEngine);
  const browser = await engine.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.emulateMedia({ media: "print" });
    if (options.sourceHtmlPath && options.sourceHtmlPath.trim().length > 0) {
      const sourceUrl = pathToFileURL(resolve(options.sourceHtmlPath)).href;
      await page.goto(sourceUrl, { waitUntil: "networkidle" });
    } else {
      await page.setContent(html, { waitUntil: "networkidle" });
    }
    await page.evaluate("document.fonts.ready");
    const { contentHeightPx, pageHeightPx } = await page.evaluate(
      measureContentHeights,
      pageHeightMm,
    );
    const estimatedPages = contentHeightPx / Math.max(pageHeightPx, 1);
    return {
      contentHeightPx,
      pageHeightPx,
      estimatedPages,
      overflowRatio: Math.max(0, estimatedPages - 1),
    };
  } finally {
    await browser.close();
  }
}
