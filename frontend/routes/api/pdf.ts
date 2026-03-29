import { define } from "../../utils.ts";
import { fromFileUrl, join } from "@std/path";
import { MarkdownHtmlGenerator } from "../../../src/generate_html.ts";

const htmlGenerator = new MarkdownHtmlGenerator();

interface PdfBody {
  markdown?: string;
  css?: string;
}

export const handler = define.handlers({
  async POST(ctx) {
    let body: PdfBody;

    try {
      body = await ctx.req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    const markdown = typeof body.markdown === "string" ? body.markdown : "";
    const css = typeof body.css === "string" ? body.css : "";
    const html = htmlGenerator.renderDocument(markdown, css);

    const tempDir = await Deno.makeTempDir({ prefix: "resume-pdf-" });
    const htmlPath = join(tempDir, "resume.html");
    const outputPath = join(tempDir, "resume.pdf");
    await Deno.writeTextFile(htmlPath, html);

    const workerPath = fromFileUrl(new URL("../../scripts/pdf_worker.ts", import.meta.url));

    try {
      const command = new Deno.Command("deno", {
        args: [
          "run",
          "--allow-read",
          "--allow-write",
          "--allow-env",
          "--allow-sys",
          "--allow-run",
          workerPath,
          htmlPath,
          outputPath,
        ],
        stdout: "piped",
        stderr: "piped",
      });

      const result = await command.output();
      if (result.code !== 0) {
        const errorText = new TextDecoder().decode(result.stderr).trim();
        return new Response(
          `PDF generation failed: ${errorText || `exit code ${result.code}`}`,
          { status: 500 },
        );
      }

      const pdfBytes = await Deno.readFile(outputPath);
      return new Response(pdfBytes, {
        headers: {
          "content-type": "application/pdf",
          "content-disposition": "attachment; filename=resume.pdf",
          "cache-control": "no-store",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new Response(`PDF generation failed: ${message}`, { status: 500 });
    } finally {
      await Deno.remove(tempDir, { recursive: true }).catch(() => undefined);
    }
  },
});
