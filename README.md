# Cursor for Word

AI-powered document editing platform with CKEditor 5. Frontend (web) and backend (API) run on **separate hosts**.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (optional, required for high-fidelity DOCX mode)
- Python 3 + `pipx` (recommended) or `pip` for `unoconvert` client binary

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. **Backend** — create `apps/backend/.env`:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

   Set `SERP_API_KEY` and `GROQ_API_KEY` in `.env`.

3. **Frontend** — create `apps/web/.env`:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   Set `VITE_API_URL` to your backend origin (e.g. `http://localhost:4000`).

4. Start app services (default mode, no Unoserver):

   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3000  
   - Backend: http://localhost:4000  

   Or run separately: `pnpm --filter backend dev` and `pnpm --filter web dev`.

## High-Fidelity DOCX Mode (Unoserver + LibreOffice)

Use this mode when you want better style preservation for DOCX import/export.

1. Start Docker Desktop and verify daemon is running:

   ```bash
   docker info
   ```

2. Build and run Unoserver container:

   ```bash
   docker compose -f infra/docker-compose.yml --profile docx up -d --build
   ```

3. Install local `unoconvert` client binary (used by backend to call Unoserver):

   ```bash
   pipx install unoserver
   ```

   If `pipx` is unavailable, use:

   ```bash
   python3 -m pip install --user unoserver
   ```

4. In `apps/backend/.env`, set these values:

   ```env
   DOCX_CONVERSION_MODE=hybrid
   UNOSERVER_URL=http://127.0.0.1:2003
   UNOCONVERT_BIN=unoconvert
   ```

5. Start app:

   ```bash
   pnpm dev
   ```

6. Verify conversion health:

   ```bash
   curl http://localhost:4000/api/documents/health
   ```

7. Stop Unoserver when done:

   ```bash
   docker compose -f infra/docker-compose.yml --profile docx down
   ```

## Features

- **Document editor** – CKEditor 5 with Word-like styling. Import .docx, download as .docx.
- **AI-generated content** – Content from "Cursor for Word" is embedded into the editor.
- **Backend API** – Documents (markdown↔html, html→docx), SerpAPI proxy, Groq proxy; keys live on the backend.

## Project Structure

```
nico-app/
├── apps/
│   ├── backend/   Express + TypeScript API (port 4000)
│   └── web/       React SPA with CKEditor 5 (port 3000)
├── turbo.json
└── pnpm-workspace.yaml
```
