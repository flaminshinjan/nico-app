import type { IRouter } from "express";
import { Router } from "express";
import { marked } from "marked";
import HTMLtoDOCX from "html-to-docx";

export const documentsRouter: IRouter = Router();

documentsRouter.post("/markdown-to-html", async (req, res) => {
  try {
    const markdown = typeof req.body?.markdown === "string" ? req.body.markdown : "";
    const html = (await marked.parse(markdown)) ?? "";
    res.json({ html: html ?? "" });
  } catch (err) {
    console.error("[documents] markdown-to-html", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

documentsRouter.post("/html-to-docx", async (req, res) => {
  try {
    const html = typeof req.body?.html === "string" ? req.body.html : "<p></p>";
    const result = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    const buffer = Buffer.isBuffer(result)
      ? result
      : Buffer.from(await (result as Blob).arrayBuffer());
    res
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
      .setHeader("Content-Disposition", 'attachment; filename="document.docx"')
      .send(buffer);
  } catch (err) {
    console.error("[documents] html-to-docx", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
