import type { RequestHandler } from "express";
import type { AppConfig } from "../config/env.js";

export function createHealthController(config: AppConfig): RequestHandler {
  return (_req, res) => {
    res.json({
      status: "ok",
      env: {
        GROQ_API_KEY: config.groqApiKey ? "set" : "missing",
        SERP_API_KEY: config.serpApiKey ? "set" : "missing",
      },
    });
  };
}
