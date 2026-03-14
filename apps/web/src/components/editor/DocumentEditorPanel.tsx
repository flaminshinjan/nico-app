import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { QuickActionChips } from "@/components/editor/QuickActionChips";
import { ChatInput } from "@/components/editor/ChatInput";

export function DocumentEditorPanel() {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      <div className="flex-1 flex flex-col min-h-0">
        <DocumentEditor />
        <QuickActionChips />
      </div>
      <ChatInput />
    </div>
  );
}
