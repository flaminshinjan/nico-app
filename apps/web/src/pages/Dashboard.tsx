import { useState } from "react";
import { motion } from "framer-motion";
import { useDocumentEditor } from "@/context/DocumentEditorContext";
import { useChat } from "@/context/ChatContext";
import mammoth from "mammoth";

interface DashboardProps {
  onNavigate: () => void;
}

const TEMPLATES = [
  { id: "notes", title: "Project Notes" },
  { id: "report", title: "Monthly Report" },
  { id: "resume", title: "Modern Resume" },
  { id: "meeting", title: "Meeting Minutes" },
  { id: "essay", title: "Quick Essay" },
  { id: "letter", title: "Formal Letter" },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const [query, setQuery] = useState("");
  const { setInitialContent, setTitle } = useDocumentEditor();
  const { setInitialMessage } = useChat();

  const handleStartBlank = () => {
    setInitialContent("<p></p>");
    setTitle("Untitled Document");
    onNavigate();
  };

  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    setInitialMessage(trimmedQuery);

    setInitialContent("<p></p>");
    setTitle("Untitled Document");
    onNavigate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setInitialContent(result.value || "<p></p>");
        setTitle(file.name.replace(".docx", ""));
        onNavigate();
      } catch (err) {
        console.error("Failed to import .docx:", err);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-canvas-base flex flex-col items-center px-6 pt-32 pb-12 relative overflow-y-auto">
      <motion.div
        className="w-full max-w-4xl space-y-20 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Chat Input - Claude/ChatGPT Inspired */}
        <div className="max-w-[640px] mx-auto w-full">
          <div className="relative group">
            <div className="relative flex items-center bg-white dark:bg-canvas-elevated border border-canvas-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none rounded-2xl overflow-hidden p-1.5 transition-all focus-within:border-accent/30 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask or start writing..."
                className="w-full bg-transparent px-5 py-3 text-[16px] outline-none text-content-primary placeholder:text-content-tertiary/40 font-normal"
              />

              <div className="flex items-center gap-1.5 pr-2">
                {/* Integrated Import Icon */}
                <button
                  onClick={handleImport}
                  className="p-2 text-content-tertiary hover:text-accent hover:bg-canvas-hover rounded-lg transition-all"
                  title="Import .docx"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Send/Start Arrow */}
                <button
                  className="p-2 bg-accent/5 text-accent hover:bg-accent hover:text-content-inverse rounded-lg transition-all disabled:opacity-20 disabled:bg-transparent disabled:text-content-tertiary"
                  disabled={!query.trim()}
                  onClick={handleSubmit}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Section - Minimal Grid */}
        <div className="space-y-6">
          <div className="flex items-center px-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-content-tertiary/50">
              Start a new document
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 px-4">
            {/* Blank Card */}
            <motion.button
              onClick={handleStartBlank}
              className="flex flex-col gap-3 group text-left outline-none"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="aspect-[3/4] w-full bg-white dark:bg-canvas-elevated border border-canvas-border/60 rounded-xl shadow-sm flex items-center justify-center transition-all group-hover:border-accent/40 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] group-focus:ring-2 group-focus:ring-accent/10">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-[11.5px] font-semibold text-content-primary px-1 tracking-tight">Blank Document</span>
            </motion.button>

            {/* Template Placeholders */}
            {TEMPLATES.map((template, idx) => (
              <motion.div
                key={template.id}
                className="flex flex-col gap-3 group cursor-default text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <div className="aspect-[3/4] w-full bg-canvas-elevated/30 border border-canvas-border/40 rounded-xl shadow-sm p-4 space-y-2.5 transition-all group-hover:bg-white dark:group-hover:bg-canvas-elevated group-hover:border-canvas-border/60 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden relative">
                  {/* Skeleton Content */}
                  <div className="h-1 w-1/3 bg-content-tertiary/10 rounded-full" />
                  <div className="h-1 w-full bg-content-tertiary/5 rounded-full" />
                  <div className="h-1 w-3/4 bg-content-tertiary/5 rounded-full" />
                  <div className="pt-2 space-y-1.5">
                    <div className="h-0.5 w-full bg-content-tertiary/5 rounded-full" />
                    <div className="h-0.5 w-full bg-content-tertiary/5 rounded-full" />
                    <div className="h-0.5 w-2/3 bg-content-tertiary/5 rounded-full" />
                  </div>
                </div>
                <span className="text-[11.5px] font-semibold text-content-primary px-1 tracking-tight opacity-90">{template.title}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subtle Footer */}
        <div className="pt-24 pb-8 flex justify-center opacity-20">
          <div className="flex items-center gap-6 text-[10px] font-bold tracking-[0.2em] uppercase text-content-tertiary">
            <span>Open Source</span>
            <span>•</span>
            <span>AI Powered</span>
            <span>•</span>
            <span>Built for Speed</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
