export async function readTextStream(
  stream: AsyncIterable<string> | ReadableStream<string>,
  onToken: (token: string) => Promise<void>
): Promise<void> {
  if (Symbol.asyncIterator in stream) {
    for await (const chunk of stream) {
      if (chunk) await onToken(chunk);
    }
    return;
  }
  const reader = (stream as ReadableStream<string>).getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) await onToken(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export function stripJsonFences(value: string): string {
  const cleaned = value.replace(/```json|```/g, "").trim();
  return extractJsonObject(cleaned);
}

/**
 * Extract the first complete JSON object from a string. The LLM sometimes
 * appends trailing commentary after the closing brace which breaks
 * JSON.parse. This finds the matching `{}` pair using brace counting,
 * accounting for strings.
 */
function extractJsonObject(value: string): string {
  const start = value.indexOf("{");
  if (start === -1) return value;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i++) {
    const ch = value[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return value.slice(start, i + 1);
    }
  }

  return value.slice(start);
}
