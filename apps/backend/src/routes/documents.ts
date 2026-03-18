import type { IRouter } from "express";
import { Router } from "express";
import { marked } from "marked";
import multer from "multer";
import {
  convertDocxBufferToHtml,
  convertHtmlToDocx,
  getDocxConversionHealth,
  getUploadLimitBytes,
  toConversionError,
  type DocxFidelity,
} from "../services/docxConversion.js";

export const documentsRouter: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getUploadLimitBytes() },
});

// Block type definitions (mirrors schema from @nico/agents)
interface HeadingBlock {
  id: string;
  type: "heading";
  level: 1 | 2 | 3;
  content: string;
}

interface ParagraphBlock {
  id: string;
  type: "paragraph";
  content: string;
}

interface ListBlock {
  id: string;
  type: "list";
  style: "ordered" | "unordered";
  items: string[];
}

interface SalutationBlock {
  id: string;
  type: "salutation";
  content: string;
}

interface ClosingBlock {
  id: string;
  type: "closing";
  content: string;
}

interface ClauseBlock {
  id: string;
  type: "clause";
  title: string;
  content: string;
}

interface SpacerBlock {
  id: string;
  type: "spacer";
}

type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | SalutationBlock
  | ClosingBlock
  | ClauseBlock
  | SpacerBlock;

/**
 * Convert inline markdown (bold, italic, links) to HTML
 * Uses marked for parsing inline content
 */
async function parseInlineMarkdown(text: string): Promise<string> {
  // marked.parseInline handles **bold**, *italic*, [links](url), etc.
  const result = await marked.parseInline(text);
  return result ?? text;
}

/**
 * Convert a single content block to HTML
 */
async function blockToHtml(block: ContentBlock): Promise<string> {
  switch (block.type) {
    case "heading": {
      const content = await parseInlineMarkdown(block.content);
      return `<h${block.level}>${content}</h${block.level}>`;
    }

    case "paragraph": {
      const content = await parseInlineMarkdown(block.content);
      return `<p>${content}</p>`;
    }

    case "list": {
      const tag = block.style === "ordered" ? "ol" : "ul";
      const itemsHtml = await Promise.all(
        block.items.map(async (item) => {
          const content = await parseInlineMarkdown(item);
          return `<li>${content}</li>`;
        })
      );
      return `<${tag}>${itemsHtml.join("")}</${tag}>`;
    }

    case "salutation": {
      const content = await parseInlineMarkdown(block.content);
      return `<p class="salutation">${content}</p>`;
    }

    case "closing": {
      const content = await parseInlineMarkdown(block.content);
      return `<p class="closing">${content}</p>`;
    }

    case "clause": {
      const title = await parseInlineMarkdown(block.title);
      const content = await parseInlineMarkdown(block.content);
      return `<div class="clause"><h3 class="clause-title">${title}</h3><p>${content}</p></div>`;
    }

    case "spacer": {
      return `<p><br></p>`;
    }

    default:
      return "";
  }
}

/**
 * Convert an array of content blocks to HTML
 */
async function blocksToHtml(blocks: ContentBlock[]): Promise<string> {
  const htmlParts = await Promise.all(blocks.map(blockToHtml));
  return htmlParts.join("\n");
}

/**
 * Check if the request body contains blocks (new format) or markdown (legacy)
 */
function isBlockFormat(body: unknown): body is { content: ContentBlock[] } {
  return (
    typeof body === "object" &&
    body !== null &&
    "content" in body &&
    Array.isArray((body as { content: unknown }).content)
  );
}

documentsRouter.post("/markdown-to-html", async (req, res) => {
  try {
    // Handle new block format
    if (isBlockFormat(req.body)) {
      const html = await blocksToHtml(req.body.content);
      res.json({ html: html || "<p></p>" });
      return;
    }

    // Handle legacy markdown format
    const markdown = typeof req.body?.markdown === "string" ? req.body.markdown : "";
    const html = (await marked.parse(markdown)) ?? "";
    res.json({ html: html ?? "" });
  } catch (err) {
    console.error("[documents] markdown-to-html", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * New endpoint specifically for block-to-HTML conversion
 * Accepts: { content: ContentBlock[] }
 * Returns: { html: string }
 */
documentsRouter.post("/blocks-to-html", async (req, res) => {
  try {
    if (!isBlockFormat(req.body)) {
      res.status(400).json({ error: "Invalid request body. Expected { content: ContentBlock[] }" });
      return;
    }

    const html = await blocksToHtml(req.body.content);
    res.json({ html: html || "<p></p>" });
  } catch (err) {
    console.error("[documents] blocks-to-html", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

documentsRouter.post("/html-to-docx", async (req, res) => {
  try {
    const html = typeof req.body?.html === "string" ? req.body.html : "<p></p>";
    const { buffer } = await convertHtmlToDocx(html, "balanced");
    res
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
      .setHeader("Content-Disposition", 'attachment; filename="document.docx"')
      .send(buffer);
  } catch (err) {
    console.error("[documents] html-to-docx", err);
    const mapped = toConversionError(err);
    res.status(mapped.status).json({ error: mapped.error, hint: mapped.hint });
  }
});

documentsRouter.get("/health", async (_req, res) => {
  try {
    const conversion = await getDocxConversionHealth();
    res.json({ status: "ok", conversion });
  } catch (err) {
    console.error("[documents] health", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

documentsRouter.post("/docx-to-html", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Missing DOCX file. Expected multipart field 'file'." });
      return;
    }

    const isDocxName = file.originalname.toLowerCase().endsWith(".docx");
    const isDocxMime = file.mimetype.includes("officedocument.wordprocessingml.document");
    if (!isDocxName && !isDocxMime) {
      res.status(400).json({ error: "Only .docx files are supported." });
      return;
    }

    const result = await convertDocxBufferToHtml(file.buffer);
    res.json({
      html: result.html,
      engine: result.engine,
      fileName: file.originalname,
    });
  } catch (err) {
    console.error("[documents] docx-to-html", err);
    const mapped = toConversionError(err);
    res.status(mapped.status).json({ error: mapped.error, hint: mapped.hint });
  }
});

documentsRouter.post("/html-to-docx-fidelity", async (req, res) => {
  try {
    const html = typeof req.body?.html === "string" ? req.body.html : "<p></p>";
    const fidelityRaw = req.body?.fidelity;
    const fidelity: DocxFidelity =
      fidelityRaw === "full" || fidelityRaw === "balanced" || fidelityRaw === "compatible"
        ? fidelityRaw
        : "full";
    const fileNameBase =
      typeof req.body?.title === "string" && req.body.title.trim().length > 0
        ? req.body.title
        : "document";
    const safeName = fileNameBase.replace(/[\\/:*?"<>|]/g, "").trim() || "document";

    const { buffer, engine } = await convertHtmlToDocx(html, fidelity);
    res
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
      .setHeader("X-Docx-Engine", engine)
      .setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`)
      .send(buffer);
  } catch (err) {
    console.error("[documents] html-to-docx-fidelity", err);
    const mapped = toConversionError(err);
    res.status(mapped.status).json({ error: mapped.error, hint: mapped.hint });
  }
});
