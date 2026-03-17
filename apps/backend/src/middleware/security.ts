import cors from "cors";
import helmet from "helmet";
import type { RequestHandler } from "express";
import type { AppConfig } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export function createCorsMiddleware(config: AppConfig): RequestHandler {
  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (config.corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, "CORS origin is not allowed", "cors_origin_denied"));
    },
  });
}

export const securityHeadersMiddleware = helmet();
