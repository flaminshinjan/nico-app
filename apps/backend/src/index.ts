import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";

const config = loadEnv();
const app = createApp(config);

for (const warning of config.warnings) {
  console.warn(`[config] ${warning}`);
}

const server = app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`Received ${signal}. Shutting down backend.`);
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
