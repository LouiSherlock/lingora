'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UIMessage } from 'ai';
import type { Practice } from '../lib/practice-data';

/** question.id -> 用户原始答案（选项 key 或填空文本），不做标准化。 */
type AnswerMap = Record<string, string>;

type LearningState = {
  /** 正在作答的练习；null 表示没有进行中的练习。刷新后从 localStorage 恢复。 */
  active: Practice | null;
  /** 本次练习的答案，按 question.id 索引。 */
  answers: AnswerMap;
  /** 当前题目下标（0-based），始终夹在 0..questions.length-1。 */
  current: number;
  /** 已提交答案的题目 id；提交后题目锁定，不能再修改答案。 */
  submitted: string[];
  /** 已提交并进入下一题的题目 id；只用于进度条的“已完成”数量。 */
  completed: string[];
  /** 本次练习的 AI 助教对话；仅客户端使用，最多保留最近 40 条。 */
  tutorMessages: UIMessage[];
  /** 最近一次完成练习的快照；active 清空后供结果页渲染。 */
  latestResult: { practice: Practice; answers: AnswerMap } | null;
  /** AI 设置：当前模型 + 最近一次拉取的模型列表；持久化。 */
  settings: { model: string; models: string[] };

  /** 开始新练习：重置本次答题状态，保留结果和设置。 */
  start: (p: Practice) => void;
  /** 写入/覆盖某题答案；不校验、不提交。 */
  answer: (id: string, value: string) => void;
  /** 跳转到指定题，自动夹取范围；不改变完成状态。 */
  go: (n: number) => void;
  /** 幂等标记某题已提交；题目随后锁定。 */
  submit: (id: string) => void;
  /** 进入下一题：当前题已提交时计入 completed；最后一题保持下标不变。 */
  advance: () => void;
  /** 放弃当前练习并清空本次状态。 */
  discard: () => void;
  /** 完成练习：写入 latestResult，清空本次状态；设置不变。 */
  finish: () => void;
  /** 保存助教对话，自动截取最近 40 条；刷新后由 persist 恢复。 */
  setTutorMessages: (messages: UIMessage[]) => void;
  /** 浅合并 AI 设置（模型/模型列表）。 */
  updateSettings: (s: Partial<LearningState['settings']>) => void;
};
export const useLearningStore = create<LearningState>()(persist((set, get) => ({
  active: null, answers: {}, current: 0, submitted: [], completed: [], tutorMessages: [], latestResult: null,
  settings: { model: 'deepseek-v4.1-flash', models: [] },
  start: (p) => set({ active: p, answers: {}, current: 0, submitted: [], completed: [], tutorMessages: [] }),
  answer: (id, value) => set({ answers: { ...get().answers, [id]: value } }),
  go: (n) => set({ current: Math.max(0, Math.min(n, (get().active?.questions.length ?? 1) - 1)) }),
  // 幂等：重复提交同一题不会产生重复 id。
  submit: (id) => set({ submitted: get().submitted.includes(id) ? get().submitted : [...get().submitted, id] }),
  advance: () => {
    const { active, current, submitted, completed } = get();
    if (!active) return;
    const id = active.questions[current]?.id;
    // 只有“已提交”的题才计入 completed；跳过题只移动 current。
    const nextCompleted = id && submitted.includes(id) && !completed.includes(id) ? [...completed, id] : completed;
    set({ completed: nextCompleted, current: Math.min(current + 1, active.questions.length - 1) });
  },
  discard: () => set({ active: null, answers: {}, current: 0, submitted: [], completed: [], tutorMessages: [] }),
  finish: () => {
    const { active, answers } = get();
    if (!active) return;
    // 先快照再清空：结果页读 latestResult。
    set({ latestResult: { practice: active, answers }, active: null, answers: {}, current: 0, submitted: [], completed: [], tutorMessages: [] });
  },
  setTutorMessages: (messages) => {
    if (!get().active) return;
    set({ tutorMessages: messages.slice(-40) });
  },
  updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
}), {
  name: 'lingora',
  storage: createJSONStorage(() => sessionStorage),
  // 只持久化数据字段；action 不写入 localStorage。
  partialize: (s) => ({
    active: s.active,
    answers: s.answers,
    current: s.current,
    submitted: s.submitted,
    completed: s.completed,
    tutorMessages: s.tutorMessages,
    latestResult: s.latestResult,
    settings: s.settings
  }) as LearningState
}));
