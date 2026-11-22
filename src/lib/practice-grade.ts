import type { Question } from "@/lib/practice-data.ts";

export function normalizeAnswer(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * The single grading rule: UI pages must not compare answers themselves.
 * 选择题/判断题的 answer 是选项 key，填空题是答案文本。
 */
export function isAnswerCorrect(question: Question, answer: string | undefined): boolean {
  return normalizeAnswer(answer) === normalizeAnswer(question.answer);
}

/** 把选项 key 换成展示文本；填空题或对不上时原样返回。 */
export function answerText(question: Question, answer = question.answer): string {
  const option = question.options.find((item) => normalizeAnswer(item.key) === normalizeAnswer(answer));
  return option ? option.text : answer;
}

/** 界面展示用："A. some"；填空题原样返回。 */
export function answerLabel(question: Question, answer = question.answer): string {
  const option = question.options.find((item) => normalizeAnswer(item.key) === normalizeAnswer(answer));
  return option ? `${option.key.toUpperCase()}. ${option.text}` : answer;
}
