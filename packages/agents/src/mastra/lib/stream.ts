export async function readTextStream(
  stream: ReadableStream<string>,
  onToken: (token: string) => Promise<void>
): Promise<void> {
  const reader = stream.getReader();
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
  return value.replace(/```json|```/g, "").trim();
}
