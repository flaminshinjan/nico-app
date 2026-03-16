export type ErrorResponse = {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
};

export type HealthResponse = {
  status: "ok";
  env: {
    GROQ_API_KEY: "set" | "missing";
    SERP_API_KEY: "set" | "missing";
  };
};
