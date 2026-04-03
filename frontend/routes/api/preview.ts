import { define } from "../../utils.ts";
import { renderWithAssets } from "./_render_with_assets.ts";

interface PreviewBody {
  markdown?: string;
  css?: string;
  markdownPath?: string;
  cssPath?: string;
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
    const markdownPath = typeof body.markdownPath === "string"
      ? body.markdownPath
      : "";
    const cssPath = typeof body.cssPath === "string" ? body.cssPath : "";
    const html = await renderWithAssets({ markdown, css, markdownPath, cssPath });

    return Response.json({ html });
  },
});
