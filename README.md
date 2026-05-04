# Markdown Resume Builder

Generate resumes from semantic Markdown + CSS into HTML and PDF.

## Install

### Prerequisites

- Deno 2+
- Playwright Chromium (for PDF export)

Install Chromium once:

```bash
deno run -A npm:playwright install chromium
```

## Quick Start

From repository root:

```bash
cd cli
deno run --allow-env --allow-sys --allow-read --allow-write --allow-run cli.ts \
  --md ../examples/software/resume.md \
  --css ../examples/software/styles.css \
  --html-out ../out/resume.html
```

This generates `out/resume.html`.

## HTML/PDF Generation Commands

### HTML only

```bash
cd cli
deno run --allow-env --allow-sys --allow-read --allow-write --allow-run cli.ts \
  --md ../examples/software/resume.md \
  --css ../examples/software/styles.css \
  --html-out ../out/resume.html
```

### HTML + PDF

```bash
cd cli
deno run --allow-env --allow-sys --allow-read --allow-write --allow-run cli.ts \
  --md ../examples/software/resume.md \
  --css ../examples/software/styles.css \
  --html-out ../out/resume.html \
  --pdf-out ../out/resume.pdf \
  --pdf
```

### Optional output

- Raw markdown re-serialization:

```bash
--raw-md-out ../out/resume_raw.md
```

## Project Structure

- `cli/`
  - `cli.ts`: command entrypoint (parse -> render -> optional pdf)
  - `deno.json`: CLI runtime config/imports
- `core/src/`
  - `parser.ts`: semantic Markdown parser
  - `html-renderer.ts`: semantic HTML renderer
  - `generate-pdf.ts`: Playwright PDF generator
  - `raw-markdown.ts`: markdown serializer
  - `types.ts`: document types
- `examples/`
  - Example resumes and CSS themes (`simple`, `software`, `ux-ui`)
- `docs/`
  - Markdown/YAML format and behavior documentation
- `out/`
  - Generated artifacts (ignored by git)

## Notes

- PDF export needs Playwright permissions (`--allow-env --allow-sys --allow-run`).
- If local images are used in markdown/CSS, keep asset paths valid from the source markdown location.

## License

All Rights Reserved — for portfolio/interview review only.
