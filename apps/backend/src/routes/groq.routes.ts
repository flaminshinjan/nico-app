import { Router, type Router as ExpressRouter } from "express";
import type { AppConfig } from "../config/env.js";
import { GroqController } from "../controllers/groq.controller.js";
import { AppError } from "../errors/app-error.js";
import { asyncHandler } from "../lib/async-handler.js";
import { validate } from "../middleware/validate.js";
import { GroqProxyService } from "../services/groq-proxy.service.js";
import { GroqClient } from "../utils/groq.js";
import { groqChatCompletionsSchema } from "../validators/groq.schemas.js";

export function createGroqRouter(config: AppConfig): ExpressRouter {
  const router: ExpressRouter = Router();
  const controller = new GroqController(new GroqProxyService(new GroqClient(config)));

  router.post("/*", validate({ body: groqChatCompletionsSchema }), asyncHandler(controller.proxyChatCompletions));
  router.all("/*", (_req, _res, next) => {
    next(new AppError(405, "Method not allowed", "method_not_allowed"));
  });

  return router;
}
