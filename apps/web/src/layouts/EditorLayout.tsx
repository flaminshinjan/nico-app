import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DocumentOutlinePanel } from "@/components/sidebar/DocumentOutlinePanel";
import { DocumentEditorPanel } from "@/components/editor/DocumentEditorPanel";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { FloatingChatBar } from "@/components/editor/FloatingChatBar";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { useChat } from "@/context/ChatContext";

function LayoutInner() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const { isLoading, messages } = useChat();

  useEffect(() => {
    if (messages.length > 0) {
      setIsSidePanelOpen(true);
    }
  }, [messages.length]);

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
  return <LayoutInner />;
}
