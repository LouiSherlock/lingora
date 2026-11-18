"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Practice, Question } from "../lib/practice-data";

type AnswerMap = Record<string, string>;
type LearningState = {
  active: Practice | null; answers: AnswerMap; current: number; uncertain: string[]; history: Practice[];
  latestResult: { practice: Practice; answers: AnswerMap } | null;
  mistakes: { question: Question; userAnswer: string; date: string }[];
  settings: { provider: "compatible" | "openai" | "gemini"; baseUrl: string; model: string; apiKey: string };
  start: (p: Practice) => void; answer: (id: string, value: string) => void; go: (n: number) => void;
  toggleUncertain: (id: string) => void; finish: () => void; updateSettings: (s: Partial<LearningState["settings"]>) => void;
};
export const useLearningStore = create<LearningState>()(persist((set, get) => ({
  active: null, answers: {}, current: 0, uncertain: [], history: [], latestResult: null, mistakes: [],
  settings: { provider: "compatible", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", apiKey: "" },
  start: (p) => set({ active: p, answers: {}, current: 0, uncertain: [] }),
  answer: (id, value) => set({ answers: { ...get().answers, [id]: value } }),
  go: (n) => set({ current: Math.max(0, Math.min(n, (get().active?.questions.length ?? 1) - 1)) }),
  toggleUncertain: (id) => set({ uncertain: get().uncertain.includes(id) ? get().uncertain.filter((x) => x !== id) : [...get().uncertain, id] }),
  finish: () => { const { active, answers, history, mistakes } = get(); if (!active) return; const newMistakes = active.questions.filter((q) => (answers[q.id] ?? "").trim().toLowerCase() !== q.answer.trim().toLowerCase()).map((question) => ({ question, userAnswer: answers[question.id] ?? "", date: new Date().toISOString() })); set({ history: [active, ...history], latestResult: { practice: active, answers }, mistakes: [...newMistakes, ...mistakes], active: null, answers: {}, current: 0, uncertain: [] }); },
  updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
}), { name: "englishflow-state", storage: createJSONStorage(() => localStorage), partialize: (s) => ({ history: s.history, mistakes: s.mistakes, latestResult: s.latestResult, settings: { ...s.settings, apiKey: "" } }) as LearningState }));
