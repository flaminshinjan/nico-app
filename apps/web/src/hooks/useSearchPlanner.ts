import { createGroqChatCompletion, parseJsonResponseText } from "@/utils/groq";

type PlannedSearch = {
  queries: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPlannedSearch(value: unknown): value is PlannedSearch {
  return (
    isRecord(value) &&
    Array.isArray(value.queries) &&
    value.queries.every((query) => typeof query === "string")
  );
}

function parsePlannerResponse(value: string): PlannedSearch {
  const parsed: unknown = parseJsonResponseText(value);
  if (!isPlannedSearch(parsed)) {
    throw new Error("Search planner output did not match PlannedSearch.");
  }

  const queries = parsed.queries
    .map((query) => query.trim())
    .filter((query) => query.length > 0)
    .slice(0, 3);

  return { queries };
}

function shouldSkipWebSearch(prompt: string): boolean {
  const normalized = prompt.toLowerCase();

  return [
    "email",
    "message",
    "text",
    "dm",
    "letter",
    "note",
    "invitation",
    "invite",
  ].some((keyword) => normalized.includes(keyword));
}

function buildFallbackQuery(prompt: string) {
  const normalized = prompt
    .toLowerCase()
    .replace(/\b(create|write|draft|generate|make|prepare)\b/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = normalized.split(" ").filter(Boolean);
  const filteredTokens = tokens.filter(
    (token) =>
      ![
        "an",
        "a",
        "the",
        "for",
        "at",
        "is",
        "to",
        "of",
        "and",
        "candidate",
      ].includes(token)
  );
  const selectedTokens = filteredTokens.slice(0, 10);

  if (!selectedTokens.includes("template")) {
    selectedTokens.push("template");
  }

  return selectedTokens.join(" ");
}

export async function planSearchQueries(prompt: string): Promise<PlannedSearch> {
  const fallback = shouldSkipWebSearch(prompt)
    ? { queries: [] }
    : { queries: [buildFallbackQuery(prompt)] };
  try {
    const text = await createGroqChatCompletion({
      model: "llama-3.3-70b-versatile",
      max_tokens: 256,
      messages: [
        {
          role: "system",
          content:
            'You turn drafting requests into web research queries only when research is actually needed. Return valid JSON only with shape { "queries": string[] }. If the request is a personal message, simple email, casual invite, or other writing task that does not need outside facts, return a single empty array. If research is needed, generate 1 to 3 short queries focused on factual retrieval terms and omit words like write, draft, create, or generate.',
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const plannedSearch = parsePlannerResponse(text);
    if (import.meta.env.DEV) {
      console.log("planned search queries", plannedSearch.queries);
    }
    return plannedSearch;
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.log("search planner fallback after error", error);
    }
    return fallback;
  }
}

export type { PlannedSearch };
