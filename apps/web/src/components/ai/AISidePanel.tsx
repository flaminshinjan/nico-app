import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DocCard } from "@/components/ai/DocCard";
import { SkillSelector } from "@/components/ai/SkillSelector";
import { useChat } from "@/context/ChatContext";
import { useDocumentEditor } from "@/context/DocumentEditorContext";
import { DocPreviewModal } from "@/components/ai/DocPreviewModal";
import { SourcesCard } from "@/components/ai/SourcesCard";
import { StepsTracker } from "@/components/ai/StepsTracker";
import type { AssistantMessage } from "@/context/ChatContext";
import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";
import aiEmptyImg from "../../../assets/empty_states/ai_empty.png";

function isAssistantMessageLoading(message: AssistantMessage) {
  return (
    message.steps.some((step) => step.status === "active") ||
    message.steps[message.steps.length - 1]?.status !== "done"
  );
}

function StreamingPreview({ content }: { content: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [content]);
  return (
    <div
      ref={scrollRef}
      className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-canvas-base p-3 font-mono text-[11px] text-accent"
    >
      {content}
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="shake flex items-start gap-2 rounded-md p-3"
      style={{
        background: "rgba(248,113,113,0.08)",
        
      }}
    >
      <span className="text-accent-error text-sm flex-shrink-0 mt-px">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-accent-error leading-snug">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 text-[11px] px-2 py-0.5 rounded-sm text-accent-error hover:bg-accent-error/10 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

type AISidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AISidePanel({ isOpen, onClose }: AISidePanelProps) {
  const { messages, sendMessage, isLoading, selectedSkillId, setSelectedSkillId } = useChat();

  if (!isOpen) {
    return null;
  }
  const { embedGeneratedContent } = useDocumentEditor();
  const [inputValue, setInputValue] = useState("");
  const [previewDoc, setPreviewDoc] = useState<GeneratedDoc | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastEmbeddedRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const last = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.doc) as
      | AssistantMessage
      | undefined;
    if (last?.doc && lastEmbeddedRef.current !== last.id) {
      lastEmbeddedRef.current = last.id;
      void embedGeneratedContent(last.doc, last.sources);
    }
  }, [messages, embedGeneratedContent]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [inputValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    setInputValue("");
    await sendMessage(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      form?.requestSubmit();
    }
  }

  function getLastUserContent(): string | null {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return lastUser?.content ?? null;
  }

  return (
    <>
      <div className="w-[340px] flex-shrink-0 flex flex-col bg-canvas-elevated rounded-2xl overflow-hidden h-full shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-[52px] shrink-0">
          <div className="pulse-dot" />
          <span className="text-sm font-semibold text-content-primary flex-1">
            Cursor for Word
          </span>
          <button
            type="button"
            className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
            aria-label="Info"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
            aria-label="Close panel"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-2 select-none">
              <motion.img
                src={aiEmptyImg}
                alt="Write with AI"
                className="w-90 h-90 object-contain opacity-95"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.85 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                draggable={false}
              />
              <motion.div
                className="mt-4 text-center"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <p className="text-[15px] font-semibold text-content-primary font-serif">
                  Your words, amplified.
                </p>
                <p className="mt-1.5 text-[12px] text-content-tertiary leading-relaxed max-w-[220px] mx-auto">
                  Pick a skill, ask a question, and let AI craft polished documents in seconds.
                </p>
              </motion.div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div
                    className="max-w-[90%] rounded-lg px-3.5 py-2.5 text-[13.5px] leading-relaxed text-content-primary bg-bubble-user"
                    style={{ borderBottomRightRadius: 4 }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex max-w-[90%] flex-col gap-3 self-start">
                    <StepsTracker steps={msg.steps} />

                    {msg.sources.length > 0 && (
                      <SourcesCard sources={msg.sources} />
                    )}

                    {msg.content &&
                      !msg.doc &&
                      isAssistantMessageLoading(msg) && (
                        <StreamingPreview content={msg.content} />
                      )}

                    {msg.doc && (
                      <DocCard
                        doc={msg.doc}
                        onClick={() => msg.doc && setPreviewDoc(msg.doc)}
                      />
                    )}

                    {msg.content &&
                      !msg.doc &&
                      !isAssistantMessageLoading(msg) && (
                        <ErrorCard
                          message={msg.content}
                          onRetry={() => {
                            const lastContent = getLastUserContent();
                            if (lastContent) void sendMessage(lastContent);
                          }}
                        />
                      )}
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="dot-loader flex items-center gap-1 pl-5 pt-1">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-3 py-2.5 shrink-0"
        >
          <div className="rounded-lg border border-line bg-transparent focus-within:border-accent transition-all">
            <div className="flex items-center gap-2 px-3 py-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Cursor for Word..."
                rows={1}
                className="flex-1 bg-transparent text-[13px] leading-[20px] text-content-primary outline-none placeholder:text-content-tertiary resize-none font-sans"
                style={{ minHeight: 20, maxHeight: 160 }}
              />
              <button
                type="submit"
                disabled={isLoading || inputValue.trim().length === 0}
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-accent text-content-inverse transition hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <svg
                  className="w-[15px] h-[15px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center px-2 pb-1.5">
              <SkillSelector
                selectedSkillId={selectedSkillId}
                onSelect={setSelectedSkillId}
              />
            </div>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {previewDoc && (
          <DocPreviewModal
            doc={previewDoc}
            onClose={() => setPreviewDoc(null)}
            onEmbed={() => previewDoc && embedGeneratedContent(previewDoc)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
