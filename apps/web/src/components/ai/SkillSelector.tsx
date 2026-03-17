import { useState } from "react";
import { skills as builtInSkills, skillCategories, type Skill } from "@/data/skills";
import { useCustomSkills, type CustomSkill } from "@/hooks/useCustomSkills";
import { SkillBrowserModal } from "@/components/ai/SkillBrowserModal";
import { SkillIcon } from "@/components/ui/SkillIcon";

type SkillSelectorProps = {
  selectedSkillId: string | null;
  onSelect: (id: string | null) => void;
};

export function SkillSelector({ selectedSkillId, onSelect }: SkillSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { customSkills } = useCustomSkills();

  const allSkills: (Skill | CustomSkill)[] = [...builtInSkills, ...customSkills];
  const selected = selectedSkillId
    ? allSkills.find((s) => s.id === selectedSkillId)
    : null;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {selected ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 text-[12px] text-accent transition-colors hover:bg-accent/15"
          >
            <SkillIcon name={selected.icon} className="w-3.5 h-3.5" />
            <span className="font-medium max-w-[120px] truncate">{selected.name}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-content-tertiary transition-colors hover:text-content-secondary hover:bg-canvas-hover"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Skill</span>
          </button>
        )}

        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="p-0.5 rounded text-content-tertiary hover:text-content-primary hover:bg-canvas-hover transition-colors"
            aria-label="Clear skill"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isModalOpen && (
        <SkillBrowserModal
          selectedSkillId={selectedSkillId}
          onSelect={(id) => {
            onSelect(id);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export { skillCategories, builtInSkills };
