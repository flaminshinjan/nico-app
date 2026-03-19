import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { documentAgent } from "../agents/documentAgent";
import { serpTool } from "../tools/serpTool";
import { buildDocumentGenerationPrompt } from "../utils/documentPrompt";
import { serpResultSchema } from "../utils/serp";

const documentResultSchema = z.object({
  title: z.string(),
  markdown: z.string(),
});

const workflowStageSchema = z.object({
  stage: z.enum(["evaluating", "searching", "generating"]),
});

function stripJsonFences(value: string) {
  return value.replace(/```json|```/g, "").trim();
}

async function readTextStream(
  stream: ReadableStream<string>,
  onToken: (token: string) => Promise<void>
) {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (value) {
        await onToken(value);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

const searchStep = createStep({
  id: "search",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({
    query: z.string(),
    results: z.array(serpResultSchema),
  }),
  execute: async ({ inputData, writer }) => {
    await writer.custom({
      type: "data-workflow-stage",
      data: workflowStageSchema.parse({ stage: "searching" }),
    });

    const executeSerpTool = serpTool.execute;
    if (!executeSerpTool) {
      throw new Error("serpTool.execute is not defined.");
    }

    const { results } = await executeSerpTool({ query: inputData.query }, {});
    return { query: inputData.query, results };
  },
});

const generateStep = createStep({
  id: "generate",
  inputSchema: z.object({
    query: z.string(),
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

    const response = await documentAgent.stream(
      buildDocumentGenerationPrompt(inputData.query, inputData.results)
    );

    await readTextStream(response.textStream, async (token) => {
      await writer.custom({
        type: "data-document-token",
        data: { token },
      });
    });

    const fullOutput = await response.getFullOutput();
<<<<<<< HEAD
    const rawText = stripJsonFences(fullOutput.text);

    let jsonObj: unknown;
    try {
      jsonObj = JSON.parse(rawText);
    } catch {
      console.error("[generate] Failed to parse LLM output as JSON. Raw text (first 500 chars):", rawText.slice(0, 500));
      jsonObj = { title: "Generated Document", markdown: rawText };
    }

    const parsed = documentResultSchema.parse(jsonObj);
=======
    const parsed = documentResultSchema.parse(JSON.parse(stripJsonFences(fullOutput.text)));
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
    const finalResult = {
      title: parsed.title,
      markdown: parsed.markdown,
      sources: inputData.results,
<<<<<<< HEAD
      skillId: inputData.skillId,
=======
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
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
<<<<<<< HEAD
  inputSchema: z.object({
    query: z.string(),
    skillId: z.string().optional(),
    customPrompt: z.string().nullable().optional(),
  }),
=======
  inputSchema: z.object({ query: z.string() }),
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
  outputSchema: z.object({
    title: z.string(),
    markdown: z.string(),
    sources: z.array(serpResultSchema),
<<<<<<< HEAD
    skillId: z.string(),
  }),
})
  .then(classifyStep)
=======
  }),
})
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
  .then(searchStep)
  .then(generateStep)
  .commit();
