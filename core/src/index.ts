/**
 * @module
 *
 * Semantic Resume Core API.
 *
 * @example
 * ```ts
 * import {
 *   SemanticResumeHtmlRenderer,
 *   SemanticResumeParser,
 * } from "./src/index.ts";
 *
 * const parser = new SemanticResumeParser();
 * const renderer = new SemanticResumeHtmlRenderer();
 * const ast = parser.parse("# Jane Doe");
 * const html = renderer.render(ast);
 * ```
 */

/**
 * Types describing the normalized resume AST and validation model.
 */
export type {
  BlockAst,
  BlockAttributesAst,
  FieldAst,
  KnownFieldName,
  ListItemAst,
  MarkdownLineAst,
  NormalizedConfiguration,
  ParseArtifacts,
  PreambleAst,
  RegionConfiguration,
  ResumeAstDocument,
  SectionAst,
  ValidationIssue,
  ValidationResult,
} from "./types.ts";

/**
 * Renderer options for hidden/debug output handling.
 */
export type { RenderOptions } from "./html-renderer.ts";

/**
 * PDF generation options.
 */
export type { GeneratePdfOptions } from "./generate-pdf.ts";

/**
 * Options for raw Markdown serialization.
 */
export type { SerializeRawMarkdownOptions } from "./raw-markdown.ts";

/**
 * Parser for the semantic resume Markdown dialect.
 */
export { SemanticResumeParser } from "./parser.ts";

/**
 * Semantic HTML renderer for normalized resume AST documents.
 */
export { SemanticResumeHtmlRenderer } from "./html-renderer.ts";

/**
 * HTML to PDF generator backed by Playwright.
 */
export { HtmlToPdfGenerator } from "./generate-pdf.ts";

/**
 * Serializer from semantic AST to plain Markdown.
 */
export { serializeResumeToRawMarkdown } from "./raw-markdown.ts";
