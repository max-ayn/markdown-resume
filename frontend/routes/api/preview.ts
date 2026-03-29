import { define } from "../../utils.ts";
import { MarkdownHtmlGenerator } from "../../../src/generate_html.ts";

const generator = new MarkdownHtmlGenerator();

interface PreviewBody {
  markdown?: string;
  css?: string;
}

export const handler = define.handlers({
  async POST(ctx) {
    let body: PreviewBody;

    try {
      body = await ctx.req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    const markdown = typeof body.markdown === "string" ? body.markdown : "";
    const css = typeof body.css === "string" ? body.css : "";
    const html = generator.renderDocument(markdown, css);

    return Response.json({ html });
  },
});
