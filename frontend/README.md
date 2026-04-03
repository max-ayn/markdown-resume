# Frontend App

Fresh app for:
- Markdown/CSS resume editor
- Live preview
- PDF download
- AI generation with diff-first apply flow

## Setup

1. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

2. Set `OPENAI_API_KEY` in `.env`.

3. Install deps:

```bash
deno install
deno run -A npm:playwright install chromium
```

4. Run dev server:

```bash
deno task dev
```

## API routes

- `POST /api/preview`
- `POST /api/pdf`
- `POST /api/chat/generate`
