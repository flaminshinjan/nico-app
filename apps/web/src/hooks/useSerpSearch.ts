// Legacy reference kept during the Mastra migration. ChatContext now receives
// sources from the Mastra documentWorkflow response instead of calling this directly.
import { fetchSerpResults, normalizeUrl, type SerpResult } from "@/utils/serp";

async function searchWebInternal(query: string): Promise<SerpResult[]> {
  const normalizedResults = await fetchSerpResults(query, 4);

  if (import.meta.env.DEV) {
    console.log(`normalized source count for "${query}"`, normalizedResults.length);
  }

  return normalizedResults.slice(0, 4);
}

export type { SerpResult };

export async function searchWeb(query: string): Promise<SerpResult[]> {
  return searchWebInternal(query);
}

export async function searchWebQueries(queries: string[]): Promise<SerpResult[]> {
  const mergedResults: SerpResult[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    const results = await searchWebInternal(query);

    for (const result of results) {
      const normalizedUrl = normalizeUrl(result.url);
      if (seenUrls.has(normalizedUrl)) {
        continue;
      }

      seenUrls.add(normalizedUrl);
      mergedResults.push(result);

      if (mergedResults.length === 4) {
        break;
      }
    }

    if (mergedResults.length === 4) {
      break;
    }
  }

  if (import.meta.env.DEV) {
    console.log("merged deduped source count", mergedResults.length);
  }

  return mergedResults.slice(0, 4);
}
