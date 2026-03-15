import { useCallback, useEffect, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import mammoth from "mammoth";
import { getApiUrl } from "@/lib/api";
import { useDocumentEditor, parseHeadingsFromHtml } from "@/context/DocumentEditorContext";

type EditorInstance = {
  setData: (data: string) => void;
  getData: () => string;
};

export function DocumentEditor() {
  const { registerEditor, notifyContentChange } = useDocumentEditor();
  const editorRef = useRef<EditorInstance | null>(null);
  const unregisterRef = useRef<(() => void) | null>(null);
  const [data, setData] = useState("<p>Start typing or import a .docx file.</p>");

  const handleEditorReady = useCallback(
    (editor: EditorInstance) => {
      editorRef.current = editor;
      unregisterRef.current = registerEditor({
        setData: (html: string) => editor.setData(html || "<p></p>"),
        getData: () => editor.getData(),
        getHeadings: () => parseHeadingsFromHtml(editor.getData()),
      });
    },
    [registerEditor]
  );

  useEffect(() => {
    return () => {
      unregisterRef.current?.();
      unregisterRef.current = null;
      editorRef.current = null;
    };
  }, []);

  const handleImportDocx = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        if (editorRef.current) {
          editorRef.current.setData(html || "<p></p>");
        } else {
          setData(html || "<p></p>");
        }
      } catch (err) {
        console.error("Failed to import .docx:", err);
      }
    };
    input.click();
  }, []);

  const handleDownloadDocx = useCallback(async () => {
    const html = editorRef.current?.getData() ?? data;
    try {
      const res = await fetch(`${getApiUrl()}/api/documents/html-to-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export .docx:", err);
    }
  }, [data]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          onClick={handleImportDocx}
          className="rounded px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
        >
          Import .docx
        </button>
        <button
          type="button"
          onClick={handleDownloadDocx}
          className="rounded px-3 py-1.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700"
        >
          Download as .docx
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-white flex justify-center py-8 px-4">
        <div
          className="document-page shadow-lg shrink-0"
          style={{ width: "210mm", height: "297mm" }}
        >
          <CKEditor
            editor={ClassicEditor}
            data={data}
            onReady={handleEditorReady}
            onChange={(_event, editor) => {
              setData(editor.getData());
              notifyContentChange();
            }}
            config={{
              placeholder: "Start typing or paste content…",
            }}
          />
        </div>
      </div>
    </div>
  );
}
