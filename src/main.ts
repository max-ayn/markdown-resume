import { dirname, fromFileUrl, join, relative } from "@std/path";
import { MarkdownHtmlGenerator } from "./generate_html.ts";
import { HtmlToPdfGenerator } from "./generate_pdf.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const inputMarkdown = join(ROOT, "resume", "resume.md");
const inputCss = join(ROOT, "resume", "styles.css");
const outputHtml = join(ROOT, "out", "resume.html");
const outputPdf = join(ROOT, "out", "resume.pdf");

/** Generates resume HTML and optionally a PDF via --pdf. */
export async function run(args: string[] = Deno.args): Promise<void> {
  const wantsPdf = args.includes("--pdf");

  const htmlGenerator = new MarkdownHtmlGenerator();
  await htmlGenerator.generateHtml(inputMarkdown, inputCss, outputHtml);
  console.log(`HTML written to ${relative(ROOT, outputHtml)}`);

  if (!wantsPdf) return;

  const html = await Deno.readTextFile(outputHtml);
  const pdfGenerator = new HtmlToPdfGenerator();
  await pdfGenerator.generate(html, outputPdf, { title: "Resume" });
  console.log(`PDF written to ${relative(ROOT, outputPdf)}`);
}

if (import.meta.main) {
  run().catch((error) => {
    console.error(error);
    Deno.exit(1);
  });
}
