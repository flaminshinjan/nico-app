import { DocumentOutlinePanel } from "@/components/editor/DocumentOutlinePanel";
import { DocumentEditorPanel } from "@/components/editor/DocumentEditorPanel";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { ChatProvider } from "@/context/ChatContext";

export function EditorLayout() {
  return (
    <ChatProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
        <DocumentOutlinePanel />
        <DocumentEditorPanel />
        <AISidePanel />
      </div>
    </ChatProvider>
  );
}
