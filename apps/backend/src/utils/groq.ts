import {
  GROQ_API_BASE,
  GROQ_CHAT_COMPLETIONS_PATH,
  GROQ_REQUEST_HEADER_ALLOWLIST,
} from "../config/constants.js";
import type { AppConfig } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import type { GroqChatCompletionsInput } from "../validators/groq.schemas.js";

export type GroqProxyInput = {
  body: GroqChatCompletionsInput;
  requestPath: string;
  requestQuery?: string;
  requestHeaders: Record<string, string | undefined>;
  signal?: AbortSignal;
};

export type GroqProxyStreamResponse = {
  status: number;
  contentType: string;
  body: ReadableStream<Uint8Array>;
  isStream: true;
};

export type GroqProxyTextResponse = {
  status: number;
  contentType: string;
  body: string;
  isStream: false;
};

export type GroqProxyResponse = GroqProxyStreamResponse | GroqProxyTextResponse;

export class GroqClient {
  constructor(private readonly config: AppConfig) {}

  async proxyChatCompletions(input: GroqProxyInput): Promise<GroqProxyResponse> {
    if (!this.config.groqApiKey) {
      throw new AppError(
        500,
        "GROQ_API_KEY is not configured",
        "missing_groq_api_key",
        {
          hint: "Set GROQ_API_KEY in apps/backend/.env",
        }
      );
    }

    if (input.requestPath !== GROQ_CHAT_COMPLETIONS_PATH) {
      throw new AppError(404, "Resource not found", "not_found");
    }

    const requestUrl = `${GROQ_API_BASE}${input.requestPath}${input.requestQuery ?? ""}`;
    const timeoutSignal = AbortSignal.timeout(this.config.groqTimeoutMs);
    const signal = input.signal
      ? AbortSignal.any([timeoutSignal, input.signal])
      : timeoutSignal;

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          ...this.buildHeaders(input.requestHeaders),
          Authorization: `Bearer ${this.config.groqApiKey}`,
        },
        body: JSON.stringify(input.body),
        signal,
      });

      const contentType = response.headers.get("content-type") ?? "application/json";
      const isStream = contentType.includes("text/event-stream");

      if (!response.ok) {
        const text = await response.text();
        throw new AppError(
          response.status,
          "Groq request failed",
          "groq_upstream_error",
          safeJsonParse(text)
        );
      }

      if (isStream) {
        if (!response.body) {
          throw new AppError(502, "Groq stream body was missing", "groq_stream_missing");
        }

        return {
          status: response.status,
          contentType,
          body: response.body,
          isStream: true,
        };
      }

      return {
        status: response.status,
        contentType,
        body: await response.text(),
        isStream: false,
      };
    } catch (error) {
      if (timeoutSignal.aborted) {
        throw new AppError(504, "Groq request timed out", "groq_timeout");
      }

      if (input.signal?.aborted) {
        throw new AppError(499, "Client disconnected", "client_disconnected");
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(502, "Groq request failed", "groq_request_failed");
    }
  }

  private buildHeaders(headers: Record<string, string | undefined>): Record<string, string> {
    const allowed = new Set(GROQ_REQUEST_HEADER_ALLOWLIST);
    const result: Record<string, string> = {
      "Content-Type": "application/json",
    };

    for (const [key, value] of Object.entries(headers)) {
      const normalizedKey = key.toLowerCase();
      if (!allowed.has(normalizedKey as (typeof GROQ_REQUEST_HEADER_ALLOWLIST)[number])) {
        continue;
      }

      if (!value) {
        continue;
      }

      result[key] = value;
    }

    return result;
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}
