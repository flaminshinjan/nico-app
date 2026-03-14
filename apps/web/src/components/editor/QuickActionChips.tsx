const CHIPS = [
  "Match doc format",
  "Templates",
  "Meeting notes",
  "Email draft",
  "More",
];

export function QuickActionChips() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-slate-200 bg-slate-50">
      {CHIPS.map((label) => (
        <button
          key={label}
          type="button"
          className="px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
