import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Legacy references kept during the Mastra migration:
// import { generateDocument } from "@/hooks/useDocumentGenerate";
// import { planSearchQueries } from "@/hooks/useSearchPlanner";
// import { searchWebQueries } from "@/hooks/useSerpSearch";
import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";
import type { SerpResult } from "@/hooks/useSerpSearch";

type StepStatus = "pending" | "active" | "done";

type Step = {
  id: string;
  label: string;
  status: StepStatus;
};

type UserMessage = {
  id: string;
  role: "user";
  content: string;
};

type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
  steps: Step[];
  sources: SerpResult[];
  doc?: GeneratedDoc;
};

type Message = UserMessage | AssistantMessage;

type ChatContextValue = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function getInitialSteps(): Step[] {
  return [
    { id: "1", label: "Evaluating prompt", status: "active" },
    { id: "2", label: "Searching the web", status: "pending" },
    { id: "3", label: "Generating document", status: "pending" },
  ];
}

function markSearchStepActive(steps: Step[]): Step[] {
  return steps.map((step): Step => {
    if (step.id === "1") {
      return { ...step, status: "done" };
    }

    if (step.id === "2") {
      return { ...step, status: "active" };
    }

    return step;
  });
}

function markGenerateStepActive(steps: Step[]): Step[] {
  return steps.map((step): Step => {
    if (step.id === "2") {
      return { ...step, status: "done" };
    }

    if (step.id === "3") {
      return { ...step, status: "active" };
    }

    return step;
  });
}

function markAllStepsDone(steps: Step[]): Step[] {
  return steps.map((step): Step => ({ ...step, status: "done" }));
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function splitJsonRecords(value: string) {
  return value
    .split("\u001e")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

type WorkflowStreamChunk =
  | {
      type: "data-document-token";
      data: { token: string };
    }
  | {
      type: "data-document-result";
      data: DocumentWorkflowResult;
    }
  | {
      type: string;
      data?: unknown;
    };

type DocumentWorkflowResult = {
  title: string;
  markdown: string;
  sources: SerpResult[];
};

function isDocumentTokenChunk(chunk: WorkflowStreamChunk): chunk is {
  type: "data-document-token";
  data: { token: string };
} {
  return (
    chunk.type === "data-document-token" &&
    typeof chunk.data === "object" &&
    chunk.data !== null &&
    "token" in chunk.data &&
    typeof chunk.data.token === "string"
  );
}

function isDocumentResultChunk(chunk: WorkflowStreamChunk): chunk is {
  type: "data-document-result";
  data: DocumentWorkflowResult;
} {
  return (
    chunk.type === "data-document-result" &&
    typeof chunk.data === "object" &&
    chunk.data !== null &&
    "title" in chunk.data &&
    "markdown" in chunk.data &&
    "sources" in chunk.data &&
    typeof chunk.data.title === "string" &&
    typeof chunk.data.markdown === "string" &&
    Array.isArray(chunk.data.sources)
  );
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateAssistantMessage = useCallback(
    (id: string, patch: Partial<AssistantMessage>) => {
      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === id && message.role === "assistant"
            ? { ...message, ...patch }
            : message
        )
      );
    },
    []
  );

  const appendAssistantToken = useCallback((id: string, token: string) => {
    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        message.id === id && message.role === "assistant"
          ? { ...message, content: message.content + token }
          : message
      )
    );
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    const userMessage: UserMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedContent,
    };
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: AssistantMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      steps: getInitialSteps(),
      sources: [],
    };

    setIsLoading(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);

    try {
      await wait(600);

      updateAssistantMessage(assistantMessageId, {
        steps: markSearchStepActive(getInitialSteps()),
      });

      const runResponse = await fetch("/api/mastra/workflows/documentWorkflow/create-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!runResponse.ok) {
        throw new Error(
          `Mastra workflow run creation failed with ${runResponse.status} ${runResponse.statusText}`
        );
      }

      const runData = (await runResponse.json()) as { runId?: string };
      if (!runData.runId) {
        throw new Error("Mastra workflow run creation did not return a runId.");
      }

      const workflowRequest = fetch(
        `/api/mastra/workflows/documentWorkflow/stream?runId=${encodeURIComponent(runData.runId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputData: {
              query: trimmedContent,
            },
          }),
        }
      );

      await wait(400);

      updateAssistantMessage(assistantMessageId, {
        steps: markGenerateStepActive(markSearchStepActive(getInitialSteps())),
      });

      const response = await workflowRequest;
      if (!response.ok) {
        throw new Error(
          `Mastra workflow request failed with ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("Mastra workflow stream response body was missing.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let bufferedText = "";
      let finalResult: DocumentWorkflowResult | null = null;

      while (true) {
        const { done, value } = await reader.read();
        bufferedText += decoder.decode(value, { stream: !done });

        const records = splitJsonRecords(bufferedText);
        bufferedText = bufferedText.endsWith("\u001e") ? "" : records.pop() ?? "";

        for (const record of records) {
          const chunk = JSON.parse(record) as WorkflowStreamChunk;

          if (isDocumentTokenChunk(chunk)) {
            appendAssistantToken(assistantMessageId, chunk.data.token);
          }

          if (isDocumentResultChunk(chunk)) {
            finalResult = chunk.data;
          }
        }

        if (done) {
          break;
        }
      }

      const trailingRecords = splitJsonRecords(bufferedText);
      for (const record of trailingRecords) {
        const chunk = JSON.parse(record) as WorkflowStreamChunk;

        if (isDocumentTokenChunk(chunk)) {
          appendAssistantToken(assistantMessageId, chunk.data.token);
        }

        if (isDocumentResultChunk(chunk)) {
          finalResult = chunk.data;
        }
      }

      if (!finalResult) {
        throw new Error("Mastra workflow stream completed without a final document result.");
      }

      const generatedDoc: GeneratedDoc = {
        title: finalResult.title,
        markdown: finalResult.markdown,
      };

      updateAssistantMessage(assistantMessageId, {
        sources: finalResult.sources,
        doc: generatedDoc,
        steps: markAllStepsDone(markGenerateStepActive(markSearchStepActive(getInitialSteps()))),
      });
    } catch (error: unknown) {
      console.error("Document generation failed.", error);
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessageId && message.role === "assistant"
            ? {
                ...message,
                content: "Something went wrong. Please try again.",
                steps: markAllStepsDone(message.steps),
              }
            : message
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [appendAssistantToken, updateAssistantMessage]);

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      isLoading,
      sendMessage,
    }),
    [isLoading, messages, sendMessage]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
}

export type {
  AssistantMessage,
  ChatContextValue,
  GeneratedDoc,
  Message,
  Step,
  StepStatus,
  UserMessage,
};
