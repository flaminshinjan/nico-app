import { Router, type Router as ExpressRouter } from "express";
import type { AppConfig } from "../config/env.js";
import { createHealthController } from "../controllers/health.controller.js";

export function createHealthRouter(config: AppConfig): ExpressRouter {
  const router: ExpressRouter = Router();
  const healthController = createHealthController(config);

  router.get("/health", healthController);
  return router;
}
