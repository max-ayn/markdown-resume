import { chromium } from "playwright";

const [htmlPath, imagePath] = Deno.args;

if (!htmlPath || !imagePath) {
  console.error("Usage: preview_image_worker.ts <htmlPath> <imagePath>");
  Deno.exit(2);
}

const html = await Deno.readTextFile(htmlPath);
const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: 794, height: 1123 },
  });
  await page.emulateMedia({ media: "screen" });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate("document.fonts.ready");
  await page.screenshot({
    path: imagePath,
    fullPage: true,
    type: "png",
  });
} finally {
  await browser.close();
}
