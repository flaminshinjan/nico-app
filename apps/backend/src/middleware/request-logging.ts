import pino from "pino";
import { pinoHttp } from "pino-http";
import type { IncomingMessage } from "node:http";
import type { RequestHandler } from "express";
import { LOG_REDACT_PATHS } from "../config/constants.js";
import type { AppConfig } from "../config/env.js";

export function createRequestLoggingMiddleware(config: AppConfig): RequestHandler {
  const logger = pino({
    enabled: config.logRequests,
    level: config.nodeEnv === "production" ? "info" : "debug",
    redact: {
      paths: [...LOG_REDACT_PATHS],
      censor: "[Redacted]",
    },
  });

  return pinoHttp({
    logger,
    autoLogging: false,
    genReqId: (req: IncomingMessage): string =>
      "id" in req && typeof req.id === "string" ? req.id : "unknown",
    customSuccessMessage: () => "request completed",
    customErrorMessage: () => "request failed",
  });
}
