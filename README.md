# Cursor for Word

Monorepo for the document editor frontend, the supporting backend API, and agent-related packages.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Repo Navigation

```text
nico-app/
├── apps/
│   ├── backend/    Express + TypeScript API for document conversion and provider proxies
│   └── web/        React application with the editor UI
├── packages/
│   └── agents/     Agent and workflow-related package code
├── turbo.json      Turbo task graph
└── pnpm-workspace.yaml
```

Open these first:

- `apps/backend/README.md` for backend architecture, route ownership, env vars, and operational details
- `apps/web/package.json` for frontend scripts
- `packages/agents/README.md` for agent package details

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create the backend env file:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

3. Create the frontend env file:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

4. Point the frontend to the backend by setting `VITE_API_URL` in `apps/web/.env` if the apps run on different origins.

## Common Commands

```bash
pnpm dev
pnpm build
pnpm lint
```

To run apps separately:

```bash
pnpm --filter backend dev
pnpm --filter web dev
```

Default local ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## What Lives Where

- `apps/web` contains the user-facing editor, hooks, React state, and UI components.
- `apps/backend` contains the HTTP API, validation, middleware, controller/service/client layers, and backend tests.
- `packages/agents` contains agent-specific logic and related package tooling.

## Backend Notes

The backend intentionally keeps third-party credentials server-side and exposes a stable API to the frontend:

- `/health`
- `/api/documents/*`
- `/api/serp/search.json`
- `/api/groq/openai/v1/chat/completions`

For route behavior, security defaults, and every backend env var, use the backend guide in `apps/backend/README.md`.
