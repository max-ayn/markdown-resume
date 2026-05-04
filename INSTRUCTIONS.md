# Project Instructions and TODO Timeline

## Goal
Build a complete resume toolchain: markdown content, polished one-page design, live visualization, downloadable generation endpoint, and AI assistance for CV improvement.

## Current Status
- [x] Create markdown resume
- [x] Write resume style (one-page oriented)
- [ ] Create a generation endpoint to download files
- [ ] Create a visualization/editor tool
- [ ] Add an AI chat to improve the curriculum

## Timeline

### Stabilize Core Resume Generation
- [x] Finalize `resume.md` content structure
- [x] Finalize `styles.css` for one-page A4 output
- [x] Ensure `src/main.ts` generates HTML and optional PDF
- [x] Add/update core tests (`generate_html`, `generate_pdf`)

Deliverable:
- Reliable local generation: `deno task build` and `deno task build:pdf`

### Visualization Tool (Editor + Preview)
- [ ] Create local UI with:
  - Markdown editor pane
  - Live HTML preview pane
  - One-click export buttons (HTML/PDF)
- [ ] Add file loading/saving for `resume.md`
- [ ] Keep preview style parity with production CSS

Deliverable:
- Browser-based authoring workflow for fast resume editing

### Generation API Endpoint
- [ ] Implement HTTP endpoint(s):
  - `POST /generate/html`
  - `POST /generate/pdf`
- [ ] Accept markdown + optional style input
- [ ] Return downloadable output with proper headers
- [ ] Add validation and error handling (empty body, invalid payload, generation errors)

Deliverable:
- API-ready generation service for integration with UI or external clients

### AI CV Assistant
- [ ] Add chat interface for CV improvement suggestions
- [ ] Add prompt templates for:
  - Professional summary rewrite
  - Bullet impact improvement
  - ATS keyword enrichment
  - One-page compression suggestions
- [ ] Add "apply suggestion" action back into editor content

Deliverable:
- AI-assisted resume editing flow integrated with the visualization tool

## Quality Checklist (Definition of Done)
- [ ] One-page PDF fit validated on A4
- [ ] HTML and PDF generation both pass on clean checkout
- [ ] Tests pass in CI/local
- [ ] README usage stays up to date
- [ ] No manual post-edit needed after generation
