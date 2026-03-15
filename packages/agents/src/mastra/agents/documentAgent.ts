import { groq } from "@ai-sdk/groq";
import { Agent } from "@mastra/core/agent";
import { serpTool } from "../tools/serpTool";

export const documentAgent = new Agent({
  id: "documentAgent",
  name: "Document Agent",
  instructions: `You are a document drafting assistant.
When given a user request:
1. Use the serp-search tool to find 4 relevant web sources
2. Use the sources as context to draft a comprehensive document
3. Respond ONLY with valid JSON - no markdown fences, no preamble
JSON shape: { "title": string, "markdown": string }
The markdown field must be a fully structured document with headings,
bullet points, and a Sources section at the end listing all URLs used.`,
  model: groq("llama-3.3-70b-versatile"),
  tools: { serpTool },
});
