import type { IRouter } from "express";
import { Router } from "express";

const GROQ_API_BASE = "https://api.groq.com";

export const groqRouter: IRouter = Router();

function getGroqKey(): string | null {
  const v = process.env.GROQ_API_KEY ?? process.env.VITE_GROQ_API_KEY;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed.includes("your_")) return null;
  return trimmed;
}

groqRouter.all("/*", async (req, res) => {
  const apiKey = getGroqKey();
  if (!apiKey) {
    console.error("[groq] GROQ_API_KEY is not set. Add it to apps/backend/.env");
    res.status(500).json({
      error: "GROQ_API_KEY is not configured",
      hint: "Add GROQ_API_KEY to apps/backend/.env and restart the backend",
    });
    return;
  }

  const subPath = req.path || "/";
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url = `${GROQ_API_BASE}${subPath}${query}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined || key.toLowerCase() === "authorization") continue;
      const str = Array.isArray(value) ? value.join(", ") : String(value);
      if (key.toLowerCase() === "host" || key.toLowerCase() === "origin" || key.toLowerCase() === "referer") continue;
      headers[key] = str;
    }
    headers.Authorization = `Bearer ${apiKey}`;

    const init: RequestInit = {
      method: req.method,
      headers,
    };
    if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
      init.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, init);
    const contentType = response.headers.get("Content-Type") ?? "application/json";
    res.setHeader("Content-Type", contentType);
    res.status(response.status);

    if (contentType.includes("text/event-stream") && response.body) {
      const reader = (response.body as ReadableStream<Uint8Array>).getReader();
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(Buffer.from(value));
        await pump();
      };
      await pump();
      return;
    }

    const text = await response.text();
    try {
      res.send(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (err) {
    console.error("[groq]", err);
    res.status(502).json({ error: "Groq request failed" });
  }
});
