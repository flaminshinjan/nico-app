import { z } from "zod";

export const groqChatCompletionsSchema = z
  .object({
    model: z.string().trim().min(1),
    messages: z.array(z.unknown()).min(1),
    stream: z.boolean().optional(),
  })
  .passthrough();

export type GroqChatCompletionsInput = z.infer<typeof groqChatCompletionsSchema>;
