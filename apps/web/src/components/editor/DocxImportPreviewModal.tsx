import { createPortal } from "react-dom";
import { motion } from "framer-motion";

type DocxImportPreviewModalProps = {
  fileName: string;
  html: string;
  engine: "uno" | "mammoth";
  onClose: () => void;
  onConfirm: () => void;
};

export function DocxImportPreviewModal({
  fileName,
  html,
  engine,
  onClose,
  onConfirm,
}: DocxImportPreviewModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl h-[min(86vh,860px)] bg-canvas-elevated rounded-xl shadow-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="DOCX import preview"
      >
        <div className="px-5 py-3 border-b border-border-subtle flex items-center gap-3">
          <div className="text-sm font-medium text-content-primary truncate flex-1">
            Preview import: {fileName}
          </div>
          <div className="text-xs text-content-tertiary uppercase tracking-wide">
            Engine: {engine}
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-canvas">
          <iframe
            title="DOCX import preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>body{font-family:Georgia,serif;padding:32px;line-height:1.6;color:#1f2937;max-width:900px;margin:0 auto;} img{max-width:100%;height:auto;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #d1d5db;padding:8px;} blockquote{border-left:3px solid #6366f1;padding-left:12px;color:#374151;}</style></head><body>${html}</body></html>`}
          />
        </div>

        <div className="px-5 py-3 border-t border-border-subtle flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 text-sm text-content-secondary hover:text-content-primary rounded-md hover:bg-canvas-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-3.5 text-sm font-medium text-content-inverse bg-accent rounded-md hover:brightness-110 transition-all"
          >
            Import into editor
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
