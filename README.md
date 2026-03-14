# Cursor for Word

AI-powered document editing platform with ONLYOFFICE Document Editor.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for ONLYOFFICE Document Server)

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start ONLYOFFICE Document Server (required for the editor):

   ```bash
   cd infra && docker-compose up -d
   ```

3. Create `apps/web/.env` from the example:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   Set `VITE_ONLYOFFICE_SERVER_URL` if Document Server runs on a different host/port.

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open http://localhost:3000

## Project Structure

```
nico-app/
├── apps/
│   └── web/                 React SPA with document editor
├── infra/
│   └── docker-compose.yml   ONLYOFFICE Document Server
├── turbo.json
└── pnpm-workspace.yaml
```
