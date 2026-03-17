import rateLimit from "express-rate-limit";

export function createRouteRateLimit(max: number) {
  return rateLimit({
    windowMs: 60_000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        error: "Too many requests",
        code: "rate_limit_exceeded",
        requestId: req.id,
      });
    },
  });
}
