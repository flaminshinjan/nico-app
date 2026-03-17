import { Router, type Router as ExpressRouter } from "express";
import type { AppConfig } from "../config/env.js";
import { SerpController } from "../controllers/serp.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { validate } from "../middleware/validate.js";
import { SerpService } from "../services/serp.service.js";
import { SerpClient } from "../utils/serp.js";
import { serpSearchQuerySchema } from "../validators/serp.schemas.js";

export function createSerpRouter(config: AppConfig): ExpressRouter {
  const router: ExpressRouter = Router();
  const controller = new SerpController(new SerpService(new SerpClient(config)));

  router.get(
    "/search.json",
    validate({ query: serpSearchQuerySchema }),
    asyncHandler(controller.search)
  );

  return router;
}
