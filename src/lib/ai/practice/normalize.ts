import { z } from "zod";
import type { Question } from "@/lib/practice-data.ts";
import { AiError } from "@/lib/ai/errors.ts";
import { normalizeAnswer } from "@/lib/practice-grade.ts";

export const QUESTION_TYPES: Question["type"][] = ["single_choice", "fill_blank", "true_false"];

const LIMITS = { stem: 400, explanation: 2000, option: 300, point: 60, points: 6, options: 6 } as const;

const optionSchema = z.object({
  key: z.string().trim().min(1).max(4),
  text: z.string().trim().min(1).max(LIMITS.option),
});

/** 模型返回的一道题：只做类型/长度校验，不做语义改写。 */
const questionSchema = z.object({
  type: z.enum(["single_choice", "fill_blank", "true_false"]),
  level: z.string().max(20).optional(),
  knowledgePoints: z.array(z.string().trim().min(1).max(LIMITS.point)).max(LIMITS.points).optional(),
  stem: z.string().trim().min(1).max(LIMITS.stem),
  options: z.array(optionSchema).max(LIMITS.options).optional(),
  answer: z.string().trim().min(1).max(LIMITS.option),
  explanation: z.string().max(LIMITS.explanation).optional(),
});

const payloadSchema = z.object({ questions: z.array(z.unknown()).min(1) });

const TRUE_FALSE_OPTIONS = [{ key: "A", text: "正确" }, { key: "B", text: "错误" }];

function knowledgePoints(value: unknown, fallback: string): string[] {
  const points = z.array(z.string().trim().min(1).max(LIMITS.point)).max(LIMITS.points).safeParse(value);
  if (points.success && points.data.length) return points.data;
  const safeFallback = z.string().trim().min(1).max(LIMITS.point).safeParse(fallback);
  return [safeFallback.success ? safeFallback.data : "综合练习"];
}

function isTrueFalsePair(options: Question["options"]) {
  return options.length === 2
    && options[0].key.toUpperCase() === "A" && options[0].text === "正确"
    && options[1].key.toUpperCase() === "B" && options[1].text === "错误";
}

/**
 * Coerces one model-authored question into the shape the UI renders.
 * 只做 zod 类型校验 + 结构校验（答案必须是某个选项的 key）；对不上就丢弃该题，
 * 不做「按选项文本猜答案」这类改写。
 */
export function normalizeQuestion(raw: unknown, index: number, level: string, topic: string): Question | null {
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) return null;

  const { type, stem, answer, explanation = "" } = parsed.data;
  const options = parsed.data.options ?? [];
  const points = knowledgePoints(parsed.data.knowledgePoints, topic);
  const id = `q${index + 1}`;

  if (type === "fill_blank") {
    if (options.length) return null;
    return { id, type, level, knowledgePoints: points, stem, options: [], answer, explanation };
  }

  if (type === "true_false") {
    if (!isTrueFalsePair(options)) return null;
    const key = options.find((option) => normalizeAnswer(option.key) === normalizeAnswer(answer))?.key;
    if (!key) return null;
    return { id, type, level, knowledgePoints: points, stem, options: [...TRUE_FALSE_OPTIONS], answer: key, explanation };
  }

  if (options.length < 2) return null;
  const keys = new Set(options.map((option) => normalizeAnswer(option.key)));
  // 选项 key 不能重复，否则两个选项会共用一个答案。
  if (keys.size !== options.length) return null;
  const matched = options.find((option) => normalizeAnswer(option.key) === normalizeAnswer(answer));
  if (!matched) return null;
  return { id, type: "single_choice", level, knowledgePoints: points, stem, options, answer: matched.key, explanation };
}

/** Parses the model's JSON reply. Throws an AiError when it cannot be used at all. */
export function parseQuestionsPayload(content: string): unknown[] {
  let payload: unknown;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new AiError("invalid-output", "AI 返回的不是合法 JSON，请更换模型后重试。");
  }
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) throw new AiError("invalid-output", "AI 返回的题目格式无效，请更换模型或重新生成。");
  return parsed.data.questions;
}

export function normalizeQuestions(raw: unknown[], context: { level: string; topic: string; count: number }): Question[] {
  const seen = new Set<string>();
  const questions: Question[] = [];
  for (const item of raw) {
    const question = normalizeQuestion(item, questions.length, context.level, context.topic);
    if (!question) continue;
    const fingerprint = question.stem.toLowerCase();
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    questions.push(question);
    if (questions.length >= context.count) break;
  }
  return questions;
}
