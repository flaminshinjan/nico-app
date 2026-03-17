import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getApiUrl } from "@/lib/api";

type InlineAIToolbarProps = {
  editorElement: HTMLElement | null;
  onReplace: (text: string) => void;
};

const ACTIONS = [
  { id: "rewrite", label: "Rewrite", instruction: "Rewrite the following text to be clearer and more polished. Preserve the meaning exactly." },
  { id: "shorten", label: "Shorten", instruction: "Make the following text more concise. Remove unnecessary words while preserving meaning." },
  { id: "expand", label: "Expand", instruction: "Expand and elaborate on the following text with more detail and depth." },
  { id: "grammar", label: "Fix Grammar", instruction: "Fix any grammar, spelling, and punctuation errors in the following text." },
  { id: "professional", label: "Professional", instruction: "Rewrite the following text in a formal, professional tone suitable for business communication." },
  { id: "casual", label: "Casual", instruction: "Rewrite the following text in a casual, friendly, conversational tone." },
] as const;

export function InlineAIToolbar({ editorElement, onReplace }: InlineAIToolbarProps) {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateSelection = useCallback(() => {
    if (isProcessing) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorElement) {
      setSelectedText("");
      setPosition(null);
      return;
    }

    if (!editorElement.contains(selection.anchorNode)) {
      setSelectedText("");
      setPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setSelectedText("");
      setPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectedText(text);
    setPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, [editorElement, isProcessing]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, [updateSelection]);

  useEffect(() => {
    if (!position) return;
    function handleScroll() {
      if (!isProcessing) {
        setSelectedText("");
        setPosition(null);
      }
    }
    const scroller = editorElement?.closest(".overflow-y-auto");
    scroller?.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller?.removeEventListener("scroll", handleScroll);
  }, [position, editorElement, isProcessing]);

  async function handleAction(action: typeof ACTIONS[number]) {
    if (!selectedText) return;
    setIsProcessing(true);
    setActiveAction(action.id);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${getApiUrl()}/api/groq/openai/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1024,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content: `${action.instruction}\n\nRespond with ONLY the rewritten text. No explanations, no quotes, no preamble.`,
            },
            { role: "user", content: selectedText },
          ],
        }),
      });

      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      const result = data?.choices?.[0]?.message?.content?.trim();
      if (result) {
        onReplace(result);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error("Inline AI error:", err);
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
      setSelectedText("");
      setPosition(null);
    }
  }

  if (!position || !selectedText) return null;

  const toolbarWidth = 380;
  const left = Math.max(8, Math.min(position.x - toolbarWidth / 2, window.innerWidth - toolbarWidth - 8));
  const top = position.y - 44;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={toolbarRef}
        initial={{ y: 6, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 6, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[200] flex items-center gap-0.5 rounded-lg bg-canvas-elevated px-1.5 py-1"
        style={{ left, top, boxShadow: "var(--shadow-lg)" }}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="spinner" style={{ width: 14, height: 14 }} />
            <span className="text-[11px] text-content-tertiary">
              {ACTIONS.find((a) => a.id === activeAction)?.label ?? "Processing"}...
            </span>
          </div>
        ) : (
          ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-content-secondary hover:bg-canvas-hover hover:text-content-primary transition-colors whitespace-nowrap"
            >
              {action.label}
            </button>
          ))
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
