import { useState, useRef, useEffect, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/context/ChatContext";
import { SkillSelector } from "@/components/ai/SkillSelector";

type FloatingChatBarProps = {
  isOpen?: boolean;
  onOpen: () => void;
};

const HINTS = [
  { text: "Press", kbd: "⌘D", suffix: "to open chat" },
  { text: "Start writing today", kbd: null, suffix: null },
  { text: "Select a skill to get started", kbd: null, suffix: null },
  { text: "Ask anything about your document", kbd: null, suffix: null },
];

export function FloatingChatBar({ isOpen = false, onOpen }: FloatingChatBarProps) {
  const { sendMessage, isLoading, selectedSkillId, setSelectedSkillId } = useChat();
  const [value, setValue] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (isOpen) {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setHintIndex((i) => (i + 1) % HINTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onOpen();
    setValue("");
    await sendMessage(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      form?.requestSubmit();
    }
  }

  const showHint = !isFocused && value.length === 0;
  const hint = HINTS[hintIndex];

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-6 left-1/2 z-40 w-[520px] -translate-x-1/2 rounded-xl bg-canvas-elevated overflow-hidden"
      style={{ boxShadow: "var(--shadow-lg), var(--shadow-accent)" }}
    >
      <div className="relative flex items-center gap-3 px-4 py-3">
        <div className="flex-1 relative" style={{ minHeight: 22 }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
            className="w-full bg-transparent text-sm text-content-primary outline-none resize-none font-sans relative z-10"
            style={{ minHeight: 22, maxHeight: 120 }}
          />

          {showHint && (
            <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={hintIndex}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-sm text-content-tertiary font-sans flex items-center gap-1.5"
                >
                  {hint.kbd ? (
                    <>
                      <span>{hint.text}</span>
                      <kbd className="inline-flex items-center gap-0.5 rounded bg-canvas-hover px-1.5 py-0.5 text-[11px] font-medium text-content-secondary font-mono">
                        {hint.kbd}
                      </kbd>
                      <span>{hint.suffix}</span>
                    </>
                  ) : (
                    <span>{hint.text}</span>
                  )}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || value.trim().length === 0}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-accent text-content-inverse transition hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Send"
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
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      </div>
      <div className="flex items-center px-3 pb-2">
        <SkillSelector
          selectedSkillId={selectedSkillId}
          onSelect={setSelectedSkillId}
        />
      </div>
    </form>
  );
}
