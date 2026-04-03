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

### Week 1: Stabilize Core Resume Generation
- [x] Finalize `resume.md` content structure
- [x] Finalize `styles.css` for one-page A4 output
- [x] Ensure `src/main.ts` generates HTML and optional PDF
- [x] Add/update core tests (`generate_html`, `generate_pdf`)

Deliverable:
- Reliable local generation: `deno task build` and `deno task build:pdf`

### Week 2: Visualization Tool (Editor + Preview)
- [ ] Create local UI with:
  - Markdown editor pane
  - Live HTML preview pane
  - One-click export buttons (HTML/PDF)
- [ ] Add file loading/saving for `resume.md`
- [ ] Keep preview style parity with production CSS

Deliverable:
- Browser-based authoring workflow for fast resume editing

### Week 3: Generation API Endpoint
- [ ] Implement HTTP endpoint(s):
  - `POST /generate/html`
  - `POST /generate/pdf`
- [ ] Accept markdown + optional style input
- [ ] Return downloadable output with proper headers
- [ ] Add validation and error handling (empty body, invalid payload, generation errors)

Deliverable:
- API-ready generation service for integration with UI or external clients

### Week 4: AI CV Assistant
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

Plug docling so that i can convert a resume direclty



1. Which LLM provider/model should I wire first (OpenAI API, Anthropic, local, other)?
Give me an opinion about the best to use


2. Do you want me to implement this in frontend only for now, or split now into frontend + backend?
Tell me pros and cons of both methods

Where should secrets live (frontend/.env, root .env, other)?

3. Should chat support:
generate from scratch - yes
edit existing markdown/css - yes


Do you want strict output format as JSON:
{ markdown: string, css: string, notes?: string }?

Should the assistant be allowed to change both markdown and css by default - yes

What required resume sections must always exist (exact list/order)?
Should generated CSS be constrained to your semantic classes only (.resume-layout, .resume-main, .resume-sidebar, .resume-section--*)?


Do you want a style preset system (e.g. minimal, modern, executive)? -> Yes , modern one

Chat UX: sidebar panel, modal, or full-width section? -? 
I want an float chat that i can reduce an open using a button


Should “Apply” overwrite current editor content immediately, or show diff/preview before apply?
show the diff first


Should we persist chat history locally, server-side, or not at all? -> no need atm

Any guardrails you want (max prompt length, forbidden content, rate limit)? -> rate limit, max 10 atm

Do you want streaming responses in the UI now, or simple non-streaming first? start with non streaming

Should we log prompts/responses for debugging? yes

Is this single-user local tool, or multi-user/authenticated app? -> ATM single user

Should generated content stay English only or support multiple languages? -> Keep english ATM

Should I include tests now (API + parsing + UI flow), or ship MVP first then test pass? -> Ship fast

What is your preferred implementation priority:
fastest MVP


Can i apply a context to expect a certain result / use an agent ?


--- Lets see ---
Do you want revision history (undo/restore generated versions)?