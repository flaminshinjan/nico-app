import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendDir, ".env") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

/* DEBUG HERE */
console.log("ENV DEBUG:");
console.log("cwd:", process.cwd());
console.log("backendDir:", backendDir);
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY);
console.log("SERP_API_KEY:", process.env.SERP_API_KEY);
console.log("--------------------------------");


function envSet(name: string, altName?: string): boolean {
  const v = process.env[name] ?? (altName ? process.env[altName] : undefined);
  return typeof v === "string" && v.trim().length > 0 && !v.includes("your_");
}

import express from "express";
import cors from "cors";
import { documentsRouter } from "./routes/documents.js";
import { serpRouter } from "./routes/serp.js";
import { groqRouter } from "./routes/groq.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/documents", documentsRouter);
app.use("/api/serp", serpRouter);
app.use("/api/groq", groqRouter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    env: {
      GROQ_API_KEY: envSet("GROQ_API_KEY", "VITE_GROQ_API_KEY") ? "set" : "missing",
      SERP_API_KEY: envSet("SERP_API_KEY", "VITE_SERP_API_KEY") ? "set" : "missing",
    },
  });
});

app.listen(port, () => {
  const groq = envSet("GROQ_API_KEY", "VITE_GROQ_API_KEY");
  const serp = envSet("SERP_API_KEY", "VITE_SERP_API_KEY");
  console.log(`Backend listening on http://localhost:${port}`);
  if (!groq) console.warn("  [warn] GROQ_API_KEY is missing or placeholder – Groq requests will return 500");
  if (!serp) console.warn("  [warn] SERP_API_KEY is missing or placeholder – Serp requests will return 500");
});
