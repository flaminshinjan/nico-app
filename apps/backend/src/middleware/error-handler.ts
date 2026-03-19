import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(
      400,
      "Request validation failed",
      "validation_error",
      error.flatten()
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    return new AppError(413, "Request body is too large", "payload_too_large");
  }

  return new AppError(500, "Internal server error", "internal_server_error");
}

export const errorHandlerMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const appError = toAppError(error);
  req.log?.error(
    {
      err: error,
      requestId: req.id,
      code: appError.code,
    },
    appError.message
  );

  res.status(appError.statusCode).json({
    error: appError.message,
    ...(appError.code ? { code: appError.code } : {}),
    ...(appError.details !== undefined ? { details: appError.details } : {}),
    requestId: req.id,
  });
};
