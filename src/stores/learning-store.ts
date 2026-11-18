"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Practice } from "../lib/practice-data";

type AnswerMap = Record<string, string>;
type LearningState = {
  active: Practice | null; answers: AnswerMap; current: number; uncertain: string[]; submitted: string[]; completed: string[]; history: Practice[];
  latestResult: { practice: Practice; answers: AnswerMap } | null;
  settings: { baseUrl: string; model: string; models: string[]; rememberKey: boolean };
  start: (p: Practice) => void; answer: (id: string, value: string) => void; go: (n: number) => void;
  submit: (id: string) => void; advance: () => void; discard: () => void;
  toggleUncertain: (id: string) => void; finish: () => void; updateSettings: (s: Partial<LearningState["settings"]>) => void;
};
export const useLearningStore = create<LearningState>()(persist((set, get) => ({
  active: null, answers: {}, current: 0, uncertain: [], submitted: [], completed: [], history: [], latestResult: null,
  settings: { baseUrl: "https://opencode.ai/inference/openai/v1", model: "", models: [], rememberKey: true },
  start: (p) => set({ active: p, answers: {}, current: 0, uncertain: [], submitted: [], completed: [] }),
  answer: (id, value) => set({ answers: { ...get().answers, [id]: value } }),
  go: (n) => set({ current: Math.max(0, Math.min(n, (get().active?.questions.length ?? 1) - 1)) }),
  submit: (id) => set({ submitted: get().submitted.includes(id) ? get().submitted : [...get().submitted, id] }),
  advance: () => {
    const { active, current, submitted, completed } = get();
    if (!active) return;
    const id = active.questions[current]?.id;
    const nextCompleted = id && submitted.includes(id) && !completed.includes(id) ? [...completed, id] : completed;
    set({ completed: nextCompleted, current: Math.min(current + 1, active.questions.length - 1) });
  },
  discard: () => set({ active: null, answers: {}, current: 0, uncertain: [], submitted: [], completed: [] }),
  toggleUncertain: (id) => set({ uncertain: get().uncertain.includes(id) ? get().uncertain.filter((x) => x !== id) : [...get().uncertain, id] }),
  finish: () => { const { active, answers, history } = get(); if (!active) return; set({ history: [active, ...history], latestResult: { practice: active, answers }, active: null, answers: {}, current: 0, uncertain: [], submitted: [], completed: [] }); },
  updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
}), { name: "englishflow-state", storage: createJSONStorage(() => localStorage), partialize: (s) => ({ active: s.active, answers: s.answers, current: s.current, uncertain: s.uncertain, submitted: s.submitted, completed: s.completed, history: s.history, latestResult: s.latestResult, settings: s.settings }) as LearningState }));
