import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";

type DocCardProps = {
  doc: GeneratedDoc;
  onClick: () => void;
};

export function DocCard({ doc, onClick }: DocCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-all hover:border-slate-400 hover:shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <svg
          className="h-4 w-4 text-slate-400"
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
        <div className="flex-1 truncate text-sm font-medium text-slate-700">
          {doc.title}
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto px-3 py-2">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-600">
          {doc.markdown}
        </pre>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-right">
        <span className="text-xs text-slate-400">Click to open full preview</span>
      </div>
    </button>
  );
}
