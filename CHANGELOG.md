# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Changed

- Replaced the hand-rolled Markdown parser/AST/HTML renderer with a
  `gray-matter` + `markdown-it` pipeline (`packages/core/src/markdown.ts` +
  `src/rules/*`). The marker syntax (`@date`, `@icon`, `@image`, `@note`,
  `@stack`, `@hidden`, `:::block{...}`) stays the same; validation and
  rendering are now driven by markdown-it plugins instead of a custom AST.
- Regions (`header`/`main`/`sidebar`/`footer`) are now actually laid out:
  sections are grouped into `<div data-region="...">` wrappers per the
  frontmatter `regions.*.sections` map, anchored on each section's `h2`
  heading (including `@hidden` headings, which still anchor a region while
  rendering nothing).
- Dropped `--raw-md-out`/`--raw-md-include-hidden`/`--debug-hidden` from the
  CLI — there is no AST left to re-serialize or debug-render from.
- Reworked the CLI around a folder-based interface: `-i`/`-o`/`-md`/`-style`/
  `-pdf` replace `--md`/`--css`/`--html-out`/`--pdf-out`/`--pdf`, with
  auto-discovery of the markdown/CSS file in a folder when `-md`/`-style`
  are omitted. Added (stubbed, not yet implemented) `generate-style`,
  `sanitized`, and `check` subcommands.
- Switched the toolchain from Deno to Node.js + pnpm workspaces.
  - `core/` and `cli/` moved to `packages/core` (`@markdown-resume/core`) and
    `packages/cli` (`@markdown-resume/cli`).
  - Replaced `Deno.*` APIs and `@std/*` imports with Node built-ins
    (`node:fs/promises`, `node:path`, `node:url`).
  - Ported `Deno.test` + `@std/assert` tests to Vitest.
  - CLI now runs via `pnpm run cli -- <args>` (backed by `tsx`) instead of
    `deno run cli.ts`.
- Updated README install/usage instructions for pnpm.

## [0.1.0] - Initial implementation

### Added

- Semantic Markdown parser, HTML renderer, and raw-Markdown serializer.
- Playwright-based HTML-to-PDF generator.
- CLI for generating HTML/PDF/raw-Markdown output from a resume Markdown file.
- Example resumes and CSS themes (`simple`, `software`, `ux-ui`).
