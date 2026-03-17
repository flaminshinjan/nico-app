import { groq } from "@ai-sdk/groq";
import { Agent } from "@mastra/core/agent";
import { serpTool } from "../tools";

export const documentAgent = new Agent({
  id: "documentAgent",
  name: "Document Agent",
  instructions: `You are a document drafting assistant.
When given a user request:
1. Use the serp-search tool to find relevant web sources
2. Use the sources as background context to draft a comprehensive document
3. Respond ONLY with valid JSON - no markdown fences, no preamble
JSON shape: { "title": string, "markdown": string }
The markdown field must be a fully structured document with headings and bullet points.

IMPORTANT: Do NOT include a "Sources", "References", or "Citations" section in the document.
The sources are for your background knowledge only - write naturally as if you already knew the information.`,
  model: groq("llama-3.3-70b-versatile"),
  tools: { serpTool },
});
