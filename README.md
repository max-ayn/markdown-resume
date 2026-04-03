# Markdown Resume Builder

Generate a resume from Markdown + CSS into:
- `out/resume.html`
- `out/resume.pdf` (optional)

Built with Deno and Playwright.

## Prerequisites

- Deno 2+
- For PDF export: Playwright Chromium

Install Chromium once:

```bash
deno run -A npm:playwright install chromium
```

## Quick Start

1. Prepare your resume source:

```bash
cp resume/resume.md ./resume.md
```

`src/main.ts` reads `./resume.md` and `./styles.css`.

2. Build HTML:

```bash
deno task build
```

3. Build HTML + PDF:

```bash
deno task build:pdf
```

## Available Tasks

- `deno task dev`  
  Watch mode for `src/main.ts`
- `deno task build`  
  Generate `out/resume.html`
- `deno task build:pdf`  
  Generate `out/resume.html` and `out/resume.pdf`

## Project Structure

- `src/main.ts`  
  Pipeline entrypoint
- `src/generate_html.ts`  
  Markdown-to-HTML renderer + HTML template
- `src/generate_pdf.ts`  
  HTML-to-PDF generator with Playwright
- `styles.css`  
  Resume visual style (print-first)
- `resume/resume.md`  
  Example resume content

## Markdown Support

The custom renderer supports a focused subset:
- Headings: `#`, `##`, `###`
- Paragraphs
- Bullets: `- item`
- Inline: `` `code` ``, `**bold**`, `*italic*`, links

If you need full Markdown compatibility, swap the parser for a dedicated Markdown library.

## Tests

Run core tests:

```bash
deno test --allow-read --allow-write src/generate_html_test.ts
deno test --allow-read --allow-write --allow-env --allow-sys src/generate_pdf_test.ts
```

## Notes

- PDF generation requires Playwright runtime permissions (`--allow-env --allow-sys --allow-run`).
- Output directories are created automatically.


## ideas 

- Use supabase for storage, as this is useful for storing image + databse + edge functions + cache: https://supabase.com/blog/fetching-and-caching-supabase-data-in-next-js-server-components
- Do a diff over last 
- Create MCP server for it to use with 

- Add a lot of templates
- Use toon for IA
- Add an option to download clean md

- Automatic translation