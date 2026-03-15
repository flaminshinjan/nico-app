import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  generateDocument,
  type GeneratedDoc,
} from "@/hooks/useDocumentGenerate";
import { planSearchQueries } from "@/hooks/useSearchPlanner";
import { searchWebQueries, type SerpResult } from "@/hooks/useSerpSearch";

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

      const plannedSearch = await planSearchQueries(trimmedContent);
      if (import.meta.env.DEV) {
        console.log("final planned queries", plannedSearch.queries);
      }

      updateAssistantMessage(assistantMessageId, {
        steps: markSearchStepActive(getInitialSteps()),
      });

      const searchResults = await searchWebQueries(plannedSearch.queries);
      if (import.meta.env.DEV) {
        console.log("final attached source count", searchResults.length);
      }
      updateAssistantMessage(assistantMessageId, {
        sources: searchResults,
        steps: markGenerateStepActive(markSearchStepActive(getInitialSteps())),
      });

      await wait(400);

      const generatedDoc = await generateDocument(
        trimmedContent,
        searchResults,
        (token) => {
          appendAssistantToken(assistantMessageId, token);
        }
      );

      updateAssistantMessage(assistantMessageId, {
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
