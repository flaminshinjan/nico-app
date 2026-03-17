import { z } from "zod";

export const markdownToHtmlSchema = z.object({
  markdown: z.string().max(200_000),
});

export const htmlToDocxSchema = z.object({
  html: z.string().max(500_000),
});

export type MarkdownToHtmlInput = z.infer<typeof markdownToHtmlSchema>;
export type HtmlToDocxInput = z.infer<typeof htmlToDocxSchema>;
