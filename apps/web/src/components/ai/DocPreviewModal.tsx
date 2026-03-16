import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";

type DocPreviewModalProps = {
  doc: GeneratedDoc;
  onClose: () => void;
  onEmbed?: () => void;
};

export function DocPreviewModal({
  doc,
  onClose,
  onEmbed,
}: DocPreviewModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="flex w-full max-w-3xl max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-xl bg-canvas-elevated border border-line shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={doc.title}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-line-subtle px-6 py-4">
          <div className="flex-1 truncate text-lg font-semibold text-content-primary font-display italic">
            {doc.title}
          </div>
          <div className="flex items-center gap-2">
            {onEmbed && (
              <button
                type="button"
                onClick={() => {
                  onEmbed();
                  onClose();
                }}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-content-inverse transition hover:brightness-110"
              >
                Embed in document
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="prose prose-themed max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {doc.markdown}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
