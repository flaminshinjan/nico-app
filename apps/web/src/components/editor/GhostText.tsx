import { useState, useEffect, useRef, useCallback } from "react";
import { getApiUrl } from "@/lib/api";

type GhostTextProps = {
  editorElement: HTMLElement | null;
  getContextText: () => string;
  onAccept: (text: string) => void;
};

const DEBOUNCE_MS = 1200;
const MIN_CONTEXT_WORDS = 8;
const MAX_CONTEXT_CHARS = 600;

export function GhostText({ editorElement, getContextText, onAccept }: GhostTextProps) {
  const [suggestion, setSuggestion] = useState("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const suggestionRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);
  const lastContextRef = useRef("");
  const onAcceptRef = useRef(onAccept);
  const getContextTextRef = useRef(getContextText);

  onAcceptRef.current = onAccept;
  getContextTextRef.current = getContextText;

  const clearSuggestion = useCallback(() => {
    setSuggestion("");
    setPosition(null);
    suggestionRef.current = "";
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const clearRef = useRef(clearSuggestion);
  clearRef.current = clearSuggestion;

  const getCaretRect = useCallback((): DOMRect | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
    if (!editorElement?.contains(sel.anchorNode)) return null;

    const range = sel.getRangeAt(0);
    const rects = range.getClientRects();
    if (rects.length > 0) {
      const r = rects[0];
      if (r.width === 0 && r.height > 0) return r;
      if (r.height > 0) return r;
    }

    const span = document.createElement("span");
    span.textContent = "\u200b";
    range.insertNode(span);
    const spanRect = span.getBoundingClientRect();
    const parent = span.parentNode;
    parent?.removeChild(span);
    range.collapse(true);
    return spanRect.height > 0 ? spanRect : null;
  }, [editorElement]);

  const fetchSuggestion = useCallback(async () => {
    const context = getContextTextRef.current();
    const words = context.trim().split(/\s+/);
    if (words.length < MIN_CONTEXT_WORDS) return;
    if (context === lastContextRef.current) return;
    lastContextRef.current = context;

    const truncated = context.slice(-MAX_CONTEXT_CHARS);
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
          max_tokens: 60,
          temperature: 0.5,
          messages: [
            {
              role: "system",
              content:
                "You are an autocomplete assistant. Continue the user's text naturally. Output ONLY the continuation — no quotes, no preamble, no repeating existing text. Write 1 short sentence at most.",
            },
            { role: "user", content: truncated },
          ],
        }),
      });

      if (!res.ok || controller.signal.aborted) return;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text || controller.signal.aborted) return;

      const rect = getCaretRect();
      if (!rect) return;

      suggestionRef.current = text;
      setSuggestion(text);
      setPosition({ x: rect.right, y: rect.top });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Autocomplete error:", err);
      }
    }
  }, [getCaretRect]);

  // Attach event listeners — NO suggestion in deps to avoid resetting the timer
  useEffect(() => {
    if (!editorElement) return;

    function handleInput() {
      clearRef.current();
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void fetchSuggestion();
      }, DEBOUNCE_MS);
    }

    function handleKeyDown(e: KeyboardEvent) {
      const currentSuggestion = suggestionRef.current;
      if (currentSuggestion && e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        onAcceptRef.current(currentSuggestion);
        clearRef.current();
        return;
      }
      if (currentSuggestion && e.key === "Escape") {
        e.preventDefault();
        clearRef.current();
        return;
      }
    }

    function handleMouseDown() {
      if (suggestionRef.current) clearRef.current();
    }

    editorElement.addEventListener("input", handleInput);
    editorElement.addEventListener("keydown", handleKeyDown, { capture: true });
    editorElement.addEventListener("mousedown", handleMouseDown);

    // Also observe mutations as a fallback since CKEditor may not always fire input
    const observer = new MutationObserver(() => {
      if (!suggestionRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          void fetchSuggestion();
        }, DEBOUNCE_MS);
      }
    });
    observer.observe(editorElement, { childList: true, subtree: true, characterData: true });

    return () => {
      editorElement.removeEventListener("input", handleInput);
      editorElement.removeEventListener("keydown", handleKeyDown, { capture: true });
      editorElement.removeEventListener("mousedown", handleMouseDown);
      observer.disconnect();
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [editorElement, fetchSuggestion]);

  // Dismiss on click outside editor
  useEffect(() => {
    if (!suggestion) return;
    function handleClick(e: MouseEvent) {
      if (editorElement && !editorElement.contains(e.target as Node)) {
        clearRef.current();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [suggestion, editorElement]);

  if (!suggestion || !position) return null;

  return (
    <span
      className="fixed pointer-events-none text-content-tertiary/40 font-serif z-[100] whitespace-pre select-none"
      style={{
        left: position.x,
        top: position.y,
        fontSize: 16,
        lineHeight: "1.8",
        maxWidth: 400,
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {suggestion}
      <span className="ml-2 inline-flex items-center rounded bg-canvas-hover/80 px-1 py-0.5 text-[9px] font-mono text-content-tertiary/60 font-sans">
        Tab
      </span>
    </span>
  );
}
