import { useState } from "react";

const PLACEHOLDER_OUTLINE = [
  { id: "1", title: "Introduction", level: 0 },
  { id: "2", title: "Related Work", level: 0 },
  { id: "3", title: "Spatio-Temporal Graph...", level: 0 },
  { id: "4", title: "Continual Learning and...", level: 0 },
  { id: "5", title: "Energy-Efficient Deep...", level: 0 },
  { id: "6", title: "Summary and Researc...", level: 0 },
  { id: "7", title: "Methodology", level: 0 },
  { id: "8", title: "Model Architecture", level: 1 },
  { id: "9", title: "Dataset and Preproces...", level: 1 },
  { id: "10", title: "Training Configurations", level: 1 },
  { id: "11", title: "Energy Measurement", level: 1 },
  { id: "12", title: "Evaluation Metrics", level: 1 },
  { id: "13", title: "RESULTS AND ANALYSIS", level: 0 },
  { id: "14", title: "Base Training Energy O...", level: 1 },
  { id: "15", title: "Continual Learning Effi...", level: 1 },
];

interface OutlineItem {
  id: string;
  title: string;
  level: number;
}

function OutlineItemRow({ item }: { item: OutlineItem }) {
  return (
    <button
      type="button"
      className="w-full text-left py-1.5 px-3 text-sm text-slate-700 hover:bg-slate-100 rounded truncate"
      style={{ paddingLeft: `${12 + item.level * 12}px` }}
    >
      {item.title}
    </button>
  );
}

export function DocumentOutlinePanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-12 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col items-center py-4">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
          aria-label="Expand outline panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <span className="text-sm font-medium text-slate-800">
          Document tabs
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
            aria-label="Add document"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
            aria-label="Collapse panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="px-2 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 rounded">
          <span className="text-sm text-slate-700 truncate flex-1">Tab 1</span>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label="Tab options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Document outline
        </div>
        {PLACEHOLDER_OUTLINE.map((item) => (
          <OutlineItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
