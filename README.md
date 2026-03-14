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

## Custom Toolbar (Developer Edition)

The custom formatting toolbar (bold, italic, underline, alignment, lists, etc.) uses the ONLYOFFICE Automation API (`createConnector`). This requires **ONLYOFFICE Docs Developer** edition with the connector feature enabled. In Community Edition, the toolbar buttons will be disabled; use ONLYOFFICE's built-in toolbar by setting `toolbar: true` in the DocumentEditor config.

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
