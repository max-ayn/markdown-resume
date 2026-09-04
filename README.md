# *.md Resume

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-339933)](package.json)

**\*.md Resume** turns a semantic Markdown file into a styled HTML resume — and a PDF, if you want one. Write your content once, style it with plain CSS, and keep the whole thing in git like any other text file.

> [!TIP]
> The marker syntax and frontmatter format are stable, but also an idea in progress. Nothing's set in stone — help shape where it goes by opening an issue or a PR against the [markdown](docs/reference/markdown) / [frontmatter](docs/reference/frontmatter-config.md) reference.

## Table of Contents

- [Why](#why)
- [Install](#install)
- [Quick Start](#quick-start)
- [CLI](#cli)
- [Development](#development)
- [Documentation](#documentation)
- [License](#license)

## Why

Resume builders usually mean a fixed template, a locked-down editor, or both. This is the opposite:

- 🎨 **No theme lock-in** — styling is plain CSS. Change a class, change the look.
- 🔀 **Versionable** — a resume is Markdown + YAML frontmatter, so `git diff` and `git blame` work on it like any other document.
- 🤖 **AI/ATS-friendly** — semantic markers (`@date`, `@icon`, `@image`, ...) render structured HTML (`data-region`, `data-section`, semantic classes) instead of generic `<div>` soup, so parsers and models can actually read the structure.

This markdown:

```md
@title Senior Engineer
@date 2021-01
```

renders to HTML that keeps the meaning attached to the markup:

```html
<span class="resume-field resume-field--title">Senior Engineer</span>
<span class="date">Jan 2021</span>
```

so any tool reading the output — not just a human eyeballing the page — can tell a job title from a date without inferring it from position on the page.

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
  auto-discovery rule as `-md`, but for `.css`. Optional — a `<style>` tag
  embedded directly in the markdown is rendered as-is even with no `.css`
  file at all.
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

## Development

```bash
pnpm test          # run all package tests (vitest)
pnpm lint          # check formatting/lint rules (biome)
pnpm lint:fix      # same, applying safe fixes
```

### Git hooks

`pnpm install` runs `prepare`, which points git at the versioned hooks in
`.githooks/` (`git config core.hooksPath .githooks`):

- `pre-commit` runs `pnpm lint` and blocks the commit if it fails.
- `pre-push` runs `pnpm docs:build` and blocks the push if the docs site
  fails to build.

Both hooks just shell out to the scripts above, so you can run either one
manually at any time.

## Documentation

- [Getting Started](docs/guide/getting-started.md)
- [Markdown Format Reference](docs/reference/markdown)
- [YAML Frontmatter Reference](docs/reference/frontmatter-config.md)

Run `pnpm docs:dev` to browse the docs site locally.

## Notes

- If local images are used in markdown/CSS, keep asset paths valid from the source markdown location.

## License

[GPL-3.0](./LICENSE) © Max Ayn
