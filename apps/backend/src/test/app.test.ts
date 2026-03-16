import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createTestConfig } from "./helpers.js";

describe("app", () => {
  it("returns health state without exposing secrets", async () => {
    const app = createApp(createTestConfig());

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      env: {
        GROQ_API_KEY: "set",
        SERP_API_KEY: "set",
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("test-groq-key");
  });

  it("returns 404 for unknown routes", async () => {
    const app = createApp(createTestConfig());

    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Resource not found");
  });
});
