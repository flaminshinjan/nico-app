import type { IRouter } from "express";
import { Router } from "express";

const SERP_API_BASE = "https://serpapi.com";

export const serpRouter: IRouter = Router();

function getSerpKey(): string | null {
  const v = process.env.SERP_API_KEY ?? process.env.VITE_SERP_API_KEY;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed.includes("your_")) return null;
  return trimmed;
}

serpRouter.get("/search.json", async (req, res) => {
  const apiKey = getSerpKey();
  if (!apiKey) {
    console.error("[serp] SERP_API_KEY is missing. Add it to apps/backend/.env");
    res.status(500).json({
      error: "SERP_API_KEY is not configured",
      hint: "Add SERP_API_KEY to apps/backend/.env (get one at serpapi.com) and restart",
    });
    return;
  }

  const query = req.query.q as string | undefined;
  const num = (req.query.num as string) || "4";
  const params = new URLSearchParams({
    q: query ?? "",
    num,
    api_key: apiKey,
  });

  try {
    const response = await fetch(`${SERP_API_BASE}/search.json?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json(data);
      return;
    }
    res.json(data);
  } catch (err) {
    console.error("[serp]", err);
    res.status(502).json({ error: "SERP request failed" });
  }
});
