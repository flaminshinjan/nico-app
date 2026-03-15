import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const serpResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  favicon: z.string().optional(),
  displayed_link: z.string().optional(),
});

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

    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=4&api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`SERP API request failed with ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const organic = Array.isArray(data.organic_results) ? data.organic_results : [];

    const results = organic
      .map((result: unknown) => {
        if (typeof result !== "object" || result === null) {
          return null;
        }

        const raw = result as Record<string, unknown>;
        const url = typeof raw.link === "string" ? raw.link : null;
        if (!url) {
          return null;
        }

        return {
          title: typeof raw.title === "string" ? raw.title : url,
          url,
          snippet:
            typeof raw.snippet === "string"
              ? raw.snippet
              : typeof raw.displayed_link === "string"
                ? raw.displayed_link
                : "",
          favicon: typeof raw.favicon === "string" ? raw.favicon : undefined,
          displayed_link:
            typeof raw.displayed_link === "string" ? raw.displayed_link : undefined,
        };
      })
      .filter((result): result is z.infer<typeof serpResultSchema> => result !== null)
      .slice(0, 4);

    return { results };
  },
});
