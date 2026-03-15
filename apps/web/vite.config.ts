import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { documentsPlugin } from "./vite.documents-plugin";

export default defineConfig({
  plugins: [react(), documentsPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api/serp": {
        target: "https://serpapi.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/serp/, ""),
      },
      "/api/groq": {
        target: "https://api.groq.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/groq/, ""),
      },
    },
  },
});
