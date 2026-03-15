import type { Plugin } from "vite";
import { marked } from "marked";
import HTMLtoDOCX from "html-to-docx";

function readJsonBody<T>(req: import("http").IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as T);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

export function documentsPlugin(): Plugin {
  return {
    name: "documents-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (!pathname.startsWith("/api/documents/") || !req.method) {
          next();
          return;
        }
        try {
          if (req.method === "POST" && pathname === "/api/documents/markdown-to-html") {
            const body = await readJsonBody<{ markdown?: string }>(req);
            const markdown = typeof body.markdown === "string" ? body.markdown : "";
            const html = (await marked.parse(markdown)) ?? "";
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ html: html ?? "" }));
            return;
          }
          if (req.method === "POST" && pathname === "/api/documents/html-to-docx") {
            const body = await readJsonBody<{ html?: string }>(req);
            const html = typeof body.html === "string" ? body.html : "<p></p>";
            const result = await HTMLtoDOCX(html, null, {
              table: { row: { cantSplit: true } },
              footer: true,
              pageNumber: true,
            });
            const buffer = Buffer.isBuffer(result) ? result : Buffer.from(await (result as Blob).arrayBuffer());
            res.statusCode = 200;
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );
            res.setHeader("Content-Disposition", 'attachment; filename="document.docx"');
            res.end(buffer);
            return;
          }
        } catch (err) {
          console.error("[documents-api]", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Internal server error" }));
          return;
        }
        next();
      });
    },
  };
}
