import type { RequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import type { GroqProxyService } from "../services/groq-proxy.service.js";
import type { GroqChatCompletionsInput } from "../validators/groq.schemas.js";

export class GroqController {
  constructor(private readonly groqProxyService: GroqProxyService) {}

  proxyChatCompletions: RequestHandler = async (req, res) => {
    if (!req.is("application/json")) {
      throw new AppError(415, "Content-Type must be application/json", "unsupported_media_type");
    }

    const abortController = new AbortController();
    req.on("close", () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const upstreamResponse = await this.groqProxyService.proxyChatCompletions({
      body: req.validated?.body as GroqChatCompletionsInput,
      requestPath: req.path,
      requestQuery: req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "",
      requestHeaders: extractRequestHeaders(req.headers),
      signal: abortController.signal,
    });

    res.status(upstreamResponse.status);
    res.setHeader("Content-Type", upstreamResponse.contentType);

    if (!upstreamResponse.isStream) {
      const body = upstreamResponse.body;
      const rawText = typeof body === "string" ? body : "";

      try {
        res.send(JSON.parse(rawText));
      } catch {
        res.send(rawText);
      }
      return;
    }

    const reader = upstreamResponse.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }

      res.write(Buffer.from(value));
    }
  };
}

function extractRequestHeaders(
  headers: Record<string, string | string[] | undefined>
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(headers)) {
    result[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  return result;
}
