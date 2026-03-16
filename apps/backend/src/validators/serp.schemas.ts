import { z } from "zod";

export const serpSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  num: z.coerce.number().int().min(1).max(10).default(4),
});

export type SerpSearchQuery = z.infer<typeof serpSearchQuerySchema>;
