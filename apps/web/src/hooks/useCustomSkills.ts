import { useCallback, useSyncExternalStore } from "react";
import type { Skill } from "@/data/skills";

export type CustomSkill = Skill & {
  systemPrompt: string;
  isCustom: true;
};

const STORAGE_KEY = "custom-skills";
const EMPTY: CustomSkill[] = [];

let listeners: Array<() => void> = [];
let cachedRaw: string | null = null;
let cachedResult: CustomSkill[] = EMPTY;

function emitChange() {
  cachedRaw = null;
  for (const fn of listeners) fn();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): CustomSkill[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedResult;
  cachedRaw = raw;
  try {
    cachedResult = raw ? (JSON.parse(raw) as CustomSkill[]) : EMPTY;
  } catch {
    cachedResult = EMPTY;
  }
  return cachedResult;
}

function getServerSnapshot(): CustomSkill[] {
  return EMPTY;
}

function save(skills: CustomSkill[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
  emitChange();
}

export function useCustomSkills() {
  const customSkills = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addSkill = useCallback(
    (skill: Omit<CustomSkill, "isCustom" | "id">) => {
      const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newSkill: CustomSkill = { ...skill, id, isCustom: true };
      save([...getSnapshot(), newSkill]);
      return id;
    },
    []
  );

  const updateSkill = useCallback((id: string, patch: Partial<Omit<CustomSkill, "id" | "isCustom">>) => {
    save(getSnapshot().map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    save(getSnapshot().filter((s) => s.id !== id));
  }, []);

  return { customSkills, addSkill, updateSkill, deleteSkill };
}
