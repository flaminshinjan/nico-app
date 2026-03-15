// Legacy reference kept during the Mastra migration. ChatContext now receives
// sources from the Mastra documentWorkflow response instead of calling this directly.
export type SerpResult = {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  displayed_link?: string;
};

type SerpApiResponse = {
  organic_results?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSerpApiResponse(value: unknown): value is SerpApiResponse {
  return isRecord(value);
}

function normalizeUrl(url: string) {
  try {
    const normalizedUrl = new URL(url);
    normalizedUrl.hash = "";
    normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/+$/, "") || "/";
    normalizedUrl.hostname = normalizedUrl.hostname.toLowerCase();
    return normalizedUrl.toString();
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
}

function toSerpResult(raw: unknown): SerpResult | null {
  if (!isRecord(raw)) {
    return null;
  }

  const link = typeof raw.link === "string" ? raw.link : null;
  if (!link) {
    return null;
  }

  const title =
    typeof raw.title === "string"
      ? raw.title
      : typeof raw.source === "string"
        ? raw.source
        : link;

  const richSnippet = isRecord(raw.rich_snippet) ? raw.rich_snippet : undefined;
  const richSnippetTop = richSnippet && isRecord(richSnippet.top) ? richSnippet.top : undefined;
  const richExtensions = richSnippetTop?.extensions;
  const richExtension =
    Array.isArray(richExtensions) && typeof richExtensions[0] === "string"
      ? richExtensions[0]
      : undefined;

  const snippet =
    typeof raw.snippet === "string"
      ? raw.snippet
      : richExtension ??
        (typeof raw.displayed_link === "string" ? raw.displayed_link : "");

  return {
    title,
    url: link,
    snippet,
    favicon: typeof raw.favicon === "string" ? raw.favicon : undefined,
    displayed_link:
      typeof raw.displayed_link === "string" ? raw.displayed_link : undefined,
  }
}

async function searchWebInternal(query: string): Promise<SerpResult[]> {
  const { getApiUrl } = await import("@/lib/api");
  try {
    const searchParams = new URLSearchParams({
      q: query,
      num: "4",
    });
    const response = await fetch(
      `${getApiUrl()}/api/serp/search.json?${searchParams.toString()}`
    );
    if (!response.ok) {
      console.error("SERP API request failed.", response.status, response.statusText);
      return [];
    }

    const data: unknown = await response.json();
    if (!isSerpApiResponse(data) || !Array.isArray(data.organic_results)) {
      console.error("SERP API response shape was invalid.", data);
      return [];
    }

    const normalizedResults = data.organic_results
      .map(toSerpResult)
      .filter((result): result is SerpResult => result !== null);

    if (import.meta.env.DEV) {
      console.log(`normalized source count for "${query}"`, normalizedResults.length);
    }

    return normalizedResults.slice(0, 4);
  } catch (error: unknown) {
    console.error("SERP search failed.", error);
    return [];
  }
}

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
