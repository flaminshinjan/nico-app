import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { createTestConfig } from "./helpers.js";

function createStreamResponse(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe("groq route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects non-json requests", async () => {
    const app = createApp(createTestConfig());

    const response = await request(app)
      .post("/api/groq/openai/v1/chat/completions")
      .set("Content-Type", "text/plain")
      .send("nope");

    expect(response.status).toBe(400);
  });

  it("proxies chat completions and strips sensitive headers", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "chatcmpl_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const app = createApp(createTestConfig());
    const response = await request(app)
      .post("/api/groq/openai/v1/chat/completions")
      .set("Authorization", "Bearer should-not-forward")
      .set("x-request-id", "req-123")
      .send({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hello" }],
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("chatcmpl_1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-groq-key");
    expect((init?.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it("preserves text/event-stream responses", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(createStreamResponse(["data: first\n\n", "data: [DONE]\n\n"]), {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      })
    );

    const app = createApp(createTestConfig());
    const response = await request(app)
      .post("/api/groq/openai/v1/chat/completions")
      .send({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hello" }],
        stream: true,
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain("data: first");
  });

  it("returns a controlled error when the API key is missing", async () => {
    const app = createApp(createTestConfig({ groqApiKey: undefined }));

    const response = await request(app)
      .post("/api/groq/openai/v1/chat/completions")
      .send({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hello" }],
      });

    expect(response.status).toBe(500);
    expect(response.body.code).toBe("missing_groq_api_key");
  });
});
