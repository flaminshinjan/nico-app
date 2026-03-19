import { groq } from "@ai-sdk/groq";
import { Agent } from "@mastra/core/agent";
<<<<<<< HEAD
import { serpTool } from "../tools";
=======
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843

export const documentAgent = new Agent({
  id: "documentAgent",
  name: "Document Agent",
  instructions: `You are a document drafting assistant.
<<<<<<< HEAD
When given a user request:
1. Use the serp-search tool to find 4 relevant web sources
2. Use the sources as context to draft a comprehensive document
3. Respond ONLY with valid JSON - no markdown fences, no preamble
JSON shape: { "title": string, "markdown": string }
The markdown field must be a fully structured document with headings,
bullet points, and a Sources section at the end listing all URLs used.`,
  model: groq("llama-3.3-70b-versatile"),
  tools: { serpTool },
=======
Write the final artifact the user asked for.
Do not explain the writing process.
Do not default to generic headings like Introduction, Body, or Sources.
Use sources only when they are supplied and actually useful.
For personal or casual writing tasks such as emails, notes, and invitations, produce the message directly without citations.
Respond ONLY with valid JSON - no markdown fences, no preamble.
JSON shape: { "title": string, "markdown": string }.`,
  model: groq("llama-3.3-70b-versatile"),
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
});
