import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type ConnectorExecuteMethod = (
  name: string,
  args: unknown[],
  callback?: (result: unknown) => void
) => void;

type ConnectorCallCommand = (
  fn: () => void,
  callback?: () => void,
  isNoCalc?: boolean
) => void;

type EditorConnector = {
  executeMethod: ConnectorExecuteMethod;
  callCommand: ConnectorCallCommand;
};

type EditorConnectorContextValue = {
  connector: EditorConnector | null;
  setConnector: (connector: EditorConnector | null) => void;
  isConnectorAvailable: boolean;
};

const EditorConnectorContext = createContext<EditorConnectorContextValue | null>(
  null
);

export function EditorConnectorProvider({ children }: { children: ReactNode }) {
  const [connector, setConnectorState] = useState<EditorConnector | null>(null);

  const setConnector = useCallback((c: EditorConnector | null) => {
    setConnectorState(c);
  }, []);

  return (
    <EditorConnectorContext.Provider
      value={{
        connector,
        setConnector,
        isConnectorAvailable: connector !== null,
      }}
    >
      {children}
    </EditorConnectorContext.Provider>
  );
}

export function useEditorConnector() {
  const context = useContext(EditorConnectorContext);
  if (!context) {
    throw new Error(
      "useEditorConnector must be used within EditorConnectorProvider"
    );
  }
  return context;
}
