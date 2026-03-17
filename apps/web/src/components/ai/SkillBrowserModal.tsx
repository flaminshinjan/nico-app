import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { skills as builtInSkills, skillCategories, type Skill } from "@/data/skills";
import { useCustomSkills, type CustomSkill } from "@/hooks/useCustomSkills";
import { SkillIcon } from "@/components/ui/SkillIcon";

type SkillBrowserModalProps = {
  selectedSkillId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

const ICON_OPTIONS = [
  "sparkles", "lightbulb", "rocket", "shield", "globe",
  "heart", "award", "briefcase", "bar-chart", "pie-chart",
  "pen", "file-code", "server", "mail", "mic",
];

export function SkillBrowserModal({ selectedSkillId, onSelect, onClose }: SkillBrowserModalProps) {
  const { customSkills, deleteSkill } = useCustomSkills();
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"browse" | "create" | "edit">("browse");
  const [editingSkill, setEditingSkill] = useState<CustomSkill | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === "browse") searchRef.current?.focus();
  }, [view]);

  const allSkills: (Skill | CustomSkill)[] = [...builtInSkills, ...customSkills];

  const filtered = allSkills.filter((s) => {
    if (filter === "custom") return "isCustom" in s;
    if (filter && s.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  function handleCreated(id: string) {
    setView("browse");
    onSelect(id);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl bg-canvas-elevated shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 shrink-0">
          <h2 className="text-sm font-semibold text-content-primary flex-1">
            {view === "create" ? "Create Custom Skill" : view === "edit" ? "Edit Skill" : "Choose a Skill"}
          </h2>
          {view !== "browse" && (
            <button
              type="button"
              onClick={() => { setView("browse"); setEditingSkill(null); }}
              className="text-[12px] text-content-tertiary hover:text-content-primary transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-content-tertiary hover:text-content-primary rounded-md hover:bg-canvas-hover transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {view === "browse" ? (
          <>
            {/* Search */}
            <div className="px-5 pb-3">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full rounded-md bg-transparent border border-line px-3 py-1.5 text-[13px] text-content-primary outline-none placeholder:text-content-tertiary focus:border-accent/40 transition-colors"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 px-5 pb-3 overflow-x-auto shrink-0">
              {[{ id: null, label: "All" }, ...skillCategories.map((c) => ({ id: c.id as string, label: c.label })), { id: "custom", label: "Custom" }].map(
                (cat) => (
                  <button
                    key={cat.id ?? "all"}
                    type="button"
                    onClick={() => setFilter(filter === cat.id ? null : cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                      filter === cat.id
                        ? "bg-accent/15 text-accent"
                        : "text-content-tertiary hover:text-content-secondary hover:bg-canvas-hover"
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              )}
            </div>

            {/* Skills grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-2 gap-1.5">
                {filtered.map((skill) => {
                  const isCustom = "isCustom" in skill;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => onSelect(skill.id)}
                      className={`group relative flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selectedSkillId === skill.id
                          ? "bg-accent/10"
                          : "hover:bg-canvas-hover"
                      }`}
                    >
                      <SkillIcon name={skill.icon} className="w-4 h-4 flex-shrink-0 mt-0.5 text-content-secondary" />
                      <div className="min-w-0 flex-1">
                        <div className={`text-[12px] font-medium truncate ${selectedSkillId === skill.id ? "text-accent" : "text-content-primary"}`}>
                          {skill.name}
                        </div>
                        <div className="text-[10px] text-content-tertiary truncate mt-0.5">
                          {skill.description}
                        </div>
                      </div>
                      {isCustom && (
                        <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSkill(skill as CustomSkill);
                              setView("edit");
                            }}
                            className="p-1 rounded text-content-tertiary hover:text-content-primary hover:bg-canvas-active transition-colors"
                            aria-label="Edit"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSkill(skill.id);
                            }}
                            className="p-1 rounded text-content-tertiary hover:text-accent-error hover:bg-accent-error/10 transition-colors"
                            aria-label="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <p className="text-center text-[13px] text-content-tertiary py-8">
                  No skills found
                </p>
              )}
            </div>

            {/* Create button */}
            <div className="px-5 py-3 shrink-0">
              <button
                type="button"
                onClick={() => setView("create")}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-[13px] font-medium text-accent hover:bg-accent/15 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Custom Skill
              </button>
            </div>
          </>
        ) : view === "create" ? (
          <SkillForm onSave={handleCreated} />
        ) : editingSkill ? (
          <SkillForm
            initial={editingSkill}
            onSave={() => { setView("browse"); setEditingSkill(null); }}
          />
        ) : null}
      </div>
    </div>,
    document.body
  );
}

function SkillForm({
  initial,
  onSave,
}: {
  initial?: CustomSkill;
  onSave: (id: string) => void;
}) {
  const { addSkill, updateSkill } = useCustomSkills();
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "sparkles");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prompt, setPrompt] = useState(initial?.systemPrompt ?? "");
  const [category, setCategory] = useState<Skill["category"]>(initial?.category ?? "professional");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;

    if (initial) {
      updateSkill(initial.id, { name: name.trim(), icon, description: description.trim(), systemPrompt: prompt.trim(), category });
      onSave(initial.id);
    } else {
      const id = addSkill({ name: name.trim(), icon, description: description.trim(), systemPrompt: prompt.trim(), category });
      onSave(id);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
      {/* Icon picker */}
      <div>
        <label className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider mb-1.5 block">
          Icon
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {ICON_OPTIONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setIcon(iconName)}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                icon === iconName
                  ? "bg-accent/15 ring-1 ring-accent/30 text-accent"
                  : "text-content-secondary hover:bg-canvas-hover"
              }`}
            >
              <SkillIcon name={iconName} className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider mb-1.5 block">
          Name
        </label>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Startup Advisor"
          className="w-full rounded-md bg-transparent border border-line px-3 py-2 text-[13px] text-content-primary outline-none placeholder:text-content-tertiary focus:border-accent/40 transition-colors"
          maxLength={40}
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider mb-1.5 block">
          Short description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Pitch decks, investor updates"
          className="w-full rounded-md bg-transparent border border-line px-3 py-2 text-[13px] text-content-primary outline-none placeholder:text-content-tertiary focus:border-accent/40 transition-colors"
          maxLength={80}
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider mb-1.5 block">
          Category
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {skillCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                category === cat.id
                  ? "bg-accent/15 text-accent"
                  : "text-content-tertiary hover:text-content-secondary hover:bg-canvas-hover"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* System prompt */}
      <div className="flex-1">
        <label className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider mb-1.5 block">
          System prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the skill's expertise, writing style, document structure preferences, and any specific instructions..."
          className="w-full rounded-md bg-transparent border border-line px-3 py-2 text-[13px] text-content-primary outline-none placeholder:text-content-tertiary resize-none focus:border-accent/40 transition-colors"
          rows={6}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!name.trim() || !prompt.trim()}
        className="w-full rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-content-inverse transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {initial ? "Save Changes" : "Create Skill"}
      </button>
    </form>
  );
}
