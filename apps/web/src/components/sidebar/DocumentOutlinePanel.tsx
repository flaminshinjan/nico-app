import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDocumentEditor } from "@/context/DocumentEditorContext";
import { useTheme } from "@/context/ThemeContext";

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

export function DocumentOutlinePanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { headings, title, setTitle } = useDocumentEditor();
  const { theme, toggleTheme } = useTheme();

  const handleHeadingClick = (id: string) => {
    const editorElement = document.querySelector(".ck-editor__editable");
    if (!editorElement) return;

    const allHeadings = editorElement.querySelectorAll("h1, h2, h3");
    const target = allHeadings[parseInt(id, 10)];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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

      <div className="px-5 py-4 group">
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

      {/* Outline Tree */}
      <div className="flex-1 px-3 py-1 overflow-y-auto space-y-0.5 custom-scrollbar">
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
                style={{ paddingLeft: `${12 + (item.level * 16)}px` }}
              >
                <div className={`
                  w-1 h-1 rounded-full bg-content-tertiary/30 group-hover:bg-accent
                  ${item.level === 0 ? "w-1.5 h-1.5 bg-accent/40" : ""}
                `} />
                <span className="text-[13px] truncate">
                  {item.title}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
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
          {theme === "dark" ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>
    </div>
  );
}