import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { createTestConfig } from "./helpers.js";

describe("serp route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("validates the query string", async () => {
    const app = createApp(createTestConfig());

    const response = await request(app).get("/api/serp/search.json");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("validation_error");
  });

  it("returns upstream payloads", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ organic_results: [{ title: "Result" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const app = createApp(createTestConfig());
    const response = await request(app).get("/api/serp/search.json?q=test&num=4");

    expect(response.status).toBe(200);
    expect(response.body.organic_results).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a controlled error when the API key is missing", async () => {
    const app = createApp(createTestConfig({ serpApiKey: undefined }));

    const response = await request(app).get("/api/serp/search.json?q=test");

    expect(response.status).toBe(500);
    expect(response.body.code).toBe("missing_serp_api_key");
  });
});
