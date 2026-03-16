import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createTestConfig } from "./helpers.js";

describe("documents routes", () => {
  it("converts markdown to sanitized html", async () => {
    const app = createApp(createTestConfig());

    const response = await request(app)
      .post("/api/documents/markdown-to-html")
      .send({
        markdown: "# Hello\n\n<script>alert('xss')</script>\n\nA [link](https://example.com)",
      });

    expect(response.status).toBe(200);
    expect(response.body.html).toContain("<h1>Hello</h1>");
    expect(response.body.html).not.toContain("<script>");
  });

  it("rejects invalid markdown payloads", async () => {
    const app = createApp(createTestConfig());

    const response = await request(app)
      .post("/api/documents/markdown-to-html")
      .send({ markdown: 42 });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("validation_error");
  });

  it("creates docx output from sanitized html", async () => {
    const app = createApp(createTestConfig());

    const response = await request(app)
      .post("/api/documents/html-to-docx")
      .send({ html: "<h1>Title</h1><script>alert('xss')</script><p>Safe body</p>" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(Number(response.headers["content-length"] ?? 0)).toBeGreaterThan(0);
  });
});
