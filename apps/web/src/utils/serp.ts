import { getApiUrl } from "@/lib/api";

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
  };
}

export function normalizeUrl(url: string) {
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

export async function fetchSerpResults(query: string, num = 4): Promise<SerpResult[]> {
  try {
    const searchParams = new URLSearchParams({
      q: query,
      num: String(num),
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

    return data.organic_results
      .map(toSerpResult)
      .filter((result): result is SerpResult => result !== null)
      .slice(0, num);
  } catch (error: unknown) {
    console.error("SERP search failed.", error);
    return [];
  }
}
