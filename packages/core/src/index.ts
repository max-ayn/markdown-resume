/**
 * @module
 *
 * Semantic Resume Core API.
 *
 * @example
 * ```ts
 * import { renderMarkdown } from "./src/index.ts";
 *
 * const { html, data, issues } = renderMarkdown("# Jane Doe");
 * ```
 */

/**
 * Local image/CSS asset inlining and copying for rendered HTML.
 */
export {
  inlineLocalAssetUrlsForPdf,
  materializeLocalImageAssets,
  rewriteAssetPaths,
} from "./assets.ts";
/**
 * PDF generation options.
 */
export type { GeneratePdfOptions } from "./generate-pdf.ts";
/**
 * HTML to PDF generator backed by Playwright.
 */
export { HtmlToPdfGenerator } from "./generate-pdf.ts";
/**
 * Wraps a rendered fragment into a full standalone resume HTML document.
 */
export {
  buildHtmlDocument,
  buildResumeHtmlDocument,
  formatPageMargin,
  injectBaseHref,
  resolvePageDimensionsMm,
} from "./html-document.ts";
/**
 * Parses frontmatter + semantic Markdown and renders it to an HTML fragment.
 */
export { md, renderMarkdown } from "./markdown.ts";
/**
 * Measures how many physical pages rendered HTML content spans.
 */
export type { OverflowMeasurement } from "./measure-overflow.ts";
export { measurePageOverflow } from "./measure-overflow.ts";
/**
 * Boilerplate stylesheet scaffolding for `generate-style`.
 */
export {
  buildStylesheetBoilerplate,
  STYLE_BOILERPLATE,
} from "./style-boilerplate.ts";
export type {
  FrontmatterData,
  RenderResult,
  ValidationIssue,
} from "./types.ts";
/**
 * Frontmatter/marker validation, run internally by `renderMarkdown`.
 */
export { validateDocument } from "./validation.ts";
