import { getApiUrl } from "@/lib/api";

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

export function parseJsonResponseText<T>(value: string): T {
  const normalizedValue = escapeLiteralNewlinesInJsonStrings(
    extractJsonObject(stripMarkdownFences(value))
  );

  return JSON.parse(normalizedValue) as T;
}

export async function createGroqChatCompletion(body: Record<string, unknown>): Promise<string> {
  const response = await fetch(`${getApiUrl()}/api/groq/openai/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Groq request failed with ${response.status} ${response.statusText}`
    );
  }

  const data: unknown = await response.json();
  if (!isGroqResponse(data) || !Array.isArray(data.choices)) {
    throw new Error("Groq response shape was invalid.");
  }

  const firstChoice = data.choices[0];
  if (!isGroqChoice(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("Groq response choice was invalid.");
  }

  const content = firstChoice.message.content;
  if (typeof content !== "string") {
    throw new Error("Groq response content was invalid.");
  }

  return content;
}

export async function streamGroqChatCompletion(
  body: Record<string, unknown>,
  onToken: (token: string) => void
): Promise<string> {
  const response = await fetch(`${getApiUrl()}/api/groq/openai/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

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
      if (!isGroqResponse(parsedLine) || !Array.isArray(parsedLine.choices)) {
        continue;
      }

      const firstChoice = parsedLine.choices[0];
      if (!isGroqChoice(firstChoice) || !isGroqDelta(firstChoice.delta)) {
        continue;
      }

      const token =
        typeof firstChoice.delta.content === "string"
          ? firstChoice.delta.content
          : "";
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
      if (isGroqResponse(parsedLine) && Array.isArray(parsedLine.choices)) {
        const firstChoice = parsedLine.choices[0];
        if (isGroqChoice(firstChoice) && isGroqDelta(firstChoice.delta)) {
          const token =
            typeof firstChoice.delta.content === "string"
              ? firstChoice.delta.content
              : "";
          if (token) {
            accumulatedText += token;
            onToken(token);
          }
        }
      }
    }
  }

  return accumulatedText;
}
