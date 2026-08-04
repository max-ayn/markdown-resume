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

export type { FrontmatterData, RenderResult, ValidationIssue } from "./types.ts";

/**
 * Parses frontmatter + semantic Markdown and renders it to an HTML fragment.
 */
export { md, renderMarkdown } from "./markdown.ts";

/**
 * Frontmatter/marker validation, run internally by `renderMarkdown`.
 */
export { validateDocument } from "./validation.ts";

/**
 * PDF generation options.
 */
export type { GeneratePdfOptions } from "./generate-pdf.ts";

/**
 * HTML to PDF generator backed by Playwright.
 */
export { HtmlToPdfGenerator } from "./generate-pdf.ts";

/**
 * Measures how many physical pages rendered HTML content spans.
 */
export type { OverflowMeasurement } from "./measure-overflow.ts";
export { measurePageOverflow } from "./measure-overflow.ts";
