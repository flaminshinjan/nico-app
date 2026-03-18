import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getApiUrl } from "@/lib/api";
import type { GeneratedDoc } from "@/hooks/useDocumentGenerate";
import type { SerpResult } from "@/hooks/useSerpSearch";

export type OutlineItem = {
  id: string;
  title: string;
  level: number;
};

export type StoredDocument = {
  id: string;
  title: string;
  html: string;
  createdAt: number;
  updatedAt: number;
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
  getSelectedText?: () => string;
  replaceSelection?: (text: string) => void;
  insertAtCursor?: (text: string) => void;
  getEditorElement?: () => HTMLElement | null;
};

export type ImportMode = "visual-preserve" | "semantic-edit";

export type ImportMetadata = {
  fileName: string;
  mode: ImportMode;
  engine: "uno" | "mammoth";
  importedAt: number;
};

type DocumentEditorContextValue = {
  registerEditor: (api: EditorApi) => () => void;
  embedGeneratedContent: (doc: GeneratedDoc, sources?: SerpResult[]) => Promise<void>;
  isEmbedding: boolean;
  headings: OutlineItem[];
  title: string;
  setTitle: (title: string) => void;
  notifyContentChange: () => void;
  documents: StoredDocument[];
  activeDocId: string | null;
  createDocument: () => string;
  deleteDocument: (id: string) => void;
  switchDocument: (id: string) => void;
  editorApiRef: React.RefObject<EditorApi | null>;
  lastSources: SerpResult[];
  importMode: ImportMode;
  setImportMode: (mode: ImportMode) => void;
  lastImportMetadata: ImportMetadata | null;
  setLastImportMetadata: (meta: ImportMetadata | null) => void;
};

const DocumentEditorContext = createContext<DocumentEditorContextValue | undefined>(undefined);

const DOCS_KEY = "nico-documents";
const ACTIVE_KEY = "nico-active-doc";
const IMPORT_MODE_KEY = "nico-import-mode";

function loadDocs(): StoredDocument[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(docs: StoredDocument[]) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

function makeDefaultDoc(): StoredDocument {
  return {
    id: crypto.randomUUID(),
    title: "Untitled Document",
    html: "<p>Start typing or import a .docx file.</p>",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function DocumentEditorProvider({ children }: { children: ReactNode }) {
  const editorApiRef = useRef<EditorApi | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [headings, setHeadings] = useState<OutlineItem[]>([]);
  const [lastSources, setLastSources] = useState<SerpResult[]>([]);
  const [lastImportMetadata, setLastImportMetadata] = useState<ImportMetadata | null>(null);
  const [importMode, setImportModeState] = useState<ImportMode>(() => {
    const raw = localStorage.getItem(IMPORT_MODE_KEY);
    return raw === "semantic-edit" ? "semantic-edit" : "visual-preserve";
  });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [documents, setDocuments] = useState<StoredDocument[]>(() => {
    const docs = loadDocs();
    if (docs.length > 0) return docs;
    const def = makeDefaultDoc();
    saveDocs([def]);
    return [def];
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    const docs = loadDocs();
    if (saved && docs.some((d) => d.id === saved)) return saved;
    return docs[0]?.id ?? "";
  });

  const [title, setTitleState] = useState(() => {
    const doc = documents.find((d) => d.id === activeDocId);
    return doc?.title ?? "Untitled Document";
  });
  const pendingHtmlRef = useRef<string | null>(null);

  useEffect(() => {
    saveDocs(documents);
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeDocId);
  }, [activeDocId]);

  useEffect(() => {
    localStorage.setItem(IMPORT_MODE_KEY, importMode);
  }, [importMode]);

  const setImportMode = useCallback((mode: ImportMode) => {
    setImportModeState(mode);
  }, []);

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDocId ? { ...d, title: newTitle, updatedAt: Date.now() } : d
      )
    );
  }, [activeDocId]);

  const notifyContentChange = useCallback(() => {
    const next = editorApiRef.current?.getHeadings?.() ?? [];
    setHeadings(next);

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const html = editorApiRef.current?.getData?.();
      if (html && activeDocId) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === activeDocId ? { ...d, html, updatedAt: Date.now() } : d))
        );
      }
    }, 1500);
  }, [activeDocId]);

  const registerEditor = useCallback((api: EditorApi) => {
    editorApiRef.current = api;
    setHeadings(api.getHeadings?.() ?? []);

    const doc = documents.find((d) => d.id === activeDocId);
    if (pendingHtmlRef.current) {
      api.setData(pendingHtmlRef.current);
      pendingHtmlRef.current = null;
    } else if (doc) {
      api.setData(doc.html);
    }

    return () => {
      editorApiRef.current = null;
      setHeadings([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createDocument = useCallback(() => {
    const html = editorApiRef.current?.getData?.();
    if (html && activeDocId) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === activeDocId ? { ...d, html, updatedAt: Date.now() } : d))
      );
    }
    const newDoc = makeDefaultDoc();
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setTitleState(newDoc.title);
    editorApiRef.current?.setData(newDoc.html);
    return newDoc.id;
  }, [activeDocId]);

  const deleteDocument = useCallback(
    (id: string) => {
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.id !== id);
        if (filtered.length === 0) {
          const def = makeDefaultDoc();
          setActiveDocId(def.id);
          setTitleState(def.title);
          editorApiRef.current?.setData(def.html);
          return [def];
        }
        if (id === activeDocId) {
          const next = filtered[0];
          setActiveDocId(next.id);
          setTitleState(next.title);
          editorApiRef.current?.setData(next.html);
        }
        return filtered;
      });
    },
    [activeDocId]
  );

  const switchDocument = useCallback(
    (id: string) => {
      if (id === activeDocId) return;
      const html = editorApiRef.current?.getData?.();
      if (html && activeDocId) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === activeDocId ? { ...d, html, updatedAt: Date.now() } : d))
        );
      }
      setActiveDocId(id);
      setDocuments((prev) => {
        const doc = prev.find((d) => d.id === id);
        if (doc) {
          setTitleState(doc.title);
          editorApiRef.current?.setData(doc.html);
        }
        return prev;
      });
    },
    [activeDocId]
  );

  const embedGeneratedContent = useCallback(async (doc: GeneratedDoc, sources?: SerpResult[]) => {
    setIsEmbedding(true);
    if (sources) setLastSources(sources);
    try {
      const res = await fetch(`${getApiUrl()}/api/documents/markdown-to-html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: doc.markdown }),
      });
      if (!res.ok) throw new Error(`Failed to convert: ${res.status}`);
      const { html } = await res.json();
      const content = html ?? "<p></p>";

      // Sources are stored in lastSources for reference but NOT appended to the document
      // The user can access sources separately if needed

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
      title,
      setTitle,
      notifyContentChange,
      documents,
      activeDocId,
      createDocument,
      deleteDocument,
      switchDocument,
      editorApiRef: editorApiRef as React.RefObject<EditorApi | null>,
      lastSources,
      importMode,
      setImportMode,
      lastImportMetadata,
      setLastImportMetadata,
    }),
    [
      registerEditor,
      embedGeneratedContent,
      isEmbedding,
      headings,
      title,
      setTitle,
      notifyContentChange,
      documents,
      activeDocId,
      createDocument,
      deleteDocument,
      switchDocument,
      lastSources,
      importMode,
      setImportMode,
      lastImportMetadata,
    ]
  );

  return (
    <DocumentEditorContext.Provider value={value}>{children}</DocumentEditorContext.Provider>
  );
}

export function useDocumentEditor() {
  const context = useContext(DocumentEditorContext);
  if (!context) {
    throw new Error("useDocumentEditor must be used within DocumentEditorProvider");
  }
  return context;
}
