import {
  assertEquals,
  assertRejects,
} from "@std/assert";
import { join } from "@std/path";
import { HtmlToPdfGenerator } from "./generate_pdf.ts";

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await Deno.makeTempDir();
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

function createMockGenerator(params: {
  throwOnPdf?: boolean;
  onPdfPath?: (path: string) => Promise<void> | void;
}) {
  const calls = {
    closeCount: 0,
    evaluateArgs: [] as unknown[],
    setContentHtml: "",
    pdfPath: "",
  };

  const page = {
    async emulateMedia() {
      // no-op
    },
    async setContent(html: string) {
      calls.setContentHtml = html;
    },
    async evaluate(arg: unknown) {
      calls.evaluateArgs.push(arg);
      return undefined;
    },
    async pdf(options: { path: string }) {
      calls.pdfPath = options.path;
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

Deno.test("rejects empty HTML input", async () => {
  const { generator } = createMockGenerator({});
  await assertRejects(
    () => generator.generate("   ", "/tmp/resume.pdf"),
    Error,
    "Cannot generate PDF from empty HTML content.",
  );
});

Deno.test("rejects empty output path", async () => {
  const { generator } = createMockGenerator({});
  await assertRejects(
    () => generator.generate("<html></html>", " "),
    Error,
    "Output path must not be empty.",
  );
});

Deno.test("creates output directory and renders PDF with expected sequence", async () => {
  await withTempDir(async (dir) => {
    const outPath = join(dir, "nested", "resume.pdf");
    const { generator, calls } = createMockGenerator({
      onPdfPath: async (path) => {
        await Deno.writeTextFile(path, "fake-pdf");
      },
    });

    await generator.generate("<html><body>resume</body></html>", outPath, {
      title: "Resume",
    });

    const content = await Deno.readTextFile(outPath);
    assertEquals(content, "fake-pdf");
    assertEquals(calls.setContentHtml, "<html><body>resume</body></html>");
    assertEquals(calls.pdfPath, outPath);
    assertEquals(calls.closeCount, 1);
    assertEquals(calls.evaluateArgs[1], "document.fonts.ready");
  });
});

Deno.test("always closes browser when PDF generation fails", async () => {
  await withTempDir(async (dir) => {
    const outPath = join(dir, "resume.pdf");
    const { generator, calls } = createMockGenerator({ throwOnPdf: true });

    await assertRejects(
      () => generator.generate("<html>resume</html>", outPath),
      Error,
      "pdf failed",
    );
    assertEquals(calls.closeCount, 1);
  });
});
