type SerpSource = {
  title: string;
  url: string;
  snippet: string;
};

export function buildDocumentGenerationPrompt(
  query: string,
  sources: SerpSource[]
): string {
  const instructions = [
    "You are writing the final deliverable requested by the user.",
    "Do the task directly. Do not explain how to write it.",
    "Do not include headings like Introduction, Body, or Sources unless the user explicitly asked for them.",
    "Match the requested format and tone exactly.",
    "If the request is an email, message, letter, note, or invitation, output that artifact directly in natural language.",
    'Return valid JSON only with shape { "title": string, "markdown": string }.',
  ];

  if (sources.length === 0) {
    instructions.push(
      "No external sources are provided or needed. Do not invent citations or add a Sources section."
    );
  } else {
    instructions.push(
      "Use the provided sources only for factual grounding where they are genuinely helpful."
    );
    instructions.push(
      "Only include a Sources section if the request benefits from citations or references."
    );
  }

  const sourceBlock =
    sources.length === 0
      ? "Sources: none"
      : [
          "Sources:",
          ...sources.map(
            (source, index) =>
              `${index + 1}. ${source.title}\nURL: ${source.url}\nSnippet: ${source.snippet}`
          ),
        ].join("\n\n");

  return `${instructions.join("\n")}\n\nUser request:\n${query}\n\n${sourceBlock}`;
}
