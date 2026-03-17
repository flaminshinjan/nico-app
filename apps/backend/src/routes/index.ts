import express, { type Express } from "express";
import type { AppConfig } from "../config/env.js";
import {
  DEFAULT_JSON_LIMIT,
  DOCUMENTS_JSON_LIMIT,
} from "../config/constants.js";
import { createRouteRateLimit } from "../middleware/rate-limit.js";
import { createDocumentsRouter } from "./documents.routes.js";
import { createGroqRouter } from "./groq.routes.js";
import { createHealthRouter } from "./health.routes.js";
import { createSerpRouter } from "./serp.routes.js";

export function registerRoutes(app: Express, config: AppConfig): void {
  app.use(createHealthRouter(config));
  app.use(
    "/api/documents",
    createRouteRateLimit(config.rateLimits.documents),
    express.json({ limit: DOCUMENTS_JSON_LIMIT }),
    createDocumentsRouter()
  );
  app.use(express.json({ limit: DEFAULT_JSON_LIMIT }));
  app.use("/api/serp", createRouteRateLimit(config.rateLimits.serp), createSerpRouter(config));
  app.use("/api/groq", createRouteRateLimit(config.rateLimits.groq), createGroqRouter(config));
}
