import { useState } from "react";
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
  const { headings } = useDocumentEditor();
  const { theme, toggleTheme } = useTheme();
  const tabLabel = headings[0]?.title ?? "Untitled";

  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 h-full bg-canvas-elevated rounded-xl flex flex-col items-center py-4 gap-3 shadow-sm">
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
    <div className="w-60 flex-shrink-0 h-full bg-canvas-elevated rounded-xl flex flex-col overflow-hidden shadow-sm">
      {/* Brand */}
      <div className="px-4 h-12 flex items-center gap-2 shrink-0">
        <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
        </svg>
        <span className="text-[13px] font-semibold text-content-primary tracking-tight">
          Cursor for Word
        </span>
      </div>

      {/* Section label */}
      <div className="px-4 pt-3 pb-2">
        <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-content-tertiary select-none">
          Documents
        </span>
      </div>

      {/* New page */}
      <div className="px-3 pb-2">
        <button
          type="button"
          className="w-full px-3 py-1.5 text-sm text-content-tertiary rounded-md hover:text-content-primary hover:bg-canvas-hover transition-all"
        >
          + New page
        </button>
      </div>

      {/* Document tabs */}
      <div className="flex-1 px-2 py-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-2.5 py-2 bg-canvas-active rounded-md group">
          <svg className="w-3.5 h-4 text-accent flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M6 3h8l4 4v14H6V3z" />
            <path d="M14 3v4h4" />
          </svg>
          <span className="text-sm text-content-primary truncate flex-1" title={tabLabel}>
            {tabLabel}
          </span>
          <button
            type="button"
            className="p-0.5 text-content-tertiary hover:text-content-primary rounded opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Tab options"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
          aria-label="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-canvas-hover rounded-md transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
