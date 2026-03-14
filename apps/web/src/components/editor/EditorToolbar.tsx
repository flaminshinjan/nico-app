import { useEditorConnector } from "@/contexts/EditorConnectorContext";

declare const Api: {
  GetDocument: () => {
    CreateParagraph: () => { AddElement: (r: unknown) => void };
    InsertContent: (c: unknown[]) => void;
  };
  CreateParagraph: () => { AddElement: (r: unknown) => void };
  CreateRun: () => {
    SetBold: (v: boolean) => void;
    SetItalic: (v: boolean) => void;
    SetUnderline: (v: boolean) => void;
    AddText: (s: string) => void;
    AddElement: (r: unknown) => void;
  };
};

type ToolbarAction = {
  id: string;
  label: string;
  method?: string;
  args?: unknown[];
  exec?: "bold" | "italic" | "underline";
};

const FORMAT_ACTIONS: ToolbarAction[] = [
  { id: "bold", label: "Bold", exec: "bold" },
  { id: "italic", label: "Italic", exec: "italic" },
  { id: "underline", label: "Underline", exec: "underline" },
  { id: "align-left", label: "Align left", method: "FocusEditor" },
  { id: "align-center", label: "Align center", method: "FocusEditor" },
  { id: "align-right", label: "Align right", method: "FocusEditor" },
  { id: "align-justify", label: "Justify", method: "FocusEditor" },
  { id: "list-bullet", label: "Bullet list", method: "FocusEditor" },
  { id: "list-number", label: "Numbered list", method: "FocusEditor" },
  { id: "link", label: "Insert link", method: "FocusEditor" },
  { id: "image", label: "Insert image", method: "FocusEditor" },
  { id: "table", label: "Insert table", method: "FocusEditor" },
];


function ToolbarButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export function EditorToolbar() {
  const { connector } = useEditorConnector();

  const handleAction = (action: ToolbarAction) => {
    if (!connector) return;

    if (action.exec === "bold") {
      connector.callCommand(
        () => {
          const oDocument = Api.GetDocument();
          const oParagraph = Api.CreateParagraph();
          const oRun = Api.CreateRun();
          oRun.SetBold(true);
          oRun.AddText(" ");
          oParagraph.AddElement(oRun);
          oDocument.InsertContent([oParagraph]);
        },
        undefined,
        false
      );
      return;
    }

    if (action.exec === "italic") {
      connector.callCommand(
        () => {
          const oDocument = Api.GetDocument();
          const oParagraph = Api.CreateParagraph();
          const oRun = Api.CreateRun();
          oRun.SetItalic(true);
          oRun.AddText(" ");
          oParagraph.AddElement(oRun);
          oDocument.InsertContent([oParagraph]);
        },
        undefined,
        false
      );
      return;
    }

    if (action.exec === "underline") {
      connector.callCommand(
        () => {
          const oDocument = Api.GetDocument();
          const oParagraph = Api.CreateParagraph();
          const oRun = Api.CreateRun();
          oRun.SetUnderline(true);
          oRun.AddText(" ");
          oParagraph.AddElement(oRun);
          oDocument.InsertContent([oParagraph]);
        },
        undefined,
        false
      );
      return;
    }

    if (action.method) {
      connector.executeMethod(action.method, action.args ?? [], () => {});
    }
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-t border-slate-200 bg-white">
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-500 px-2">100%</span>
        <button
          type="button"
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      <div className="w-px h-6 bg-slate-200 mx-2" />
      <select className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700">
        <option>Normal text</option>
      </select>
      <select className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700">
        <option>Arial</option>
      </select>
      <select className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 w-14">
        <option>11</option>
      </select>
      <div className="w-px h-6 bg-slate-200 mx-2" />
      {FORMAT_ACTIONS.map((action) => (
        <ToolbarButton
          key={action.id}
          label={action.label}
          onClick={() => handleAction(action)}
          disabled={!connector}
        />
      ))}
    </div>
  );
}
