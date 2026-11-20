import { z } from "zod";
import type { Practice, Question } from "@/lib/practice-data.ts";
import { chatCompletion, type ChatMessage } from "@/lib/ai/client.ts";
import { AiError } from "@/lib/ai/errors.ts";
import { practiceSystemPrompt, practiceTypeRepair } from "@/lib/ai/prompts.ts";
import { QUESTION_TYPES, normalizeQuestions, parseQuestionsPayload, typeCoverage } from "@/lib/ai/practice/normalize.ts";

const requestSchema = z.object({
  topic: z.string().max(120).optional(),
  level: z.string().max(2).optional(),
  difficulty: z.string().max(20).optional(),
  kind: z.string().max(20).optional(),
  custom: z.string().max(12_000).optional(),
  count: z.unknown().optional(),
});

type GenerateFields = {
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

type GenerateInput = GenerateFields & {
  model: string;
  signal?: AbortSignal;
};

const KIND_LABELS: Record<string, string> = { Grammar: "语法", Vocabulary: "词汇" };

const DIFFICULTY_LABELS: Record<string, string> = { Easy: "简单", Medium: "普通", Hard: "困难" };

const TYPE_LABELS: Record<Question["type"], string> = {
  single_choice: "单项选择",
  fill_blank: "填空",
  true_false: "判断",
};

/** 把创建页的选择拼成一段中文需求，而不是丢给模型一个 JSON。 */
function buildUserPrompt(input: GenerateFields): string {
  const requiredTypes = QUESTION_TYPES.map((type) => TYPE_LABELS[type]).join("、");
  return [
    "请生成一组英语练习题。",
    "",
    `- 学习类型：${KIND_LABELS[input.kind] ?? input.kind}`,
    `- 目标等级：${input.level}`,
    `- 知识点 / 主题：${input.topic}`,
    `- 难度：${DIFFICULTY_LABELS[input.difficulty] ?? input.difficulty}`,
    `- 题目数量：${input.count} 题`,
    `- 需要覆盖的题型：${requiredTypes}`,
    ...(input.custom ? [`- 额外要求：${input.custom}`] : []),
  ].join("\n");
}

/**
 * Asks the model for a question set.
 */
export async function generatePractice(input: GenerateInput): Promise<Practice> {
  const { topic, level, count } = input;
  const userPrompt = buildUserPrompt(input);

  async function request(extraInstruction = "") {
    const messages: ChatMessage[] = [
      { role: "system", content: extraInstruction ? `${practiceSystemPrompt}\n${extraInstruction}` : practiceSystemPrompt },
      { role: "user", content: userPrompt },
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
