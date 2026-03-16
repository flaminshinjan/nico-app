import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";

type DocCardProps = {
  doc: GeneratedDoc;
  onClick: () => void;
  isGenerating?: boolean;
};

export function DocCard({ doc, onClick, isGenerating }: DocCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full cursor-pointer overflow-hidden rounded-lg border border-bubble-ai-border bg-bubble-ai text-left transition-all hover:border-line-strong ${isGenerating ? "shimmer" : ""}`}
      style={{ borderBottomLeftRadius: 4 }}
    >
      <div className="flex items-center gap-2 border-b border-bubble-ai-border px-3 py-2">
        <svg
          className="h-3.5 w-3.5 text-content-tertiary flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M7 3.75h6.75L18 8v12.25A1.75 1.75 0 0 1 16.25 22h-9.5A1.75 1.75 0 0 1 5 20.25v-14.5A1.75 1.75 0 0 1 6.75 4H7Zm6 0V8h4.25"
          />
        </svg>
        <span className="flex-1 truncate text-xs font-semibold text-content-secondary">
          {doc.title}
        </span>
      </div>
      <div className="relative max-h-24 overflow-hidden px-3 py-2">
        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-content-tertiary">
          {doc.markdown.slice(0, 400)}
        </pre>
        <div
          className="absolute inset-x-0 bottom-0 h-8 pointer-events-none"
          style={{
            background: "linear-gradient(transparent, var(--ai-bubble-bg))",
          }}
        />
      </div>
      <div className="border-t border-bubble-ai-border px-3 py-1.5">
        <span className="text-[11px] text-accent hover:underline">
          Click to open full preview
        </span>
      </div>
    </button>
  );
}
