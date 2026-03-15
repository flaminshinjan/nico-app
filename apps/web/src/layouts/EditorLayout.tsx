import { DocumentOutlinePanel } from "@/components/editor/DocumentOutlinePanel";
import { DocumentEditorPanel } from "@/components/editor/DocumentEditorPanel";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { ChatProvider } from "@/context/ChatContext";
import { DocumentEditorProvider } from "@/context/DocumentEditorContext";

export function EditorLayout() {
  return (
    <ChatProvider>
      <DocumentEditorProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
          <DocumentOutlinePanel />
          <DocumentEditorPanel />
          <AISidePanel />
        </div>
      </DocumentEditorProvider>
    </ChatProvider>
  );
}
