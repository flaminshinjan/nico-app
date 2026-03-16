import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new AppError(404, "Resource not found", "not_found", { path: req.originalUrl }));
};
