import { useState, useRef, useEffect, type FormEvent } from "react";
import { useChat } from "@/context/ChatContext";

type FloatingChatBarProps = {
  onOpen: () => void;
};

export function FloatingChatBar({ onOpen }: FloatingChatBarProps) {
  const { sendMessage, isLoading } = useChat();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-6 left-1/2 z-40 flex w-[520px] -translate-x-1/2 items-center gap-3 rounded-xl bg-canvas-elevated px-4 py-3"
      style={{ boxShadow: "var(--shadow-lg), var(--shadow-accent)" }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Cursor for Word..."
        rows={1}
        className="flex-1 bg-transparent text-sm text-content-primary outline-none placeholder:text-content-tertiary resize-none font-sans"
        style={{ minHeight: 22, maxHeight: 120 }}
      />
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
    </form>
  );
}
