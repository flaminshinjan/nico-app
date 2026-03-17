# Backend

TypeScript + Express API for the monorepo. The backend owns document conversion, the Serp proxy, and the Groq proxy. It is designed to keep external API keys on the server and expose a small stable API to `apps/web`.

## Quick Start

1. Install workspace dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. Create the backend env file:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

3. Start the backend:

   ```bash
   pnpm --filter backend dev
   ```

4. Verify the package:

   ```bash
   pnpm --filter backend build
   pnpm --filter backend lint
   pnpm --filter backend test
   ```

Default backend origin: `http://localhost:4000`

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm --filter backend dev` | Start the API in watch mode with `tsx` |
| `pnpm --filter backend build` | Compile `src` into `dist` with TypeScript |
| `pnpm --filter backend start` | Run the compiled backend from `dist/index.js` |
| `pnpm --filter backend lint` | Run package-local ESLint checks |
| `pnpm --filter backend test` | Run Vitest + Supertest coverage |

## Public API

These routes are consumed by `apps/web` and should remain stable unless the frontend is updated in the same change.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness check plus env availability flags |
| `POST` | `/api/documents/markdown-to-html` | Body: `{ markdown }` → `{ html }` |
| `POST` | `/api/documents/html-to-docx` | Body: `{ html }` → `.docx` attachment |
| `GET` | `/api/serp/search.json` | Query: `q`, optional `num` |
| `POST` | `/api/groq/openai/v1/chat/completions` | Groq chat completions proxy, including SSE |

## Request Flow

Incoming requests move through the backend in this order:

1. `src/app.ts` creates the Express app and registers global middleware.
2. `src/middleware/*` adds request IDs, structured logs, security headers, CORS handling, validation, rate limits, and centralized errors.
3. `src/routes/*.routes.ts` maps URL paths to controller methods.
4. `src/controllers/*` translates Express request/response objects into service calls.
5. `src/services/*` owns application logic such as conversion flows and proxy orchestration.
6. `src/utils/*` contains the Groq and Serp HTTP helpers plus small shared backend utilities.

## Folder Guide

```text
apps/backend/
├── src/
│   ├── app.ts                  # Express app factory
│   ├── index.ts                # Process bootstrap and server startup
│   ├── config/                 # Typed env parsing and shared constants
│   ├── controllers/            # Thin HTTP handlers
│   ├── errors/                 # Shared error types
│   ├── lib/                    # Small reusable helpers
│   ├── middleware/             # Cross-cutting Express middleware
│   ├── routes/                 # Route registration only
│   ├── services/               # Business logic and orchestration
│   ├── test/                   # Vitest + Supertest coverage
│   ├── types/                  # Shared API and Express type augmentation
│   ├── utils/                  # Groq/Serp HTTP helpers and shared support code
│   └── validators/             # Zod request schemas
├── .env.example                # Backend env template
├── eslint.config.js            # Package-local lint config
├── package.json
└── tsconfig.json
```

## Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | HTTP port used by `src/index.ts` |
| `NODE_ENV` | No | `development` | Controls logging defaults and production-only behavior |
| `SERP_API_KEY` | Yes for Serp routes | none | Server-side API key for `GET /api/serp/search.json` |
| `GROQ_API_KEY` | Yes for Groq routes | none | Server-side API key for `POST /api/groq/openai/v1/chat/completions` |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000,http://localhost:5173` outside production | Comma-separated frontend origins allowed to call the API |
| `SERP_TIMEOUT_MS` | No | `8000` | Upstream timeout for Serp requests |
| `GROQ_TIMEOUT_MS` | No | `30000` | Upstream timeout for Groq requests and streaming completions |

### Deprecated Env Aliases

The backend still accepts `VITE_SERP_API_KEY` and `VITE_GROQ_API_KEY` as fallback aliases so existing local setups do not break immediately. Treat them as migration-only and move any real values to `SERP_API_KEY` and `GROQ_API_KEY`.

## Security Defaults

- API keys are never logged in startup output.
- `helmet` sets baseline HTTP security headers.
- CORS is allowlist-based, not reflective.
- Request bodies are validated with `zod`.
- Document HTML is sanitized before editor return or DOCX generation.
- Rate limits are applied per route group.
- Groq header forwarding is allowlist-based and strips sensitive inbound headers.
- Errors are normalized and include a request ID for debugging.

## Troubleshooting

### `missing_serp_api_key` or `missing_groq_api_key`

Set the corresponding key in `apps/backend/.env`, then restart the backend process.

### CORS requests fail from the frontend

Add the frontend origin to `CORS_ALLOWED_ORIGINS`. Multiple origins must be comma-separated.

### `payload_too_large`

The request body exceeded the configured JSON limit. Large document payloads should use the document endpoints, which allow a larger body size than the rest of the API.

### SSE responses stop early

Check whether the client disconnected or the upstream request hit `GROQ_TIMEOUT_MS`.
