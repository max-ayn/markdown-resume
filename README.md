# Markdown Resume Builder

Generate resumes from semantic Markdown + CSS into HTML and PDF.

## Install

### Prerequisites

- Node 20+
- pnpm 9+
- Playwright Chromium (for PDF export)

```bash
pnpm install
```

Install Chromium once:

```bash
pnpm exec playwright install chromium
```

## Quick Start

From repository root:

```bash
pnpm run cli -- -i examples/software -o out
```

This auto-discovers the single `.md` and `.css` file inside `examples/software/`
and writes `out/resume.html`.

## CLI

```
cli [-i <input_folder>] [-o <output_path>] [-md <filename>] [-style <path>] [-pdf | --with-pdf]
cli generate-style [-i <input_folder>] [-o <output_path>]
cli sanitized       [-i <input_folder>] [-o <output_path>]
cli check           [-i <input_folder>]
```

- `-i` — input folder, default `.`
- `-o` — output folder, default `.`
- `-md` — markdown filename inside `-i`; if omitted, the single `.md` file in
  that folder is used (error if there's zero or more than one)
- `-style` — stylesheet path (resolved relative to `-i` if relative); same
  auto-discovery rule as `-md`, but for `.css`
- `-pdf` / `--with-pdf` — also generate a PDF next to the HTML output

Output filenames are derived from the markdown file's basename:
`<output>/<name>.html` and, with `-pdf`, `<output>/<name>.pdf`.

### HTML + PDF

```bash
pnpm run cli -- -i examples/software -o out -pdf
```

### Subcommands (not yet implemented)

- `generate-style` — scaffold a stylesheet from the classes a render produces
- `sanitized` — strip semantic markers back down to plain markdown
- `check` — batch-validate every markdown file in a folder

These currently print `<command> is not implemented yet.` and exit 1.

## Project Structure

- `packages/cli/`
  - `src/cli.ts`: command entrypoint (parse -> render -> optional pdf)
- `packages/core/`
  - `src/markdown.ts`: gray-matter + markdown-it pipeline (frontmatter, validation, render)
  - `src/rules/`: markdown-it plugins for the resume marker syntax (`@date`, `@icon`, `@image`, ...)
  - `src/validation.ts`: frontmatter/marker validation
  - `src/generate-pdf.ts`: Playwright PDF generator
  - `src/types.ts`: document types
- `examples/`
  - Example resumes and CSS themes (`simple`, `software`, `ux-ui`)
- `docs/`
  - Markdown/YAML format and behavior documentation
- `out/`
  - Generated artifacts (ignored by git)

## Development

```bash
pnpm test          # run all package tests (vitest)
pnpm test:types    # type-check all packages (tsc)
```

## Notes

- If local images are used in markdown/CSS, keep asset paths valid from the source markdown location.

## License

All Rights Reserved — for portfolio/interview review only.
