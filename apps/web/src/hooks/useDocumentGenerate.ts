// Legacy reference kept during the Mastra migration. ChatContext now calls the
// documentWorkflow over HTTP instead of using this direct frontend pipeline.
import type { SerpResult } from "@/hooks/useSerpSearch";

export type GeneratedDoc = {
  title: string;
  markdown: string;
};

type GroqDelta = {
  content?: unknown;
};

type GroqChoice = {
  message?: unknown;
  delta?: unknown;
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

function isGroqDelta(value: unknown): value is GroqDelta {
  return isRecord(value);
}

function isGeneratedDoc(value: unknown): value is GeneratedDoc {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.markdown === "string"
  );
}

function buildSourcesBlock(sources: SerpResult[]) {
  return sources
    .map(
      (source, index) =>
        `Source ${index + 1}: ${source.title}\nURL: ${source.url}\nSnippet: ${source.snippet}`
    )
    .join("\n\n");
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

function escapeLiteralNewlinesInJsonStrings(value: string) {
  let result = "";
  let inString = false;
  let isEscaped = false;

  for (const character of value) {
    if (character === '"' && !isEscaped) {
      inString = !inString;
      result += character;
      continue;
    }

    if (inString && character === "\n") {
      result += "\\n";
      isEscaped = false;
      continue;
    }

    if (inString && character === "\r") {
      result += "\\r";
      isEscaped = false;
      continue;
    }

    result += character;
    isEscaped = character === "\\" && !isEscaped;
    if (character !== "\\") {
      isEscaped = false;
    }
  }

  return result;
}

function parseGeneratedDocResponse(value: string): unknown {
  const normalizedValue = escapeLiteralNewlinesInJsonStrings(
    extractJsonObject(stripMarkdownFences(value))
  );

  return JSON.parse(normalizedValue);
}

function extractTokenFromStreamEvent(value: unknown): string {
  if (!isGroqResponse(value) || !Array.isArray(value.choices)) {
    return "";
  }

  const firstChoice = value.choices[0];
  if (!isGroqChoice(firstChoice) || !isGroqDelta(firstChoice.delta)) {
    return "";
  }

  return typeof firstChoice.delta.content === "string"
    ? firstChoice.delta.content
    : "";
}

export async function generateDocument(
  query: string,
  sources: SerpResult[],
  onToken: (token: string) => void
): Promise<GeneratedDoc> {
  const { getApiUrl } = await import("@/lib/api");
  const sourcesBlock = buildSourcesBlock(sources);
  const response = await fetch(
    `${getApiUrl()}/api/groq/openai/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            'You are a document drafting assistant. Always respond with valid JSON only. No markdown fences, no preamble. JSON shape: { "title": string, "markdown": string }. The markdown field should be a fully structured, well-formatted markdown document based on the user query, with headings and bullet points. IMPORTANT: Do NOT include a "Sources", "References", or "Citations" section - the sources are for your background knowledge only.',
        },
        {
          role: "user",
          content: `${query}\n\nBackground context (do NOT cite or reference these in the document):\n${sourcesBlock}`,
        },
      ],
    }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Groq request failed with ${response.status} ${response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error("Groq response body was missing.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bufferedText = "";
  let accumulatedText = "";

  while (true) {
    const { done, value } = await reader.read();
    bufferedText += decoder.decode(value, { stream: !done });

    const lines = bufferedText.split("\n");
    bufferedText = lines.pop() ?? "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith("data: ")) {
        continue;
      }

      const payload = trimmedLine.slice("data: ".length);
      if (payload === "[DONE]") {
        continue;
      }

      const parsedLine: unknown = JSON.parse(payload);
      const token = extractTokenFromStreamEvent(parsedLine);
      if (!token) {
        continue;
      }

      accumulatedText += token;
      onToken(token);
    }

    if (done) {
      break;
    }
  }

  const trailingLine = bufferedText.trim();
  if (trailingLine.startsWith("data: ")) {
    const payload = trailingLine.slice("data: ".length);
    if (payload !== "[DONE]") {
      const parsedLine: unknown = JSON.parse(payload);
      const token = extractTokenFromStreamEvent(parsedLine);
      if (token) {
        accumulatedText += token;
        onToken(token);
      }
    }
  }

  const parsed: unknown = parseGeneratedDocResponse(accumulatedText);
  if (!isGeneratedDoc(parsed)) {
    throw new Error("Groq JSON output did not match GeneratedDoc.");
  }

  return parsed;
}
