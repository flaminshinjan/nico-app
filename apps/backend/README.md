# Backend

Node.js + Express + TypeScript API for the nico-app. Run separately from the frontend (e.g. backend on port 4000, frontend on 3000).

## Setup

1. Install dependencies from repo root: `pnpm install`
2. Copy env: `cp .env.example .env`
3. Set `SERP_API_KEY`, `GROQ_API_KEY` in `.env`

## Run

- **Dev:** `pnpm dev` (from repo root or `apps/backend`) — uses `tsx watch`
- **Prod:** `pnpm build && pnpm start` — compiles to `dist/`, runs with Node

Default port: **4000** (override with `PORT`).

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/documents/markdown-to-html` | Body: `{ markdown }` → `{ html }` |
| POST | `/api/documents/html-to-docx` | Body: `{ html }` → docx file |
| GET | `/api/serp/search.json` | Query: `q`, `num` — proxies to SerpAPI (key from env) |
| ALL | `/api/groq/*` | Proxies to Groq API (key from env), e.g. `/api/groq/openai/v1/chat/completions` |

Frontend should set `VITE_API_URL=http://localhost:4000` (or your backend origin) when running on a different host.
