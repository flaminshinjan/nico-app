import { useCallback } from "react";
import { useEditorConnector } from "@/contexts/EditorConnectorContext";

const EDITOR_ID = "docxEditor";

export function useOnlyOfficeConnector() {
  const { setConnector } = useEditorConnector();

  const initConnector = useCallback(() => {
    try {
      const win = window as Window & {
        DocEditor?: { instances?: Record<string, { createConnector?: () => unknown }> };
      };
      const instances = win.DocEditor?.instances;
      const docEditor = instances?.[EDITOR_ID];
      const rawConnector = docEditor?.createConnector?.();

      if (!rawConnector || typeof rawConnector !== "object") {
        return;
      }

      const c = rawConnector as {
        executeMethod?: (
          name: string,
          args: unknown[],
          callback?: (result: unknown) => void
        ) => void;
        callCommand?: (
          fn: () => void,
          callback?: () => void,
          isNoCalc?: boolean
        ) => void;
      };

      if (typeof c.executeMethod !== "function" || typeof c.callCommand !== "function") {
        return;
      }

      setConnector({
        executeMethod: c.executeMethod.bind(c),
        callCommand: c.callCommand.bind(c),
      });
    } catch {
      setConnector(null);
    }
  }, [setConnector]);

  return { initConnector };
}
