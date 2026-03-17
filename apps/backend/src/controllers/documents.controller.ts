import type { RequestHandler } from "express";
import type { DocumentsService } from "../services/documents.service.js";
import type {
  HtmlToDocxInput,
  MarkdownToHtmlInput,
} from "../validators/documents.schemas.js";

export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  markdownToHtml: RequestHandler = async (req, res) => {
    const { markdown } = req.validated?.body as MarkdownToHtmlInput;
    const html = await this.documentsService.convertMarkdownToHtml(markdown);
    res.json({ html });
  };

  htmlToDocx: RequestHandler = async (req, res) => {
    const { html } = req.validated?.body as HtmlToDocxInput;
    const documentBuffer = await this.documentsService.convertHtmlToDocx(html);

    res
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
      .setHeader("Content-Disposition", 'attachment; filename="document.docx"')
      .send(documentBuffer);
  };
}
