import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";

export type OutlineItem = {
  id: string;
  title: string;
  level: number;
};

export function parseHeadingsFromHtml(html: string): OutlineItem[] {
  if (!html?.trim()) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nodes = doc.querySelectorAll("h1, h2, h3");
  return Array.from(nodes).map((el, i) => ({
    id: String(i),
    title: (el.textContent ?? "").trim() || "(Untitled)",
    level: parseInt(el.tagName.charAt(1), 10) - 1,
  }));
}

export type EditorApi = {
  setData: (html: string) => void;
  getData: () => string;
  getHeadings?: () => OutlineItem[];
};

type DocumentEditorContextValue = {
  registerEditor: (api: EditorApi) => () => void;
  embedGeneratedContent: (doc: GeneratedDoc) => Promise<void>;
  isEmbedding: boolean;
  headings: OutlineItem[];
  notifyContentChange: () => void;
};

const DocumentEditorContext = createContext<
  DocumentEditorContextValue | undefined
>(undefined);

const getApiBaseUrl = () => window.location.origin;

export function DocumentEditorProvider({ children }: { children: ReactNode }) {
  const editorApiRef = useRef<EditorApi | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [headings, setHeadings] = useState<OutlineItem[]>([]);
  const pendingHtmlRef = useRef<string | null>(null);

  const notifyContentChange = useCallback(() => {
    const next = editorApiRef.current?.getHeadings?.() ?? [];
    setHeadings(next);
  }, []);

  const registerEditor = useCallback((api: EditorApi) => {
    editorApiRef.current = api;
    setHeadings(api.getHeadings?.() ?? []);
    if (pendingHtmlRef.current) {
      api.setData(pendingHtmlRef.current);
      pendingHtmlRef.current = null;
    }
    return () => {
      editorApiRef.current = null;
      setHeadings([]);
    };
  }, []);

  const embedGeneratedContent = useCallback(async (doc: GeneratedDoc) => {
    setIsEmbedding(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/documents/markdown-to-html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: doc.markdown }),
      });
      if (!res.ok) {
        throw new Error(`Failed to convert: ${res.status}`);
      }
      const { html } = await res.json();
      const content = html ?? "<p></p>";
      if (editorApiRef.current) {
        editorApiRef.current.setData(content);
      } else {
        pendingHtmlRef.current = content;
      }
    } catch (err) {
      console.error("Failed to embed document:", err);
    } finally {
      setIsEmbedding(false);
    }
  }, []);

  const value = useMemo<DocumentEditorContextValue>(
    () => ({
      registerEditor,
      embedGeneratedContent,
      isEmbedding,
      headings,
      notifyContentChange,
    }),
    [registerEditor, embedGeneratedContent, isEmbedding, headings, notifyContentChange]
  );

  return (
    <DocumentEditorContext.Provider value={value}>
      {children}
    </DocumentEditorContext.Provider>
  );
}

export function useDocumentEditor() {
  const context = useContext(DocumentEditorContext);
  if (!context) {
    throw new Error(
      "useDocumentEditor must be used within DocumentEditorProvider"
    );
  }
  return context;
}
