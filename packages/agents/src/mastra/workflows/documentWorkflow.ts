import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { groq } from "@ai-sdk/groq";
import { Agent } from "@mastra/core/agent";
import { serpTool } from "../tools";
import {
  documentResultSchema,
  legacyDocumentResultSchema,
  isLegacyFormat,
  serpResultSchema,
  type ContentBlock,
  type DocumentResult,
} from "../schemas";
import { getSkillById, skills } from "../skills";
import { readTextStream, stripJsonFences } from "../lib/stream";
import { classifyDocumentType, type DocumentType } from "../classifier/documentClassifier";

function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          const hashes = "#".repeat(block.level)
          return `${hashes} ${block.content}`
        case "paragraph":
          return block.content
        case "list":
          if (block.style === "ordered") {
            return block.items.map((item, i) => `${i + 1}. ${item}`).join("\n")
          }
          return block.items.map((item) => `- ${item}`).join("\n")
        case "salutation":
          return block.content
        case "closing":
          return block.content
        case "clause":
          return `## ${block.title}\n\n${block.content}`
        case "spacer":
          return ""
        default:
          return ""
      }
    })
    .join("\n\n")
}

function parseDocumentResult(jsonObj: unknown): { title: string; content: ContentBlock[] } {
  if (isLegacyFormat(jsonObj)) {
    const legacy = legacyDocumentResultSchema.parse(jsonObj)
    const lines = legacy.markdown.split("\n")
    const content: ContentBlock[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        content.push({ id: generateBlockId(), type: "spacer" })
        continue
      }
      if (trimmed.startsWith("# ")) {
        content.push({ id: generateBlockId(), type: "heading", level: 1, content: trimmed.slice(2) })
      } else if (trimmed.startsWith("## ")) {
        content.push({ id: generateBlockId(), type: "heading", level: 2, content: trimmed.slice(3) })
      } else if (trimmed.startsWith("### ")) {
        content.push({ id: generateBlockId(), type: "heading", level: 3, content: trimmed.slice(4) })
      } else if (trimmed.startsWith("- ") || trimmed.match(/^\d+\.\s/)) {
        const lastBlock = content[content.length - 1]
        if (lastBlock?.type === "list") {
          if (trimmed.startsWith("- ")) {
            lastBlock.items.push(trimmed.slice(2))
          } else {
            lastBlock.items.push(trimmed.replace(/^\d+\.\s/, ""))
          }
        } else {
          content.push({
            id: generateBlockId(),
            type: "list",
            style: trimmed.startsWith("- ") ? "unordered" : "ordered",
            items: [trimmed.startsWith("- ") ? trimmed.slice(2) : trimmed.replace(/^\d+\.\s/, "")],
          })
        }
      } else {
        content.push({ id: generateBlockId(), type: "paragraph", content: trimmed })
      }
    }
    
    return { title: legacy.title, content }
  }
  
  const parsed = documentResultSchema.parse(jsonObj)
  return { title: parsed.title, content: parsed.content }
}

const BASE_INSTRUCTIONS = `You are a document drafting assistant that produces well-structured, professionally formatted documents.

## Output Format
Return ONLY valid JSON. Do not include explanations, markdown code blocks, or text outside the JSON object.

Your response must follow this exact JSON structure:
{
  "title": "Document Title",
  "content": [
    // Array of content blocks (see block types below)
  ]
}

## Block Types

Each block must have a unique "id" field (use format "block-1", "block-2", etc.).

Available block types:

1. **heading** - Section headers
   { "id": "block-1", "type": "heading", "level": 1|2|3, "content": "Header text" }

2. **paragraph** - Body text (supports **bold** and *italic* markdown)
   { "id": "block-2", "type": "paragraph", "content": "Paragraph text with **bold** and *italic*." }

3. **list** - Ordered or unordered lists
   { "id": "block-3", "type": "list", "style": "ordered"|"unordered", "items": ["Item 1", "Item 2"] }

4. **salutation** - Opening greeting (for emails, letters)
   { "id": "block-4", "type": "salutation", "content": "Dear John," }

5. **closing** - Sign-off (for emails, letters)
   { "id": "block-5", "type": "closing", "content": "Best regards," }

6. **clause** - Legal/contract clauses with titles
   { "id": "block-6", "type": "clause", "title": "Clause Title", "content": "Clause content..." }

7. **spacer** - Visual spacing between sections
   { "id": "block-7", "type": "spacer" }

## Formatting Guidelines

- Use appropriate block types for document structure
- Use **bold** for emphasis and *italic* for secondary emphasis within paragraph content
- Add spacer blocks between major sections for readability
- For emails/letters: always use salutation at start, spacer, body paragraphs, spacer, closing
- For reports/docs: use heading hierarchy (level 1 for title, level 2 for sections, level 3 for subsections)
- For legal documents: use clause blocks with clear titles

## Important: Handling Sources

When sources are provided as context:
- Use them ONLY as background information to improve accuracy
- Do NOT add a "References", "Sources", or "Citations" section to the document
- Do NOT cite or mention the sources within the document text
- The sources are for YOUR knowledge only, not for inclusion in the output
- Write naturally as if you already knew this information

## Example Output (Email)

{
  "title": "Meeting Follow-Up",
  "content": [
    { "id": "block-1", "type": "salutation", "content": "Dear Sarah," },
    { "id": "block-2", "type": "spacer" },
    { "id": "block-3", "type": "paragraph", "content": "Thank you for taking the time to meet with me earlier today. I wanted to follow up on the **key points** we discussed." },
    { "id": "block-4", "type": "paragraph", "content": "As mentioned, I will send over the proposal by *Friday* at the latest." },
    { "id": "block-5", "type": "spacer" },
    { "id": "block-6", "type": "closing", "content": "Best regards," },
    { "id": "block-7", "type": "paragraph", "content": "John Doe" }
  ]
}

## Example Output (Report)

{
  "title": "Q3 Sales Analysis",
  "content": [
    { "id": "block-1", "type": "heading", "level": 1, "content": "Q3 Sales Analysis Report" },
    { "id": "block-2", "type": "spacer" },
    { "id": "block-3", "type": "heading", "level": 2, "content": "Executive Summary" },
    { "id": "block-4", "type": "paragraph", "content": "This report analyzes **Q3 performance** across all regions." },
    { "id": "block-5", "type": "spacer" },
    { "id": "block-6", "type": "heading", "level": 2, "content": "Key Findings" },
    { "id": "block-7", "type": "list", "style": "unordered", "items": ["Revenue increased by 15%", "Customer acquisition up 22%", "Churn rate decreased to 3.2%"] }
  ]
}`;

const DOCUMENT_TYPE_INSTRUCTIONS: Record<DocumentType, string> = {
  email: `
## Document Type: Email
Structure your response as an email:
- Start with a salutation block (e.g., "Dear [Name]," or "Hi [Name],")
- Add a spacer after salutation
- Write body paragraphs (keep them concise and scannable)
- Add a spacer before closing
- End with a closing block (e.g., "Best regards," "Thanks," "Sincerely,")
- Add sender name as final paragraph`,

  letter: `
## Document Type: Formal Letter
Structure your response as a formal letter:
- Start with a salutation block (e.g., "Dear Mr./Ms. [Name],")
- Add spacer after salutation
- Write formal body paragraphs
- Add spacer before closing
- End with a closing block (e.g., "Sincerely," "Respectfully,")
- Add sender name and title as final paragraphs`,

  memo: `
## Document Type: Memo
Structure your response as an internal memo:
- Start with heading block for "MEMORANDUM" or memo title
- Include TO, FROM, DATE, RE fields as separate paragraphs
- Add spacer before body
- Write clear, direct body paragraphs
- Use lists for action items or key points`,

  report: `
## Document Type: Report
Structure your response as a formal report:
- Use heading level 1 for report title
- Use heading level 2 for major sections (Executive Summary, Findings, etc.)
- Use heading level 3 for subsections
- Use paragraphs for analysis and discussion
- Use lists for data points, recommendations, or findings
- Add spacers between major sections`,

  proposal: `
## Document Type: Proposal
Structure your response as a business proposal:
- Use heading level 1 for proposal title
- Include sections: Executive Summary, Problem Statement, Proposed Solution, Timeline, Budget, Conclusion
- Use heading level 2 for each section
- Use lists for deliverables, milestones, and pricing
- Keep paragraphs persuasive but professional`,

  contract: `
## Document Type: Contract/Agreement
Structure your response as a legal document:
- Use heading level 1 for agreement title
- Use clause blocks for each contractual clause
- Number clauses clearly in titles (e.g., "1. Definitions", "2. Scope of Work")
- Use precise, unambiguous language
- Include standard sections: Parties, Terms, Obligations, Termination, Governing Law`,

  policy: `
## Document Type: Policy Document
Structure your response as an organizational policy:
- Use heading level 1 for policy title
- Include sections: Purpose, Scope, Policy Statement, Procedures, Responsibilities
- Use heading level 2 for each section
- Use lists for procedures and requirements
- Keep language clear and actionable`,

  "job-description": `
## Document Type: Job Description
Structure your response as a job posting:
- Use heading level 1 for job title
- Include sections: About the Role, Responsibilities, Requirements, Nice-to-Haves, Benefits
- Use heading level 2 for each section
- Use unordered lists for responsibilities and requirements
- Keep tone engaging but professional`,

  article: `
## Document Type: Article/Blog Post
Structure your response as an article:
- Use heading level 1 for article title
- Use heading level 2 for major sections
- Write engaging opening paragraph to hook readers
- Use paragraphs for main content
- Use lists sparingly for key takeaways
- End with a conclusion or call-to-action paragraph`,

  "press-release": `
## Document Type: Press Release
Structure your response as a press release:
- Use heading level 1 for headline
- Start with dateline and lead paragraph (who, what, when, where, why)
- Use paragraphs for body content
- Include a quote block as a paragraph with attribution
- End with boilerplate "About [Company]" section
- Add contact information paragraph`,

  "social-post": `
## Document Type: Social Media Content
Structure your response for social media:
- Use heading level 2 for platform name if multiple posts
- Keep paragraphs short and punchy
- Use lists for thread-style content
- Front-load the hook
- End with call-to-action paragraph`,

  "lesson-plan": `
## Document Type: Lesson Plan
Structure your response as an educational lesson plan:
- Use heading level 1 for lesson title
- Include sections: Objectives, Materials, Introduction, Activities, Assessment, Wrap-up
- Use heading level 2 for each section
- Use lists for objectives, materials, and steps
- Include timing notes in paragraphs`,

  "technical-doc": `
## Document Type: Technical Documentation
Structure your response as technical documentation:
- Use heading level 1 for document title
- Use heading level 2 for major sections (Overview, Prerequisites, Steps, Troubleshooting)
- Use heading level 3 for subsections
- Use ordered lists for step-by-step instructions
- Use unordered lists for options or notes
- Keep paragraphs concise and task-oriented`,

  other: `
## Document Type: General Document
Structure your response appropriately:
- Use heading level 1 for main title
- Use heading level 2 for sections
- Use paragraphs for body content
- Use lists where appropriate
- Add spacers between major sections`,
};

/**
 * Step 1 — Classify: if no skill was provided, use a cheap/fast LLM call
 * to pick the best-matching skill from the registry. Also classify the
 * document type for formatting guidance.
 */
const classifyStep = createStep({
  id: "classify",
  inputSchema: z.object({
    query: z.string(),
    skillId: z.string().optional(),
    customPrompt: z.string().nullable().optional(),
  }),
  outputSchema: z.object({
    query: z.string(),
    skillId: z.string(),
    customPrompt: z.string().nullable(),
    documentType: z.string(),
  }),
  execute: async ({ inputData }) => {
    const customPrompt = inputData.customPrompt ?? null;

    // Classify document type (keyword-first, LLM fallback)
    const documentType = await classifyDocumentType(inputData.query);

    if (inputData.skillId) {
      const isCustom = inputData.skillId.startsWith("custom-");
      const match = isCustom ? null : getSkillById(inputData.skillId);
      return {
        query: inputData.query,
        skillId: isCustom ? inputData.skillId : (match ? match.id : "creative-writer"),
        customPrompt,
        documentType,
      };
    }

    const catalog = skills
      .map((s) => `- ${s.id}: ${s.description}`)
      .join("\n");

    const classifier = new Agent({
      id: "skillClassifier",
      name: "Skill Classifier",
      instructions: `You are a routing classifier. Given a user's document request, pick the single best skill from the list below.
Respond with ONLY the skill id (e.g. "lawyer"). No explanation, no quotes, no punctuation — just the id.

Skills:
${catalog}`,
      model: groq("llama-3.1-8b-instant"),
    });

    const res = await classifier.generate(inputData.query);
    const picked = res.text.trim().toLowerCase().replace(/[^a-z-]/g, "");
    const valid = getSkillById(picked);

    return {
      query: inputData.query,
      skillId: valid ? valid.id : "creative-writer",
      customPrompt,
      documentType,
    };
  },
});

/**
 * Step 2 — Search: fetch web sources via SerpAPI.
 */
const searchStep = createStep({
  id: "search",
  inputSchema: z.object({
    query: z.string(),
    skillId: z.string(),
    customPrompt: z.string().nullable(),
    documentType: z.string(),
  }),
  outputSchema: z.object({
    query: z.string(),
    skillId: z.string(),
    customPrompt: z.string().nullable(),
    documentType: z.string(),
    results: z.array(serpResultSchema),
  }),
  execute: async ({ inputData }) => {
    const executeSerpTool = serpTool.execute;
    if (!executeSerpTool) throw new Error("serpTool.execute is not defined.");

    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await executeSerpTool({ query: inputData.query }, {} as never);
        if ("results" in res) {
          return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, documentType: inputData.documentType, results: res.results };
        }
        return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, documentType: inputData.documentType, results: [] };
      } catch (err) {
        if (attempt === MAX_RETRIES) {
          console.error(`[search] All ${MAX_RETRIES + 1} attempts failed for "${inputData.query}":`, err);
          return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, documentType: inputData.documentType, results: [] };
        }
        const delay = 1000 * (attempt + 1);
        console.warn(`[search] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, documentType: inputData.documentType, results: [] };
  },
});

/**
 * Step 3 — Generate: build a skill-aware agent on the fly and stream
 * the document. Only the matched skill's system prompt is injected,
 * keeping the context window lean. Document type instructions are
 * added to guide formatting.
 */
const generateStep = createStep({
  id: "generate",
  inputSchema: z.object({
    query: z.string(),
    skillId: z.string(),
    customPrompt: z.string().nullable(),
    documentType: z.string(),
    results: z.array(serpResultSchema),
  }),
  outputSchema: z.object({
    title: z.string(),
    markdown: z.string(),
    sources: z.array(serpResultSchema),
    skillId: z.string(),
  }),
  execute: async ({ inputData, writer }) => {
    let skillBlock = "";

    if (inputData.customPrompt) {
      skillBlock = `\n\n## Specialist Mode: Custom\n${inputData.customPrompt}`;
    } else {
      const skill = getSkillById(inputData.skillId);
      if (skill) {
        skillBlock = `\n\n## Specialist Mode: ${skill.name}\n${skill.systemPrompt}`;
      }
    }

    // Add document type specific formatting instructions
    const docType = inputData.documentType as DocumentType;
    const docTypeInstructions = DOCUMENT_TYPE_INSTRUCTIONS[docType] || DOCUMENT_TYPE_INSTRUCTIONS.other;

    const agent = new Agent({
      id: "documentAgent",
      name: "Document Agent",
      instructions: `${BASE_INSTRUCTIONS}${docTypeInstructions}${skillBlock}`,
      model: groq("llama-3.3-70b-versatile"),
    });

    const sourcesBlock = inputData.results
      .map(
        (result, index) =>
          `Source ${index + 1}: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}`
      )
      .join("\n\n");

    const userPrompt = inputData.results.length > 0
      ? `${inputData.query}\n\n---\nBACKGROUND CONTEXT (for your reference only - do NOT include these as references or citations in the document):\n${sourcesBlock}`
      : inputData.query;

    const response = await agent.stream(userPrompt);

    await readTextStream(response.textStream, async (token) => {
      await writer.custom({
        type: "data-document-token",
        data: { token },
      });
    });

    const fullOutput = await response.getFullOutput();
    const rawText = stripJsonFences(fullOutput.text);

    let jsonObj: unknown;
    try {
      jsonObj = JSON.parse(rawText);
    } catch (parseError) {
      console.warn("[generate] First JSON parse failed, retrying generation once...");
      
      // Retry generation once on parse failure
      const retryResponse = await agent.stream(userPrompt);
      let retryTokens = "";
      for await (const token of retryResponse.textStream) {
        retryTokens += token;
      }
      const retryText = stripJsonFences(retryTokens);
      
      try {
        jsonObj = JSON.parse(retryText);
      } catch {
        console.error("[generate] Retry also failed. Raw text (first 500 chars):", retryText.slice(0, 500));
        jsonObj = { title: "Generated Document", markdown: rawText };
      }
    }

    const parsed = parseDocumentResult(jsonObj);
    const markdown = blocksToMarkdown(parsed.content);
    const finalResult = {
      title: parsed.title,
      markdown,
      sources: inputData.results,
      skillId: inputData.skillId,
    };

    await writer.custom({
      type: "data-document-result",
      data: finalResult,
    });

    return finalResult;
  },
});

export const documentWorkflow = createWorkflow({
  id: "document-workflow",
  inputSchema: z.object({
    query: z.string(),
    skillId: z.string().optional(),
    customPrompt: z.string().nullable().optional(),
  }),
  outputSchema: z.object({
    title: z.string(),
    markdown: z.string(),
    sources: z.array(serpResultSchema),
    skillId: z.string(),
  }),
})
  .then(classifyStep)
  .then(searchStep)
  .then(generateStep)
  .commit();
