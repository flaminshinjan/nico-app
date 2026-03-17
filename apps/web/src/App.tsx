import { useState } from "react";
import { EditorLayout } from "./layouts/EditorLayout";
import { Dashboard } from "./pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import { ChatProvider } from "./context/ChatContext";
import { DocumentEditorProvider } from "./context/DocumentEditorContext";

function App() {
  const [page, setPage] = useState<"landing" | "editor">("landing");

  return (
    <ThemeProvider>
      <ChatProvider>
        <DocumentEditorProvider>
          {page === "landing" ? (
            <Dashboard onNavigate={() => setPage("editor")} />
          ) : (
            <EditorLayout />
          )}
        </DocumentEditorProvider>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
