import { useState } from "react";
import { DocumentOutlinePanel } from "@/components/editor/DocumentOutlinePanel";
import { DocumentEditorPanel } from "@/components/editor/DocumentEditorPanel";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { ChatProvider } from "@/context/ChatContext";
import { DocumentEditorProvider } from "@/context/DocumentEditorContext";

export function EditorLayout() {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <ChatProvider>
      <DocumentEditorProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
          <DocumentOutlinePanel />
          <DocumentEditorPanel />
          {aiPanelOpen ? (
            <AISidePanel onClose={() => setAiPanelOpen(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAiPanelOpen(true)}
              className="w-12 flex-shrink-0 flex flex-col items-center justify-center gap-1 border-l border-slate-200 bg-white py-4 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-l-2xl"
              aria-label="Open Cursor for Word"
              title="Open Cursor for Word"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>AI</span>
            </button>
          )}
        </div>
      </DocumentEditorProvider>
    </ChatProvider>
  );
}
