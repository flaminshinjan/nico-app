import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import mammoth from "mammoth";
import {
  useDocumentEditor,
  parseHeadingsFromHtml,
} from "@/context/DocumentEditorContext";
import { ExportMenu } from "@/components/editor/ExportMenu";
import { InlineAIToolbar } from "@/components/editor/InlineAIToolbar";
import { GhostText } from "@/components/editor/GhostText";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawEditor = any;

<<<<<<< HEAD
export function DocumentEditor() {
  const { registerEditor, notifyContentChange, title } = useDocumentEditor();
  const editorRef = useRef<RawEditor>(null);
=======
type DocumentEditorProps = {
  topBarAction?: ReactNode;
};

export function DocumentEditor({ topBarAction }: DocumentEditorProps) {
  const { registerEditor, notifyContentChange } = useDocumentEditor();
  const editorRef = useRef<EditorInstance | null>(null);
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
  const unregisterRef = useRef<(() => void) | null>(null);
  const [data, setData] = useState(
    "<p>Start typing or import a .docx file.</p>"
  );
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);

  const handleEditorReady = useCallback(
    (editor: RawEditor) => {
      editorRef.current = editor;

      const editableEl = editor.ui?.view?.editable?.element ?? null;
      setEditorEl(editableEl);

      unregisterRef.current = registerEditor({
        setData: (html: string) => {
          editor.setData(html || "<p></p>");
          setData(html || "<p></p>");
        },
        getData: () => editor.getData(),
        getHeadings: () => parseHeadingsFromHtml(editor.getData()),
        getSelectedText: () => {
          const sel = window.getSelection();
          if (!sel || !editableEl?.contains(sel.anchorNode)) return "";
          return sel.toString();
        },
        replaceSelection: (text: string) => {
          try {
            editor.model.change((writer: RawEditor) => {
              const selection = editor.model.document.selection;
              editor.model.deleteContent(selection);
              writer.insertText(text, selection.getFirstPosition());
            });
          } catch {
            console.error("Failed to replace selection");
          }
        },
        insertAtCursor: (text: string) => {
          try {
            editor.model.change((writer: RawEditor) => {
              writer.insertText(text, editor.model.document.selection.getFirstPosition());
            });
          } catch {
            console.error("Failed to insert at cursor");
          }
        },
        getEditorElement: () => editableEl,
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
        notifyContentChange();
      } catch (err) {
        console.error("Failed to import .docx:", err);
      }
    };
    input.click();
  }, [notifyContentChange]);

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

  const getHtml = useCallback(() => {
    return editorRef.current?.getData() ?? data;
  }, [data]);

  const handleInlineReplace = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      editor.model.change((writer: RawEditor) => {
        const selection = editor.model.document.selection;
        editor.model.deleteContent(selection);
        writer.insertText(text, selection.getFirstPosition());
      });
      notifyContentChange();
    } catch {
      console.error("Failed to replace selection via inline AI");
    }
  }, [notifyContentChange]);

  const getContextText = useCallback(() => {
    const html = editorRef.current?.getData() ?? "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent ?? "";
  }, []);

  const handleAcceptSuggestion = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      editor.model.change((writer: RawEditor) => {
        writer.insertText(text, editor.model.document.selection.getFirstPosition());
      });
      notifyContentChange();
    } catch {
      console.error("Failed to accept suggestion");
    }
  }, [notifyContentChange]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <header className="flex items-center gap-2 px-5 h-12 shrink-0">
        <button
          type="button"
          onClick={handleImportDocx}
          className="h-8 px-3.5 text-sm font-medium text-content-secondary bg-transparent rounded-md hover:bg-canvas-hover hover:text-content-primary transition-all"
        >
          Import .docx
        </button>
        <ExportMenu getHtml={getHtml} title={title} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleAddPageBreak}
          className="w-8 h-8 flex items-center justify-center text-content-tertiary rounded-md hover:bg-canvas-hover hover:text-content-primary transition-all"
          aria-label="Add page break"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        {topBarAction ? <div className="ml-auto">{topBarAction}</div> : null}
      </header>

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

      <InlineAIToolbar editorElement={editorEl} onReplace={handleInlineReplace} />
      <GhostText
        editorElement={editorEl}
        getContextText={getContextText}
        onAccept={handleAcceptSuggestion}
      />
    </div>
  );
}
