import { useState, type FormEvent } from "react";
import { useChat } from "@/context/ChatContext";

type FloatingChatBarProps = {
  isOpen: boolean;
  onOpen: () => void;
  variant?: "toolbar" | "pill";
};

function WhirlpoolIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18.9 9.2c0 4-3.2 7.1-7.1 7.1-3.1 0-5.6-2.1-5.6-4.8 0-2.4 2-4.2 4.5-4.2 2.1 0 3.8 1.3 3.8 3.2 0 1.4-1.1 2.4-2.4 2.4-1 0-1.8-.7-1.8-1.6 0-.7.5-1.3 1.1-1.5"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 12c0 5-4.1 9.1-9.1 9.1"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <path
        d="M3.8 12.1c0-4.8 3.8-8.6 8.6-8.6 2.6 0 4.9.8 6.6 2.5"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <circle cx="11.9" cy="11.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FloatingChatBar({
  isOpen,
  onOpen,
  variant = "toolbar",
}: FloatingChatBarProps) {
  const { sendMessage, isLoading } = useChat();
  const [value, setValue] = useState("");

  if (isOpen) {
    return null;
  }

  if (variant === "pill") {
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();

      const trimmedValue = value.trim();
      if (!trimmedValue || isLoading) {
        return;
      }

      onOpen();
      setValue("");
      await sendMessage(trimmedValue);
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="absolute bottom-6 left-1/2 z-40 flex w-[560px] -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-lg"
      >
        <button
          type="button"
          className="text-slate-400 transition hover:text-slate-600"
          aria-label="Add prompt"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v14m7-7H5"
            />
          </svg>
        </button>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Write an email about..."
          className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={isLoading || value.trim().length === 0}
          className="text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label="Send"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
      aria-label="Open AI chat"
    >
      <WhirlpoolIcon className="h-4 w-4" />
    </button>
  );
}
