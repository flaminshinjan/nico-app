type PlannedSearch = {
  queries: string[];
};

type GroqMessage = {
  content?: unknown;
};

type GroqChoice = {
  message?: unknown;
};

type GroqResponse = {
  choices?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGroqResponse(value: unknown): value is GroqResponse {
  return isRecord(value);
}

function isGroqChoice(value: unknown): value is GroqChoice {
  return isRecord(value);
}

function isGroqMessage(value: unknown): value is GroqMessage {
  return isRecord(value);
}

function isPlannedSearch(value: unknown): value is PlannedSearch {
  return (
    isRecord(value) &&
    Array.isArray(value.queries) &&
    value.queries.every((query) => typeof query === "string")
  );
}

function stripMarkdownFences(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractJsonObject(value: string) {
  const startIndex = value.indexOf("{");
  const endIndex = value.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return value;
  }

  return value.slice(startIndex, endIndex + 1);
}

function parsePlannerResponse(value: string): PlannedSearch {
  const parsed: unknown = JSON.parse(extractJsonObject(stripMarkdownFences(value)));
  if (!isPlannedSearch(parsed)) {
    throw new Error("Search planner output did not match PlannedSearch.");
  }

  const queries = parsed.queries
    .map((query) => query.trim())
    .filter((query) => query.length > 0)
    .slice(0, 3);

  if (queries.length === 0) {
    throw new Error("Search planner returned no usable queries.");
  }

  return { queries };
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
  const fallback = { queries: [buildFallbackQuery(prompt)] };
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.log("search planner fallback: missing VITE_GROQ_API_KEY");
    }
    return fallback;
  }

  try {
    const response = await fetch("/api/groq/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 256,
        messages: [
          {
            role: "system",
            content:
              'You rewrite drafting requests into concise web search queries. Return valid JSON only with shape { "queries": string[] }. Generate 1 to 3 short web queries. Focus on retrieval intent, role, company, location, compensation, and document type. Avoid imperative words like create, write, draft, or generate.',
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Search planner request failed with ${response.status} ${response.statusText}`
      );
    }

    const data: unknown = await response.json();
    if (!isGroqResponse(data) || !Array.isArray(data.choices)) {
      throw new Error("Search planner response shape was invalid.");
    }

    const firstChoice = data.choices[0];
    if (!isGroqChoice(firstChoice) || !isGroqMessage(firstChoice.message)) {
      throw new Error("Search planner choice was invalid.");
    }

    const text = firstChoice.message.content;
    if (typeof text !== "string") {
      throw new Error("Search planner content was invalid.");
    }

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
