import type { IRouter } from "express";
import { Router } from "express";
import { marked } from "marked";
import HTMLtoDOCX from "html-to-docx";

export const documentsRouter: IRouter = Router();

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
