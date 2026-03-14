import { DocumentEditor as OnlyOfficeEditor } from "@onlyoffice/document-editor-react";
import { useOnlyOfficeConnector } from "@/hooks/useOnlyOfficeConnector";

const DOCUMENT_SERVER_URL =
  import.meta.env.VITE_ONLYOFFICE_SERVER_URL || "http://localhost:80";
const SAMPLE_DOCUMENT_URL =
  "https://static.onlyoffice.com/assets/docs/samples/demo.docx";

const config = {
  document: {
    fileType: "docx",
    key: "Khirz6zTPdfd7",
    title: "Untitled document.docx",
    url: SAMPLE_DOCUMENT_URL,
  },
  documentType: "word" as const,
  editorConfig: {
    callbackUrl: `${window.location.origin}/api/onlyoffice/callback`,
    customization: {
      toolbar: false,
      compactHeader: true,
      compactToolbar: false,
      uiTheme: "theme-light",
    },
    user: {
      id: "user-1",
      name: "User",
    },
  },
};


function onLoadComponentError(errorCode: number, errorDescription: string) {
  if (errorCode === -2) {
    console.warn(
      "ONLYOFFICE Document Server not available. Ensure Document Server is running and VITE_ONLYOFFICE_SERVER_URL is set."
    );
  }
  console.error(errorCode, errorDescription);
}

export function DocumentEditor() {
  const { initConnector } = useOnlyOfficeConnector();

  return (
    <div className="flex-1 min-h-0 bg-white">
      <OnlyOfficeEditor
        id="docxEditor"
        documentServerUrl={DOCUMENT_SERVER_URL}
        config={config}
        height="100%"
        width="100%"
        events_onDocumentReady={initConnector}
        onLoadComponentError={onLoadComponentError}
      />
    </div>
  );
}
