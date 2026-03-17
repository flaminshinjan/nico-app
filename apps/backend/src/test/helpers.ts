import type { AppConfig } from "../config/env.js";
import { RATE_LIMITS } from "../config/constants.js";

export function createTestConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: "test",
    port: 4_000,
    corsAllowedOrigins: ["http://localhost:3000"],
    serpApiKey: "test-serp-key",
    groqApiKey: "test-groq-key",
    serpTimeoutMs: 8_000,
    groqTimeoutMs: 30_000,
    rateLimits: RATE_LIMITS,
    logRequests: false,
    warnings: [],
    ...overrides,
  };
}
