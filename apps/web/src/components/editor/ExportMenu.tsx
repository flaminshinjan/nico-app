import { useState, useRef, useEffect } from "react";
import {
  exportAsDocx,
  exportAsPdf,
  exportAsMarkdown,
  exportAsHtml,
  copyHtmlToClipboard,
} from "@/lib/export";

type ExportMenuProps = {
  getHtml: () => string;
  title: string;
};

const EXPORT_OPTIONS = [
  { id: "pdf", label: "PDF", icon: "M7 21h10a2 2 0 002-2V9l-5-5H7a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "docx", label: "Word (.docx)", icon: "M4 4v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6a2 2 0 00-2 2z" },
  { id: "md", label: "Markdown", icon: "M3 7v10h4l2-3 2 3h4V7" },
  { id: "html", label: "HTML File", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { id: "copy", label: "Copy as Markdown", icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" },
] as const;

export function ExportMenu({ getHtml, title }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleExport(id: string) {
    const html = getHtml();
    setStatus("Exporting...");
    try {
      switch (id) {
        case "pdf": exportAsPdf(html, title); break;
        case "docx": await exportAsDocx(html, title); break;
        case "md": exportAsMarkdown(html, title); break;
        case "html": exportAsHtml(html, title); break;
        case "copy": copyHtmlToClipboard(html); setStatus("Copied!"); setTimeout(() => setStatus(null), 1500); setOpen(false); return;
      }
      setStatus(null);
    } catch {
      setStatus("Export failed");
      setTimeout(() => setStatus(null), 2000);
    }
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 px-3.5 text-sm font-medium text-content-inverse bg-accent rounded-md hover:brightness-110 transition-all flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
        </svg>
        {status ?? "Export"}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-52 rounded-lg bg-canvas-elevated shadow-lg overflow-hidden z-50 py-1"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          {EXPORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleExport(opt.id)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-content-secondary hover:bg-canvas-hover hover:text-content-primary transition-colors text-left"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
              </svg>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
