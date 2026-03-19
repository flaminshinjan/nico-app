// Legacy reference kept during the Mastra migration. ChatContext now calls the
// documentWorkflow over HTTP instead of using this direct frontend pipeline.
import type { SerpResult } from "@/hooks/useSerpSearch";
import { parseJsonResponseText, streamGroqChatCompletion } from "@/utils/groq";

export type GeneratedDoc = {
  title: string;
  markdown: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGeneratedDoc(value: unknown): value is GeneratedDoc {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.markdown === "string"
  );
}

function buildSourcesBlock(sources: SerpResult[]) {
  return sources
    .map(
      (source, index) =>
        `Source ${index + 1}: ${source.title}\nURL: ${source.url}\nSnippet: ${source.snippet}`
    )
    .join("\n\n");
}

function parseGeneratedDocResponse(value: string): unknown {
  return parseJsonResponseText(value);
}

export async function generateDocument(
  query: string,
  sources: SerpResult[],
  onToken: (token: string) => void
): Promise<GeneratedDoc> {
  const sourcesBlock = buildSourcesBlock(sources);
  const accumulatedText = await streamGroqChatCompletion(
    {
      model: "llama-3.3-70b-versatile",
      max_tokens: 2048,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            'You generate the final document the user asked for. Always respond with valid JSON only. No markdown fences, no preamble. JSON shape: { "title": string, "markdown": string }. Write the actual deliverable, not advice about how to write it. Match the requested format and tone exactly. If the user asks for an email, message, note, or invitation, output that artifact directly and do not add generic headings like Introduction, Body, or Sources unless the user explicitly asked for them. Use sources only when they are provided and materially useful. If no sources are provided, do not invent facts or include a Sources section.',
        },
        {
          role: "user",
          content: sourcesBlock
            ? `${query}\n\nUse these sources only if they help with factual grounding:\n${sourcesBlock}`
            : `${query}\n\nNo external sources are provided. Produce the requested document directly.`,
        },
      ],
    },
    onToken
  );

  const parsed: unknown = parseGeneratedDocResponse(accumulatedText);
  if (!isGeneratedDoc(parsed)) {
    throw new Error("Groq JSON output did not match GeneratedDoc.");
  }

  return parsed;
}
