import { describe, expect, it } from "vitest";
import { parseEnv } from "../config/env.js";

describe("parseEnv", () => {
  it("uses deprecated aliases as fallbacks and records a warning", () => {
    const config = parseEnv({
      NODE_ENV: "development",
      PORT: "4000",
      VITE_SERP_API_KEY: "alias-serp",
      VITE_GROQ_API_KEY: "alias-groq",
    });

    expect(config.serpApiKey).toBe("alias-serp");
    expect(config.groqApiKey).toBe("alias-groq");
    expect(config.warnings).toHaveLength(2);
  });

  it("defaults local cors origins outside production", () => {
    const config = parseEnv({
      NODE_ENV: "development",
      PORT: "4000",
    });

    expect(config.corsAllowedOrigins).toContain("http://localhost:3000");
  });
});
