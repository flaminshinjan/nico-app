type FloatingChatBarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function FloatingChatBar({ isOpen, onToggle }: FloatingChatBarProps) {
  if (isOpen) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
      aria-label="Open AI chat"
    >
      <svg
        className="h-4 w-4"
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
    </button>
  );
}
