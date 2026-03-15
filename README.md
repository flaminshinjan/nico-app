# Cursor for Word

AI-powered document editing platform with CKEditor 5.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `apps/web/.env` from the example:

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

   Set `VITE_SERP_API_KEY` and `VITE_GROQ_API_KEY` (see `.env.example`).

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open http://localhost:3000

## Features

- **Document editor** – CKEditor 5 with Word-like styling (headings, lists, bold, italic, etc.). No Docker or external document server.
- **Import .docx** – Upload a Word document; styling is preserved via mammoth.js.
- **Download as .docx** – Export the editor content to a .docx file.
- **AI-generated content** – Content from "Cursor for Word" is embedded into the editor and is editable in place.

## Project Structure

```
nico-app/
├── apps/
│   └── web/                 React SPA with CKEditor 5
├── infra/
├── turbo.json
└── pnpm-workspace.yaml
```
