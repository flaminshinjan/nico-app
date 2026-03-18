# Backend

Node.js + Express + TypeScript API for the nico-app. Run separately from the frontend (e.g. backend on port 4000, frontend on 3000).

## Setup

1. Install dependencies from repo root: `pnpm install`
2. Copy env: `cp .env.example .env`
3. Set `SERP_API_KEY`, `GROQ_API_KEY` in `.env`
4. Optional high-fidelity DOCX mode setup:
	- Verify Docker is running:

	  ```bash
	  docker info
	  ```

	 - Start Unoserver container:

		 ```bash
		 docker compose -f infra/docker-compose.yml --profile docx up -d --build
		 ```

	 - Install local `unoconvert` client binary:

		 ```bash
		 pipx install unoserver
		 ```

	 - Set in `.env`:
		 - `UNOSERVER_URL=http://127.0.0.1:2003`
		 - `UNOCONVERT_BIN=unoconvert`
		 - `DOCX_CONVERSION_MODE=hybrid`

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
| POST | `/api/documents/html-to-docx-fidelity` | Body: `{ html, title?, fidelity }` where fidelity is `full`, `balanced`, or `compatible` |
| POST | `/api/documents/docx-to-html` | Multipart body with `file` (`.docx`) → `{ html, engine }` |
| GET | `/api/documents/health` | Document conversion subsystem health |
| GET | `/api/serp/search.json` | Query: `q`, `num` — proxies to SerpAPI (key from env) |
| ALL | `/api/groq/*` | Proxies to Groq API (key from env), e.g. `/api/groq/openai/v1/chat/completions` |

Frontend should set `VITE_API_URL=http://localhost:4000` (or your backend origin) when running on a different host.

To validate DOCX conversion wiring:

```bash
curl http://localhost:4000/api/documents/health
```

## DOCX conversion modes

- `DOCX_CONVERSION_MODE=hybrid`: prefer Unoserver, fallback to `html-to-docx`
- `DOCX_CONVERSION_MODE=uno-only`: fail if Unoserver is unavailable
- `DOCX_CONVERSION_MODE=legacy-only`: always use `html-to-docx`
