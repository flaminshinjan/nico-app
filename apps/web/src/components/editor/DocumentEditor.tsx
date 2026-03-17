import { useCallback, useEffect, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import mammoth from "mammoth";
import { getApiUrl } from "@/lib/api";
import {
  useDocumentEditor,
  parseHeadingsFromHtml,
} from "@/context/DocumentEditorContext";

type EditorInstance = {
  setData: (data: string) => void;
  getData: () => string;
};

export function DocumentEditor() {
  const { registerEditor, notifyContentChange } = useDocumentEditor();
  const editorRef = useRef<EditorInstance | null>(null);
  const unregisterRef = useRef<(() => void) | null>(null);
  const [data, setData] = useState(
    "<p>Start typing or import a .docx file.</p>"
  );

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
        if (editorRef.current) editorRef.current.setData(html || "<p></p>");
        else setData(html || "<p></p>");
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

  const handleAddPageBreak = useCallback(() => {
    const pageBreakHtml = '<hr class="page-break" />';
    if (editorRef.current) {
      const html = editorRef.current.getData();
      editorRef.current.setData(html + pageBreakHtml);
    } else {
      setData((prev) => prev + pageBreakHtml);
    }
    notifyContentChange();
  }, [notifyContentChange]);
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Top toolbar */}
      <header className="flex items-center gap-2 px-5 h-12 shrink-0">

        <button
          type="button"
          onClick={handleImportDocx}
          className="h-8 px-3.5 text-sm font-medium text-content-secondary bg-transparent rounded-md hover:bg-canvas-hover hover:text-content-primary transition-all"
        >
          Import .docx
        </button>
        <button
          type="button"
          onClick={handleDownloadDocx}
          className="h-8 px-3.5 text-sm font-medium text-content-inverse bg-accent rounded-md hover:brightness-110 transition-all"
        >
          Download as .docx
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleAddPageBreak}
          className="w-8 h-8 flex items-center justify-center text-content-tertiary rounded-md hover:bg-canvas-hover hover:text-content-primary transition-all"
          aria-label="Add page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </header>

      {/* Document scroll area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex justify-center py-10 px-4"
        style={{
          background:
            "linear-gradient(to bottom, var(--editor-gradient-start) 0%, var(--bg-surface) 120px)",
        }}
      >
        <div
          className="document-page shrink-0"
          style={{ width: 760, minHeight: 1056 }}
        >
          <CKEditor
            editor={ClassicEditor}
            data={data}
            onReady={handleEditorReady}
            onChange={(_event, editor) => {
              setData(editor.getData());
              notifyContentChange();
            }}
            config={{ placeholder: "Start typing or paste content…" }}
          />
        </div>
      </div>
    </div>
  );
}
