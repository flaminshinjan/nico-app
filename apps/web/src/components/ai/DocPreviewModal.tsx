import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";

type DocPreviewModalProps = {
  doc: GeneratedDoc;
  onClose: () => void;
  onEmbed?: () => void;
};

export function DocPreviewModal({ doc, onClose, onEmbed }: DocPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div className="mx-auto my-8 flex max-h-[calc(100vh-4rem)] max-w-3xl">
        <div
          className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={doc.title}
        >
          <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-4">
            <div className="flex-1 truncate text-lg font-semibold text-slate-900">
              {doc.title}
            </div>
            <div className="flex items-center gap-2">
              {onEmbed ? (
                <button
                  type="button"
                  onClick={() => {
                    onEmbed();
                    onClose();
                  }}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Embed in document
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close preview"
              >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {doc.markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
