import { z } from "zod";

export const documentResultSchema = z.object({
  title: z.string(),
  markdown: z.string(),
});

export type DocumentResult = z.infer<typeof documentResultSchema>;
