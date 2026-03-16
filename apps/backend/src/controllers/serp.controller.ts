import type { RequestHandler } from "express";
import type { SerpService } from "../services/serp.service.js";
import type { SerpSearchQuery } from "../validators/serp.schemas.js";

export class SerpController {
  constructor(private readonly serpService: SerpService) {}

  search: RequestHandler = async (req, res) => {
    const { q, num } = req.validated?.query as SerpSearchQuery;
    const payload = await this.serpService.search(q, num);
    res.json(payload);
  };
}
