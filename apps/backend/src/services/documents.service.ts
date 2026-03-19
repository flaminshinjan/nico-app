import HTMLtoDOCX from "html-to-docx";
import { marked } from "marked";
import { AppError } from "../errors/app-error.js";
import { sanitizeHtmlContent } from "../lib/sanitize.js";

export class DocumentsService {
  async convertMarkdownToHtml(markdown: string): Promise<string> {
    try {
      const html = await marked.parse(markdown);
      return sanitizeHtmlContent(html ?? "");
    } catch (error) {
      throw new AppError(500, "Failed to convert markdown", "markdown_conversion_failed", {
        cause: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  async convertHtmlToDocx(html: string): Promise<Buffer> {
    try {
      const sanitizedHtml = sanitizeHtmlContent(html || "<p></p>");
      const result = await HTMLtoDOCX(sanitizedHtml || "<p></p>", null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      if (Buffer.isBuffer(result)) {
        return result;
      }

      return Buffer.from(await (result as Blob).arrayBuffer());
    } catch (error) {
      throw new AppError(500, "Failed to generate DOCX", "docx_generation_failed", {
        cause: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
