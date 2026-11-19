import { z } from "zod";
import type { Question } from "../../practice-data";
import { AiError } from "../errors";

export const QUESTION_TYPES: Question["type"][] = ["single_choice", "fill_blank", "true_false"];

const LIMITS = { stem: 400, explanation: 2000, option: 300, point: 60, points: 6, options: 6 } as const;

const payloadSchema = z.object({ questions: z.array(z.unknown()).min(1) });

type RawQuestion = Partial<Question> & { options?: unknown; knowledgePoints?: unknown; answer?: unknown };

function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function knowledgePoints(value: unknown, fallback: string): string[] {
  if (!Array.isArray(value)) return [fallback];
  const points = value
    .map((point) => text(point, LIMITS.point))
    .filter((point): point is string => point.length > 0)
    .slice(0, LIMITS.points);
  return points.length ? points : [fallback];
}

function normalizeAnswerToken(value: string) {
  return value.trim().replace(/[.、：:？?)\]}】"]+$/u, "").toUpperCase();
}

function normalizeOptions(value: unknown): { key: string; text: string }[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<{ key: string; text: string }[]>((list, option, index) => {
    if (list.length >= LIMITS.options || !option || typeof option !== "object") return list;
    const candidate = option as { key?: unknown; text?: unknown };
    const label = text(candidate.text, LIMITS.option);
    if (!label) return list;
    const key = typeof candidate.key === "string" && candidate.key.trim() ? normalizeAnswerToken(candidate.key).slice(0, 4) : String.fromCharCode(65 + index);
    list.push({ key, text: label });
    return list;
  }, []);
}

/**
 * Coerces one model-authored question into the shape the UI renders. Unknown or
 * malformed fields are dropped instead of reaching components.
 */
export function normalizeQuestion(raw: unknown, index: number, level: string, topic: string): Question | null {
  const source = raw && typeof raw === "object" ? raw as RawQuestion : {};
  const stem = text(source.stem, LIMITS.stem);
  const answer = text(source.answer, LIMITS.option);
  const explanation = text(source.explanation, LIMITS.explanation);
  const points = knowledgePoints(source.knowledgePoints, topic);
  const options = normalizeOptions(source.options);
  const declared = source.type === "single_choice" || source.type === "true_false" || source.type === "fill_blank" ? source.type : null;
  const type = declared ?? (options.length ? "single_choice" : "fill_blank");

  if (!stem || !answer) return null;

  if (type === "fill_blank") {
    return { id: `q${index + 1}`, type, level, knowledgePoints: points, stem, options: [], answer, explanation };
  }

  if (type === "true_false") {
    const token = normalizeAnswerToken(answer).toLowerCase();
    const isTrue = ["A", "TRUE", "T", "正确", "对"].includes(token);
    const isFalse = ["B", "FALSE", "F", "错误", "错"].includes(token);
    const matching = options.find((option) => option.text.toLowerCase() === answer.toLowerCase());
    return {
      id: `q${index + 1}`,
      type,
      level,
      knowledgePoints: points,
      stem,
      options: [{ key: "A", text: "正确" }, { key: "B", text: "错误" }],
      answer: isTrue ? "A" : isFalse ? "B" : matching?.key ?? "A",
      explanation,
    };
  }

  if (options.length < 2) return null;
  const token = normalizeAnswerToken(answer);
  const matching = options.find((option) => option.text.trim().toLowerCase() === answer.toLowerCase());
  const key = matching?.key ?? (options.some((option) => normalizeAnswerToken(option.key) === token) ? token : "");
  if (!key) return null;
  return { id: `q${index + 1}`, type: "single_choice", level, knowledgePoints: points, stem, options, answer: key, explanation };
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

export function typeCoverage(questions: Question[]): number {
  return QUESTION_TYPES.filter((type) => questions.some((question) => question.type === type)).length;
}
