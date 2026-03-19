import { Router, type Router as ExpressRouter } from "express";
import { DocumentsController } from "../controllers/documents.controller.js";
import { asyncHandler } from "../lib/async-handler.js";
import { validate } from "../middleware/validate.js";
import { DocumentsService } from "../services/documents.service.js";
import { htmlToDocxSchema, markdownToHtmlSchema } from "../validators/documents.schemas.js";

export function createDocumentsRouter(): ExpressRouter {
  const router: ExpressRouter = Router();
  const controller = new DocumentsController(new DocumentsService());

  router.post(
    "/markdown-to-html",
    validate({ body: markdownToHtmlSchema }),
    asyncHandler(controller.markdownToHtml)
  );
  router.post(
    "/html-to-docx",
    validate({ body: htmlToDocxSchema }),
    asyncHandler(controller.htmlToDocx)
  );

  return router;
}
