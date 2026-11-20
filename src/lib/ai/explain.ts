import { convertToModelMessages, type ModelMessage, type UIMessage } from "ai";
import { z } from "zod";
import { streamChatCompletion } from "@/lib/ai/client.ts";
import { AiError } from "@/lib/ai/errors.ts";
import { tutorSystemPrompt } from "@/lib/ai/prompts.ts";

const requestSchema = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().max(500).optional(),
  options: z.array(z.object({
    key: z.string().max(20),
    text: z.string().max(500),
  })).max(4).optional(),
  messages: z.array(z.unknown()).min(1).max(40),
});

type TutorInput = z.infer<typeof requestSchema>;

export function parseTutorRequest(body: unknown): TutorInput {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) throw new AiError("invalid-request", "问题内容无效。");
  return parsed.data;
}

export async function streamTutorReply(input: TutorInput & { model: string; messages: UIMessage[]; signal?: AbortSignal }) {
  const context = [
    `题目：${input.question}`,
    input.options?.length ? `选项：${input.options.map((option) => `${option.key}. ${option.text}`).join("；")}` : "",
    input.answer ? `用户回答：${input.answer}` : "",
  ].filter(Boolean).join("\n");
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
