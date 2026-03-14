import { EditorConnectorProvider } from "./contexts/EditorConnectorContext";
import { EditorLayout } from "./layouts/EditorLayout";

function App() {
  return (
    <EditorConnectorProvider>
      <EditorLayout />
    </EditorConnectorProvider>
  );
}

export default App;
