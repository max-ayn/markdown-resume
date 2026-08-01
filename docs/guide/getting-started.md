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

## Why

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

## Where to Go Next

- [CLI reference](/guide/tooling/cli-reference) — every flag and subcommand
- [Markdown reference](/reference/markdown) — the marker syntax in full
- [YAML reference](/reference/yaml) — frontmatter keys (regions, custom
  fields, date formats, images, ...)
