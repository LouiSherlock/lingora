import { z } from "zod";
import type { Practice } from "../../practice-data";
import { chatCompletion, type ChatMessage } from "../client";
import { AiError } from "../errors";
import { practiceSystemPrompt, practiceTypeRepair } from "../prompts";
import { QUESTION_TYPES, normalizeQuestions, parseQuestionsPayload, typeCoverage } from "./normalize";

const requestSchema = z.object({
  topic: z.string().max(120).optional(),
  level: z.string().max(2).optional(),
  difficulty: z.string().max(20).optional(),
  kind: z.string().max(20).optional(),
  custom: z.string().max(12_000).optional(),
  count: z.unknown().optional(),
});

export type GenerateFields = {
  topic: string;
  level: string;
  difficulty: string;
  count: number;
  kind: string;
  custom: string;
};

export function parseGenerateFields(body: unknown): GenerateFields {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) throw new AiError("invalid-request");
  const { topic, level, difficulty, kind, custom, count } = parsed.data;
  return {
    topic: topic?.trim() || "英语练习",
    level: level && /^[A-C][1-2]$/.test(level) ? level : "A2",
    difficulty: difficulty ?? "Medium",
    kind: kind ?? "Grammar",
    custom: custom ?? "",
    count: Math.max(5, Math.min(20, Math.trunc(Number(count)) || 5)),
  };
}

export type GenerateInput = GenerateFields & {
  model: string;
  signal?: AbortSignal;
};

/**
 * Asks the model for a question set.
 */
export async function generatePractice(input: GenerateInput): Promise<Practice> {
  const { topic, level, difficulty, count, kind, custom } = input;
  const userPayload = JSON.stringify({ topic, level, difficulty, count, kind, custom, requiredTypes: QUESTION_TYPES });

  async function request(extraInstruction = "") {
    const messages: ChatMessage[] = [
      { role: "system", content: extraInstruction ? `${practiceSystemPrompt}\n${extraInstruction}` : practiceSystemPrompt },
      { role: "user", content: userPayload },
    ];
    const result = await chatCompletion(input.model, { messages, json: true, signal: input.signal });
    return normalizeQuestions(parseQuestionsPayload(result.content), { level, topic, count });
  }

  let questions = await request();
  if (!questions.length) throw new AiError("invalid-output", "AI 返回的题目格式不完整，请更换模型或重新生成。");

  if (count >= 3 && typeCoverage(questions) < QUESTION_TYPES.length) {
    try {
      const retry = await request(practiceTypeRepair);
      if (typeCoverage(retry) > typeCoverage(questions)) questions = retry;
    } catch {
      // Keep the first batch when the retry fails; partial type coverage is better than no practice.
    }
  }

  return {
    id: crypto.randomUUID(),
    title: `${topic} · ${level}`,
    questions,
    createdAt: new Date().toISOString(),
  };
}
