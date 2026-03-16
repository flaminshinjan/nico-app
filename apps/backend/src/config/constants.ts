export const DEFAULT_PORT = 4000;
export const DEFAULT_JSON_LIMIT = "1mb";
export const DOCUMENTS_JSON_LIMIT = "5mb";
export const DEFAULT_SERP_TIMEOUT_MS = 8_000;
export const DEFAULT_GROQ_TIMEOUT_MS = 30_000;
export const DEFAULT_CORS_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
];

export const SERP_API_BASE = "https://serpapi.com";
export const GROQ_API_BASE = "https://api.groq.com";
export const GROQ_CHAT_COMPLETIONS_PATH = "/openai/v1/chat/completions";

export const RATE_LIMITS = {
  documents: 30,
  serp: 60,
  groq: 20,
} as const;

export const LOG_REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers['x-api-key']",
  "req.headers['api-key']",
  "res.headers['set-cookie']",
] as const;

export const GROQ_REQUEST_HEADER_ALLOWLIST = [
  "accept",
  "content-type",
  "x-request-id",
] as const;

export const SANITIZE_HTML_OPTIONS: IOptions = {
  allowedTags: [
    "a",
    "blockquote",
    "br",
    "code",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "li",
    "ol",
    "p",
    "pre",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};
import type { IOptions } from "sanitize-html";
