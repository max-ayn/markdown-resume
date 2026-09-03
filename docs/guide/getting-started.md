# Getting Started

## What is Markdown Resume

Markdown Resume is a small toolchain that turns a semantic Markdown document
(plus a YAML frontmatter block and a CSS theme) into HTML and PDF resumes.
"Semantic" means the Markdown isn't just prose — it uses a small marker
syntax (`:::block{...}`, `@date`, `@icon`, `@image`, ...) so that a resume's
structure (sections, entries, contact items, skills) survives as real,
styleable HTML rather than a flat wall of paragraphs.

The pipeline is:

```
resume.md + styles.css  →  parse + validate  →  HTML  →  (optional) PDF
```

Resume content and resume layout are usually welded together — you either
hand-edit a Word/Google Docs template, or hand-write HTML/CSS from scratch
every time. Markdown Resume keeps the two separate:

- **Content** lives in plain Markdown, versionable in git, diffable in PRs.
- **Layout/styling** lives entirely in CSS — the parser never invents visual
  rules, it only emits classed, structured HTML.
- **Regions** (`header`/`main`/`sidebar`/`footer`) let one document render
  into different physical layouts just by changing frontmatter, not content.

## Installation

Prerequisites:

- Node 20+
- pnpm 9+
- Playwright Chromium (for PDF export)

```bash
pnpm install
pnpm exec playwright install chromium
```

## Your First Example

From the repository root, render one of the bundled examples:

```bash
pnpm run cli -- -i examples/software -o out
```

This auto-discovers the single `.md` and `.css` file inside
`examples/software/` and writes `out/resume.html`. Add `-pdf` to also
generate `out/resume.pdf`:

```bash
pnpm run cli -- -i examples/software -o out -pdf
```

Open `out/resume.html` in a browser to see the result. Try the other bundled
themes too: `examples/simple/` and `examples/ux-ui/`.

## CLI Reference

The `@markdown-resume/cli` package exposes methods to build or debug your documents. Use it to convert files into PDF or HTML, create boilerplates or syntaxe check your documents.

The CLI is built on the `@markdown-resume/core` TypeScript implementation and follows the [latest specification](/reference/markdown/).

### Basic usage

Three subcommands: render (see [Your first example](#your-first-example)
above), `generate-style`, and `check`.

#### Render

When `-md` (or `-style`) is omitted, the CLI looks for a single `.md` (or
`.css`) file directly inside `-i`:

- exactly one match → used automatically
- zero matches → error (`No markdown file found in <folder>.`)
- more than one match → error, listing the candidates, asking you to pass
  `-md`/`-style` explicitly

A `.css` file is optional — a `<style>` tag [embedded directly in the
markdown](/reference/markdown/#embedded-styles) is rendered as-is even with
no stylesheet found in `-i` at all. If both exist, the external stylesheet
and the embedded `<style>` both apply.

::: code-group

```bash [Explicit files]
pnpm run cli -- -i examples/simple -o out -md resume.md -style styles.css
```

```bash [Watch]
pnpm run cli -- -i examples/simple -o out -w
```
:::

**Output filenames** are derived from the markdown file's basename:
`<output_path>/<name>.html` and, with `-pdf`, `<output_path>/<name>.pdf`.
Local image assets referenced from the markdown/CSS are copied into
`<output_path>/assets/`.

#### Basic CSS File Generation

Scaffolds a starter stylesheet: a small CSS-variable/base boilerplate, plus one empty rule block for every CSS class found in the rendered markdown (nothing to fill in — just the selectors). If no markdown is found in `-i`, it falls back to writing the boilerplate alone rather than failing.

```bash
pnpm run cli -- generate-style -i examples/software -o out
```

- Output path is `<output_path>/<-style name, default "styles.css">` — unlike
  the render command, `-style` here names what gets *written*, not an
  existing file to auto-discover.
- Refuses to overwrite an existing file unless `-f`/`--force` is passed.

#### Linter

Runs the same validation as a render (unknown markers, missing declared sections, unresolved image keys, ...) and prints the issues, but writes no HTML/PDF output. Exits with status `1` if any issues were found, so it's
usable as a CI gate.

```bash
pnpm run cli -- check -i examples/software
```

- Only `-i` and `-md` apply; `-o`, `-style`, `-pdf`, `-w`, `-f` are ignored.
- See the [Markdown](/reference/markdown/) and [YAML](/reference/frontmatter-config)
  references for what gets validated.

### Options

| Flag | Default | Meaning |
| --- | --- | --- |
| `-i <input_folder>` | `.` | Folder to read the markdown/stylesheet from. May also point directly at a markdown file, in which case its containing folder is used for style auto-discovery. |
| `-o <output_path>` | `.` | Folder to write HTML/PDF output to. |
| `-md <filename>` | *auto* | Markdown file, resolved relative to `-i`. |
| `-style <path>` | *auto* | Stylesheet, resolved relative to `-i`. For `generate-style`, this instead names the *output* file (see below). |
| `-pdf` / `--with-pdf` | off | Also generate a PDF next to the HTML output. |
| `-w` / `--watch` | off | After the initial render, watch the input folder recursively and re-render on change (debounced ~150ms). Runs until interrupted (Ctrl-C). Relies on Node's recursive `fs.watch`, which is only supported on macOS and Windows. |
| `-f` / `--force` | off | `generate-style` only: overwrite the output file if it already exists. |

### Notes

- `pnpm run cli -- <args>` — the `--` is required so pnpm forwards the
  arguments to the script instead of interpreting them itself.
- Any first argument other than `generate-style` or `check` is treated as a
  normal render (that word is ignored as an unrecognized positional
  argument).
- Validation issues are also printed to stdout during a normal render; they
  don't stop the render.

## Where to Go Next

- [Markdown reference](/reference/markdown/) — the marker syntax in full
- [YAML reference](/reference/frontmatter-config) — frontmatter keys (regions, custom
  fields, date formats, images, ...)
