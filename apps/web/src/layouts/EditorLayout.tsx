import { useState } from "react";
import { DocumentOutlinePanel } from "@/components/editor/DocumentOutlinePanel";
import { DocumentEditorPanel } from "@/components/editor/DocumentEditorPanel";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { FloatingChatBar } from "@/components/editor/FloatingChatBar";
import { ChatProvider } from "@/context/ChatContext";
import { DocumentEditorProvider } from "@/context/DocumentEditorContext";

export function EditorLayout() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  return (
    <ChatProvider>
      <DocumentEditorProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
          <DocumentOutlinePanel />
          <div className="flex-1 flex">
            <DocumentEditorPanel
              topBarAction={
                <FloatingChatBar
                  isOpen={isSidePanelOpen}
                  onToggle={() => setIsSidePanelOpen((prev) => !prev)}
                />
              }
            />
          </div>
          {isSidePanelOpen ? (
            <AISidePanel
              isOpen={isSidePanelOpen}
              onClose={() => setIsSidePanelOpen(false)}
            />
          ) : null}
        </div>
      </DocumentEditorProvider>
    </ChatProvider>
  );
}
