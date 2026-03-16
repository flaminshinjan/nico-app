import { SERP_API_BASE } from "../config/constants.js";
import type { AppConfig } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

type SerpSearchInput = {
  query: string;
  num: number;
};

export class SerpClient {
  constructor(private readonly config: AppConfig) {}

  async search({ query, num }: SerpSearchInput): Promise<unknown> {
    if (!this.config.serpApiKey) {
      throw new AppError(
        500,
        "SERP_API_KEY is not configured",
        "missing_serp_api_key",
        {
          hint: "Set SERP_API_KEY in apps/backend/.env",
        }
      );
    }

    const params = new URLSearchParams({
      q: query,
      num: String(num),
      api_key: this.config.serpApiKey,
    });
    const timeoutSignal = AbortSignal.timeout(this.config.serpTimeoutMs);

    try {
      const response = await fetch(`${SERP_API_BASE}/search.json?${params.toString()}`, {
        signal: timeoutSignal,
      });

      const text = await response.text();
      const payload = text ? safeJsonParse(text) : {};

      if (!response.ok) {
        throw new AppError(
          response.status,
          "SERP request failed",
          "serp_upstream_error",
          payload
        );
      }

      return payload;
    } catch (error) {
      if (timeoutSignal.aborted) {
        throw new AppError(504, "SERP request timed out", "serp_timeout");
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(502, "SERP request failed", "serp_request_failed");
    }
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}
