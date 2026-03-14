export function ChatInput() {
  return (
    <div className="px-4 py-3 border-t border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
        <input
          type="text"
          placeholder="Write an email about..."
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
        />
        <button
          type="button"
          className="p-1.5 text-slate-500 hover:text-slate-700"
          aria-label="Send"
        >
          <svg
            className="w-5 h-5"
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
    </div>
  );
}
