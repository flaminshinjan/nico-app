# Cursor for Word

AI-powered document editing platform with CKEditor 5. Frontend (web) and backend (API) run on **separate hosts**.

## Prerequisites

- Node.js 20+
- pnpm 9+

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

4. Start both (from repo root):

   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3000  
   - Backend: http://localhost:4000  

   Or run separately: `pnpm --filter backend dev` and `pnpm --filter web dev`.

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
