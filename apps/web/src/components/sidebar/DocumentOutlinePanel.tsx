import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDocumentEditor } from "@/context/DocumentEditorContext";
import { useTheme } from "@/context/ThemeContext";
import { AnalyticsPanel } from "@/components/sidebar/AnalyticsPanel";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  );
}

type Tab = "outline" | "analytics";

function DocSwitcher() {
  const { documents, activeDocId, switchDocument, createDocument, deleteDocument } = useDocumentEditor();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div ref={ref} className="relative px-4 py-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-canvas-hover transition-colors text-left"
      >
        <svg className="w-3.5 h-3.5 text-content-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-[12px] font-medium text-content-primary truncate flex-1">
          {activeDoc?.title ?? "Untitled"}
        </span>
        <svg className={`w-3 h-3 text-content-tertiary transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-lg bg-canvas-elevated overflow-hidden py-1"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <button
            type="button"
            onClick={() => { createDocument(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-accent hover:bg-canvas-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
          <div className="h-px bg-line-subtle mx-2 my-1" />
          <div className="max-h-[200px] overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  doc.id === activeDocId ? "bg-accent/10" : "hover:bg-canvas-hover"
                }`}
                onClick={() => { switchDocument(doc.id); setOpen(false); }}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] truncate ${doc.id === activeDocId ? "text-accent font-medium" : "text-content-primary"}`}>
                    {doc.title}
                  </p>
                  <p className="text-[10px] text-content-tertiary">{formatDate(doc.updatedAt)}</p>
                </div>
                {documents.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                    className="p-1 rounded text-content-tertiary hover:text-accent-error opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Delete document"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentOutlinePanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { headings, title, setTitle, editorApiRef } = useDocumentEditor();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("outline");

  const editorHtml = editorApiRef.current?.getData?.() ?? "";

  const handleHeadingClick = (id: string) => {
    const editorElement = document.querySelector(".ck-editor__editable");
    if (!editorElement) return;
    const allHeadings = editorElement.querySelectorAll("h1, h2, h3");
    const target = allHeadings[parseInt(id, 10)];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 h-full bg-canvas-elevated rounded-xl flex flex-col items-center py-4 gap-3 shadow-sm border border-canvas-border/50">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
          aria-label="Expand sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="w-[14px] h-[18px] rounded-[2px] bg-content-tertiary/10" />
        <div className="mt-auto">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0 h-full bg-canvas-elevated rounded-xl flex flex-col overflow-hidden shadow-sm border border-canvas-border/50">
      {/* Brand */}
      <div className="px-4 h-12 flex items-center gap-2 shrink-0 border-b border-canvas-border/30">
        <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
          </svg>
        </div>
        <span className="text-[13px] font-bold text-content-primary tracking-tight">
          NICO DOCS
        </span>
      </div>

      {/* Document Switcher */}
      <DocSwitcher />

      {/* Title */}
      <div className="px-5 py-2 group">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold tracking-[0.12em] uppercase text-content-tertiary/60 select-none px-0.5">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={(e) => {
              if (!e.target.value.trim()) setTitle("Untitled Document");
            }}
            placeholder="Untitled Document"
            className="w-full bg-transparent border-none outline-none text-[14px] font-semibold text-content-primary placeholder:text-content-tertiary/40 px-0.5 py-1 rounded hover:bg-canvas-hover focus:bg-canvas-hover transition-all"
          />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 px-4 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("outline")}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            activeTab === "outline"
              ? "bg-accent/15 text-accent"
              : "text-content-tertiary hover:text-content-secondary hover:bg-canvas-hover"
          }`}
        >
          Outline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            activeTab === "analytics"
              ? "bg-accent/15 text-accent"
              : "text-content-tertiary hover:text-content-secondary hover:bg-canvas-hover"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "outline" ? (
          <div className="px-3 py-1 space-y-0.5">
            {headings.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-content-tertiary italic opacity-60">
                No headings found
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {headings.map((item, index) => (
                  <motion.button
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleHeadingClick(item.id)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-md transition-all group
                      hover:bg-canvas-hover
                      ${item.level === 0 ? "font-bold text-content-primary" : "text-content-secondary"}
                    `}
                    style={{ paddingLeft: `${12 + item.level * 16}px` }}
                  >
                    <div
                      className={`
                      w-1 h-1 rounded-full bg-content-tertiary/30 group-hover:bg-accent
                      ${item.level === 0 ? "w-1.5 h-1.5 bg-accent/40" : ""}
                    `}
                    />
                    <span className="text-[13px] truncate">{item.title}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        ) : (
          <AnalyticsPanel html={editorHtml} />
        )}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto px-3 py-3 border-t border-canvas-border/30 flex items-center justify-between bg-canvas-base/30">
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-2 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
          aria-label="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors border border-canvas-border/50"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <SunIcon className="w-4 h-4 text-amber-400" />
          ) : (
            <MoonIcon className="w-4 h-4 text-indigo-500" />
          )}
        </button>
      </div>
    </div>
  );
}
