import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";
import {
  DEFAULT_CORS_ALLOWED_ORIGINS,
  DEFAULT_GROQ_TIMEOUT_MS,
  DEFAULT_PORT,
  DEFAULT_SERP_TIMEOUT_MS,
  RATE_LIMITS,
} from "./constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../..");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(DEFAULT_PORT),
  SERP_API_KEY: z.string().optional(),
  VITE_SERP_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  VITE_GROQ_API_KEY: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  SERP_TIMEOUT_MS: z.coerce.number().int().min(1).default(DEFAULT_SERP_TIMEOUT_MS),
  GROQ_TIMEOUT_MS: z.coerce.number().int().min(1).default(DEFAULT_GROQ_TIMEOUT_MS),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  corsAllowedOrigins: string[];
  serpApiKey?: string;
  groqApiKey?: string;
  serpTimeoutMs: number;
  groqTimeoutMs: number;
  rateLimits: typeof RATE_LIMITS;
  logRequests: boolean;
  warnings: string[];
};

function normalizeOptionalValue(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("your_")) {
    return undefined;
  }

  return trimmed;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveApiKey(
  primaryName: string,
  primaryValue: string | undefined,
  aliasName: string,
  aliasValue: string | undefined,
  warnings: string[]
): string | undefined {
  const normalizedPrimary = normalizeOptionalValue(primaryValue);
  if (normalizedPrimary) {
    return normalizedPrimary;
  }

  const normalizedAlias = normalizeOptionalValue(aliasValue);
  if (normalizedAlias) {
    warnings.push(`${aliasName} is deprecated. Move the value to ${primaryName}.`);
    return normalizedAlias;
  }

  return undefined;
}

export function loadDotenv(): void {
  dotenv.config({ path: path.join(backendDir, ".env") });
  dotenv.config({ path: path.join(process.cwd(), ".env") });
}

export function parseEnv(rawEnv: NodeJS.ProcessEnv): AppConfig {
  const parsed = envSchema.parse(rawEnv);
  const warnings: string[] = [];
  const corsAllowedOrigins = parseCsv(parsed.CORS_ALLOWED_ORIGINS);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    corsAllowedOrigins:
      corsAllowedOrigins.length > 0
        ? corsAllowedOrigins
        : parsed.NODE_ENV === "production"
          ? []
          : DEFAULT_CORS_ALLOWED_ORIGINS,
    serpApiKey: resolveApiKey(
      "SERP_API_KEY",
      parsed.SERP_API_KEY,
      "VITE_SERP_API_KEY",
      parsed.VITE_SERP_API_KEY,
      warnings
    ),
    groqApiKey: resolveApiKey(
      "GROQ_API_KEY",
      parsed.GROQ_API_KEY,
      "VITE_GROQ_API_KEY",
      parsed.VITE_GROQ_API_KEY,
      warnings
    ),
    serpTimeoutMs: parsed.SERP_TIMEOUT_MS,
    groqTimeoutMs: parsed.GROQ_TIMEOUT_MS,
    rateLimits: RATE_LIMITS,
    logRequests: parsed.NODE_ENV !== "test",
    warnings,
  };
}

export function loadEnv(): AppConfig {
  loadDotenv();
  return parseEnv(process.env);
}
