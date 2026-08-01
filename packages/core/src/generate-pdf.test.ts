import { expect, it } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { HtmlToPdfGenerator } from "./generate-pdf.ts";

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "markdown-resume-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true });
  }
}

function createMockGenerator(params: {
  throwOnPdf?: boolean;
  onPdfPath?: (path: string) => Promise<void> | void;
  measuredHeights?: { contentHeightPx: number; a4HeightPx: number };
}) {
  const calls = {
    closeCount: 0,
    evaluateArgs: [] as unknown[],
    setContentHtml: "",
    pdfPath: "",
    pdfScale: 0,
  };

  const page = {
    async emulateMedia() {
      // no-op
    },
    async goto() {
      // no-op
    },
    async setContent(html: string) {
      calls.setContentHtml = html;
    },
    async evaluate(arg: unknown) {
      calls.evaluateArgs.push(arg);
      if (typeof arg === "function") {
        return params.measuredHeights ?? { contentHeightPx: 1123, a4HeightPx: 1123 };
      }
      return undefined;
    },
    async pdf(options: { path: string; scale: number }) {
      calls.pdfPath = options.path;
      calls.pdfScale = options.scale;
      if (params.onPdfPath) {
        await params.onPdfPath(options.path);
      }
      if (params.throwOnPdf) {
        throw new Error("pdf failed");
      }
    },
  };

  const browser = {
    async newPage() {
      return page;
    },
    async close() {
      calls.closeCount += 1;
    },
  };

  const engine = {
    async launch() {
      return browser;
    },
  };

  return {
    generator: new HtmlToPdfGenerator(
      engine as unknown as ConstructorParameters<typeof HtmlToPdfGenerator>[0],
    ),
    calls,
  };
}

it("rejects empty HTML input", async () => {
  const { generator } = createMockGenerator({});
  await expect(generator.generate("   ", "/tmp/resume.pdf")).rejects.toThrow(
    "Cannot generate PDF from empty HTML content.",
  );
});

it("rejects empty output path", async () => {
  const { generator } = createMockGenerator({});
  await expect(generator.generate("<html></html>", " ")).rejects.toThrow(
    "Output path must not be empty.",
  );
});

it("creates output directory and renders PDF with expected sequence", async () => {
  await withTempDir(async (dir) => {
    const outPath = join(dir, "nested", "resume.pdf");
    const { generator, calls } = createMockGenerator({
      onPdfPath: async (path) => {
        await writeFile(path, "fake-pdf", "utf-8");
      },
    });

    await generator.generate("<html><body>resume</body></html>", outPath, {
      title: "Resume",
    });

    const content = await readFile(outPath, "utf-8");
    expect(content).toBe("fake-pdf");
    expect(calls.setContentHtml).toBe("<html><body>resume</body></html>");
    expect(calls.pdfPath).toBe(outPath);
    expect(calls.closeCount).toBe(1);
    expect(calls.evaluateArgs[1]).toBe("document.fonts.ready");
  });
});

it("always closes browser when PDF generation fails", async () => {
  await withTempDir(async (dir) => {
    const outPath = join(dir, "resume.pdf");
    const { generator, calls } = createMockGenerator({ throwOnPdf: true });

    await expect(
      generator.generate("<html>resume</html>", outPath),
    ).rejects.toThrow("pdf failed");
    expect(calls.closeCount).toBe(1);
  });
});

it("does not downscale multi-page content", async () => {
  await withTempDir(async (dir) => {
    const outPath = join(dir, "resume.pdf");
    const { generator, calls } = createMockGenerator({
      measuredHeights: {
        contentHeightPx: 2500,
        a4HeightPx: 1000,
      },
      onPdfPath: async (path) => {
        await writeFile(path, "fake-pdf", "utf-8");
      },
    });

    await generator.generate("<html><body>resume</body></html>", outPath);
    expect(calls.pdfScale).toBe(1);
  });
});
