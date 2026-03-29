import { HtmlToPdfGenerator } from "../../src/generate_pdf.ts";

const [htmlPath, outputPath] = Deno.args;

if (!htmlPath || !outputPath) {
  console.error("Usage: pdf_worker.ts <htmlPath> <outputPath>");
  Deno.exit(2);
}

const html = await Deno.readTextFile(htmlPath);
const generator = new HtmlToPdfGenerator();
await generator.generate(html, outputPath, { title: "Resume" });
