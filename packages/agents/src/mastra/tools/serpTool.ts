import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { fetchSerpResults, serpResultSchema } from "../utils/serp";

export const serpTool = createTool({
  id: "serp-search",
  description: "Search the web and return the top 4 organic results for a query",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  outputSchema: z.object({
    results: z.array(serpResultSchema),
  }),
  execute: async ({ query }) => {
    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
      throw new Error("SERP_API_KEY is not configured.");
    }
    return { results: await fetchSerpResults(query, apiKey) };
  },
});
