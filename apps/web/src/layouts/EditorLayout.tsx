import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DocumentOutlinePanel } from "@/components/sidebar/DocumentOutlinePanel";
import { DocumentEditorPanel } from "@/components/editor/DocumentEditorPanel";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { FloatingChatBar } from "@/components/editor/FloatingChatBar";
<<<<<<< HEAD
import { LoadingBar } from "@/components/ui/LoadingBar";
import { ChatProvider, useChat } from "@/context/ChatContext";
=======
import { ChatProvider } from "@/context/ChatContext";
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
import { DocumentEditorProvider } from "@/context/DocumentEditorContext";
import { ThemeProvider } from "@/context/ThemeContext";

<<<<<<< HEAD
function LayoutInner() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const { isLoading } = useChat();

  const togglePanel = useCallback(() => {
    setIsSidePanelOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        togglePanel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePanel]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-base p-2 gap-2">
      <LoadingBar isActive={isLoading} />

      <motion.div
        className="flex-shrink-0 h-full"
        initial={{ x: -240, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <DocumentOutlinePanel />
      </motion.div>

      <motion.div
        className="relative flex flex-1 min-w-0 h-full"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.06 }}
      >
        <DocumentEditorPanel />
        {!isSidePanelOpen && (
          <FloatingChatBar onOpen={() => setIsSidePanelOpen(true)} />
        )}
      </motion.div>

      <AnimatePresence>
        {isSidePanelOpen && (
          <motion.div
            className="flex-shrink-0 h-full"
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <AISidePanel onClose={() => setIsSidePanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EditorLayout() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <DocumentEditorProvider>
          <LayoutInner />
        </DocumentEditorProvider>
      </ChatProvider>
    </ThemeProvider>
=======
export function EditorLayout() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  return (
    <ChatProvider>
      <DocumentEditorProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
          <DocumentOutlinePanel />
          <div className="relative flex flex-1">
            <DocumentEditorPanel
              topBarAction={
                <FloatingChatBar
                  isOpen={isSidePanelOpen}
                  onOpen={() => setIsSidePanelOpen(true)}
                />
              }
            />
            <FloatingChatBar
              variant="pill"
              isOpen={isSidePanelOpen}
              onOpen={() => setIsSidePanelOpen(true)}
            />
          </div>
          {isSidePanelOpen ? (
            <AISidePanel
              isOpen={isSidePanelOpen}
              onClose={() => setIsSidePanelOpen(false)}
            />
          ) : null}
        </div>
      </DocumentEditorProvider>
    </ChatProvider>
>>>>>>> 930dd86f6a3ec25c0fc95f5a07f1be4ff8306843
  );
}
