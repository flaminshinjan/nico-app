import { DocumentEditor } from "@/components/editor/DocumentEditor";

export function DocumentEditorPanel() {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-canvas-surface rounded-xl overflow-hidden">
      <DocumentEditor />
    </div>
  );
}
