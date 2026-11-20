import type { Question } from "@/lib/practice-data.ts";

export function normalizeAnswer(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** The single grading rule: UI pages must not compare answers themselves. */
export function isAnswerCorrect(question: Question, answer: string | undefined): boolean {
  return normalizeAnswer(answer) === normalizeAnswer(question.answer);
}

/** "A. lives" for choices, the raw value for fill-in answers. */
export function answerLabel(question: Question, answer = question.answer): string {
  const option = question.options.find((item) => normalizeAnswer(item.key) === normalizeAnswer(answer));
  return option ? `${answer.toUpperCase()}. ${option.text}` : answer;
}
