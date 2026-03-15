import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { documentAgent } from "../agents/documentAgent";
import { serpTool } from "../tools/serpTool";

const serpResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  favicon: z.string().optional(),
  displayed_link: z.string().optional(),
});

const documentResultSchema = z.object({
  title: z.string(),
  markdown: z.string(),
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
  execute: async ({ inputData }) => {
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
    const sourcesBlock = inputData.results
      .map(
        (result, index) =>
          `Source ${index + 1}: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}`
      )
      .join("\n\n");

    const response = await documentAgent.stream(
      `${inputData.query}\n\nSources:\n${sourcesBlock}`
    );

    await readTextStream(response.textStream, async (token) => {
      await writer.custom({
        type: "data-document-token",
        data: { token },
      });
    });

    const fullOutput = await response.getFullOutput();
    const parsed = documentResultSchema.parse(JSON.parse(stripJsonFences(fullOutput.text)));
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
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({
    title: z.string(),
    markdown: z.string(),
    sources: z.array(serpResultSchema),
  }),
})
  .then(searchStep)
  .then(generateStep)
  .commit();
