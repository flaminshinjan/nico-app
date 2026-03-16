import { z } from "zod";

export const serpResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  favicon: z.string().optional(),
  displayed_link: z.string().optional(),
});

export type SerpResult = z.infer<typeof serpResultSchema>;
