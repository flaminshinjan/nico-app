import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type ValidationSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    req.validated = {};

    if (schemas.body) {
      req.validated.body = schemas.body.parse(req.body);
    }

    if (schemas.query) {
      req.validated.query = schemas.query.parse(req.query);
    }

    if (schemas.params) {
      req.validated.params = schemas.params.parse(req.params);
    }

    next();
  };
}
