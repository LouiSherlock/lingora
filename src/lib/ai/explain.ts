import { z } from "zod";
import { chatCompletion, type ChatMessage } from "./client";
import { AiError } from "./errors";
import { tutorSystemPrompt } from "./prompts";
import { type Provider } from "./settings";

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const requestSchema = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().max(500).optional(),
  explanation: z.string().max(4000).optional(),
  followUp: z.string().min(1).max(1000),
  history: z.array(turnSchema).max(20).optional(),
});

export type TutorInput = z.infer<typeof requestSchema>;
export type TutorTurn = { role: "user" | "assistant"; content: string };

export function parseTutorRequest(body: unknown): TutorInput {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) throw new AiError("invalid-request", "问题内容无效。");
  return parsed.data;
}

export type AskTutorInput = TutorInput & {
  conversationId: string;
  provider: Provider;
  signal?: AbortSignal;
};

/**
 * Answers a follow-up about one question. Continuity does not depend on the
 * provider: the client sends back the previous turns of this practice, so the
 * tutor keeps its thread even when the provider has no conversation support.
 */
export async function askTutor(input: AskTutorInput): Promise<{ reply: string; aiSessionId: string }> {
  const context = [
    `题目：${input.question}`,
    input.answer ? `正确答案：${input.answer}` : "",
    input.explanation ? `解析：${input.explanation}` : "",
  ].filter(Boolean).join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: tutorSystemPrompt },
    { role: "user", content: context },
    ...(input.history ?? []).slice(-20).map((turn) => ({ role: turn.role, content: turn.content })),
    { role: "user", content: input.followUp },
  ];

  const result = await chatCompletion(input.provider, {
    messages,
    sessionId: input.conversationId,
    timeoutMs: 30_000,
    signal: input.signal,
  });

  return { reply: result.content, aiSessionId: result.sessionId || input.conversationId };
}
