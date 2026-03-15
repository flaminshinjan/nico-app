import { useEffect, useRef, useState, type FormEvent } from "react";

import { DocCard } from "@/components/ai/DocCard";
import { useChat } from "@/context/ChatContext";
import { useDocumentEditor } from "@/context/DocumentEditorContext";
import { DocPreviewModal } from "@/components/ai/DocPreviewModal";
import { SourcesCard } from "@/components/ai/SourcesCard";
import { StepsTracker } from "@/components/ai/StepsTracker";
import type { AssistantMessage } from "@/context/ChatContext";
import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";

function isAssistantMessageLoading(message: AssistantMessage) {
  const lastStep = message.steps[message.steps.length - 1];

  return (
    message.steps.some((step) => step.status === "active") ||
    lastStep?.status !== "done"
  );
}

function StreamingPreview({ content }: { content: string }) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [content]);

  return (
    <div
      ref={scrollContainerRef}
      className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-green-400"
    >
      {content}
    </div>
  );
}

type AISidePanelProps = {
  onClose: () => void;
};

export function AISidePanel({ onClose }: AISidePanelProps) {
  const { messages, sendMessage, isLoading } = useChat();
  const { embedGeneratedContent } = useDocumentEditor();
  const [inputValue, setInputValue] = useState("");
  const [previewDoc, setPreviewDoc] = useState<GeneratedDoc | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastEmbeddedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const lastAssistantWithDoc = [...messages].reverse().find(
      (m) => m.role === "assistant" && m.doc
    ) as AssistantMessage | undefined;
    if (
      lastAssistantWithDoc?.doc &&
      lastEmbeddedMessageIdRef.current !== lastAssistantWithDoc.id
    ) {
      lastEmbeddedMessageIdRef.current = lastAssistantWithDoc.id;
      void embedGeneratedContent(lastAssistantWithDoc.doc);
    }
  }, [messages, embedGeneratedContent]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isLoading) {
      return;
    }

    setInputValue("");
    await sendMessage(trimmedValue);
  }

  return (
    <div className="w-[400px] flex-shrink-0 flex flex-col bg-white border-l border-slate-200 rounded-l-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/80 rounded-tl-2xl">
        <span className="text-sm font-semibold text-slate-800">Cursor for Word</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Info"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <div className="text-center text-sm text-slate-400">
              Select text or start a conversation to get help
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-slate-800 px-3 py-2 text-sm text-white">
                  {msg.content}
                </div>
              ) : (
                <div className="flex max-w-[85%] flex-col gap-3 self-start">
                  <StepsTracker steps={msg.steps} />
                  {msg.sources && msg.sources.length > 0 ? (
                    <SourcesCard sources={msg.sources} />
                  ) : null}
                  {msg.content && !msg.doc && isAssistantMessageLoading(msg) ? (
                    <StreamingPreview content={msg.content} />
                  ) : null}
                  {msg.doc ? (
                    <DocCard
                      doc={msg.doc}
                      onClick={() => {
                        if (msg.doc) {
                          setPreviewDoc(msg.doc);
                        }
                      }}
                    />
                  ) : null}
                  {msg.content && !msg.doc && !isAssistantMessageLoading(msg) ? (
                    <div className="text-sm text-red-500">{msg.content}</div>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {previewDoc ? (
        <DocPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onEmbed={() => previewDoc && embedGeneratedContent(previewDoc)}
        />
      ) : null}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 bg-slate-50/80 px-4 py-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ask Cursor for Word..."
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={isLoading || inputValue.trim().length === 0}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
