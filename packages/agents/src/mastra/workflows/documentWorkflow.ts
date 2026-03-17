import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { groq } from "@ai-sdk/groq";
import { Agent } from "@mastra/core/agent";
import { serpTool } from "../tools";
import { documentResultSchema, serpResultSchema } from "../schemas";
import { getSkillById, skills } from "../skills";
import { readTextStream, stripJsonFences } from "../lib/stream";

const workflowStageSchema = z.object({
  stage: z.enum(["evaluating", "searching", "generating"]),
});

const BASE_INSTRUCTIONS = `You are a document drafting assistant.
When given a user request and web sources:
1. Use the sources as context to draft a comprehensive document
2. Respond ONLY with valid JSON - no markdown fences, no preamble
JSON shape: { "title": string, "markdown": string }
The markdown field must be a fully structured document with headings,
bullet points, and a Sources section at the end listing all URLs used.`;

/**
 * Step 1 — Classify: if no skill was provided, use a cheap/fast LLM call
 * to pick the best-matching skill from the registry. This keeps token
 * usage low by only sending the short skill list (ids + descriptions),
 * not the full system prompts.
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
  }),
  execute: async ({ inputData }) => {
    const customPrompt = inputData.customPrompt ?? null;

    if (inputData.skillId) {
      const isCustom = inputData.skillId.startsWith("custom-");
      const match = isCustom ? null : getSkillById(inputData.skillId);
      return {
        query: inputData.query,
        skillId: isCustom ? inputData.skillId : (match ? match.id : "creative-writer"),
        customPrompt,
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
  }),
  outputSchema: z.object({
    query: z.string(),
    skillId: z.string(),
    customPrompt: z.string().nullable(),
    results: z.array(serpResultSchema),
  }),
  execute: async ({ inputData, writer }) => {
    await writer.custom({
      type: "data-workflow-stage",
      data: workflowStageSchema.parse({ stage: "searching" }),
    });

    const executeSerpTool = serpTool.execute;
    if (!executeSerpTool) throw new Error("serpTool.execute is not defined.");

    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await executeSerpTool({ query: inputData.query }, {} as never);
        if ("results" in res) {
          return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, results: res.results };
        }
        return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, results: [] };
      } catch (err) {
        if (attempt === MAX_RETRIES) {
          console.error(`[search] All ${MAX_RETRIES + 1} attempts failed for "${inputData.query}":`, err);
          return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, results: [] };
        }
        const delay = 1000 * (attempt + 1);
        console.warn(`[search] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return { query: inputData.query, skillId: inputData.skillId, customPrompt: inputData.customPrompt, results: [] };
  },
});

/**
 * Step 3 — Generate: build a skill-aware agent on the fly and stream
 * the document. Only the matched skill's system prompt is injected,
 * keeping the context window lean.
 */
const generateStep = createStep({
  id: "generate",
  inputSchema: z.object({
    query: z.string(),
    skillId: z.string(),
    customPrompt: z.string().nullable(),
    results: z.array(serpResultSchema),
  }),
  outputSchema: z.object({
    title: z.string(),
    markdown: z.string(),
    sources: z.array(serpResultSchema),
  }),
  execute: async ({ inputData, writer }) => {
    await writer.custom({
      type: "data-workflow-stage",
      data: workflowStageSchema.parse({ stage: "generating" }),
    });

    let skillBlock = "";

    if (inputData.customPrompt) {
      skillBlock = `\n\nYou are operating in a custom specialist mode.\n${inputData.customPrompt}`;
    } else {
      const skill = getSkillById(inputData.skillId);
      if (skill) {
        skillBlock = `\n\nYou are operating in "${skill.name}" mode.\n${skill.systemPrompt}`;
      }
    }

    const agent = new Agent({
      id: "documentAgent",
      name: "Document Agent",
      instructions: `${BASE_INSTRUCTIONS}${skillBlock}`,
      model: groq("llama-3.3-70b-versatile"),
    });

    const sourcesBlock = inputData.results
      .map(
        (result, index) =>
          `Source ${index + 1}: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}`
      )
      .join("\n\n");

    const response = await agent.stream(
      `${inputData.query}\n\nSources:\n${sourcesBlock}`
    );

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
    } catch {
      console.error("[generate] Failed to parse LLM output as JSON. Raw text (first 500 chars):", rawText.slice(0, 500));
      jsonObj = { title: "Generated Document", markdown: rawText };
    }

    const parsed = documentResultSchema.parse(jsonObj);
    const finalResult = {
      title: parsed.title,
      markdown: parsed.markdown,
      sources: inputData.results,
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
  }),
})
  .then(classifyStep)
  .then(searchStep)
  .then(generateStep)
  .commit();
