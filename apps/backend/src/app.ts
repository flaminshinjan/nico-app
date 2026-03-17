import express, { type Express } from "express";
import type { AppConfig } from "./config/env.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.js";
import { notFoundMiddleware } from "./middleware/not-found.js";
import { createRequestLoggingMiddleware } from "./middleware/request-logging.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { createCorsMiddleware, securityHeadersMiddleware } from "./middleware/security.js";
import { registerRoutes } from "./routes/index.js";

export function createApp(config: AppConfig): Express {
  const app: Express = express();
  app.disable("x-powered-by");

  app.use(requestIdMiddleware);
  app.use(createRequestLoggingMiddleware(config));
  app.use(securityHeadersMiddleware);
  app.use(createCorsMiddleware(config));

  registerRoutes(app, config);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
