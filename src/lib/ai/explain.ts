import { convertToModelMessages, type ModelMessage, type UIMessage } from "ai";
import { z } from "zod";
import { streamChatCompletion } from "@/lib/ai/client.ts";
import { AiError } from "@/lib/ai/errors.ts";
import { tutorSystemPrompt } from "@/lib/ai/prompts.ts";

const requestSchema = z.object({
  question: z.string().min(1).max(2000),
  /** 用户实际作答（已格式化成 "B. went" 这类展示文案；未作答时不传）。 */
  userAnswer: z.string().max(500).optional(),
  /** 题库里的正确答案，用于和用户回答对比。 */
  correctAnswer: z.string().max(500).optional(),
  options: z.array(z.object({
    key: z.string().max(20),
    text: z.string().max(500),
  })).max(6).optional(),
  messages: z.array(z.unknown()).min(1).max(40),
});

type TutorInput = z.infer<typeof requestSchema>;

export function parseTutorRequest(body: unknown): TutorInput {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) throw new AiError("invalid-request", "问题内容无效。");
  return parsed.data;
}

/** 把当前题目、用户回答和正确答案拼成助教的第一条上下文。 */
export function buildTutorContext(input: Pick<TutorInput, "question" | "options" | "userAnswer" | "correctAnswer">) {
  return [
    `题目：${input.question}`,
    input.options?.length ? `选项：${input.options.map((option) => `${option.key}. ${option.text}`).join("；")}` : "",
    `用户回答：${input.userAnswer?.trim() || "未作答"}`,
    input.correctAnswer ? `正确答案：${input.correctAnswer}` : "",
  ].filter(Boolean).join("\n");
}

export async function streamTutorReply(input: TutorInput & { model: string; messages: UIMessage[]; signal?: AbortSignal }) {
  const context = buildTutorContext(input);
  const history = await convertToModelMessages(input.messages);
  const messages: ModelMessage[] = [
    { role: "system", content: tutorSystemPrompt },
    { role: "user", content: context },
    ...history,
  ];

  return streamChatCompletion(input.model, messages, {
    timeoutMs: 30_000,
    signal: input.signal,
  });
}
