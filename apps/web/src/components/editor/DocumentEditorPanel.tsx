import type { ReactNode } from "react";
import { DocumentEditor } from "@/components/editor/DocumentEditor";

type DocumentEditorPanelProps = {
  topBarAction?: ReactNode;
};

export function DocumentEditorPanel({ topBarAction }: DocumentEditorPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-100">
      <DocumentEditor topBarAction={topBarAction} />
    </div>
  );
}
