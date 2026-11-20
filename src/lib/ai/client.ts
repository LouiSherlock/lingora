import { APICallError, generateText, RetryError, streamText, type ModelMessage } from "ai";
import { AiError } from "@/lib/ai/errors.ts";
import { opencode, readProviderAPIKey } from "@/lib/ai/settings.ts";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatOptions = {
  messages: ChatMessage[];
  /** Ask the provider for a JSON object response. */
  json?: boolean;
  timeoutMs?: number;
  /** Caller's abort signal (client disconnect, page navigation). */
  signal?: AbortSignal;
};

type ChatResult = { content: string };

/** Guards against a provider streaming megabytes back into the JSON parser. */
const MAX_BODY_LENGTH = 2_000_000;

function failure(status: number): AiError {
  if (status === 401 || status === 403) return new AiError("config", `AI 服务鉴权失败（HTTP ${status}），请检查 API Key。`);
  if (status === 429) return new AiError("upstream", "AI 服务限流（HTTP 429），请稍后重试。", 503);
  return new AiError("upstream", `AI 服务请求失败（HTTP ${status}），请检查接口地址与模型。`);
}

function transportError(error: unknown): AiError {
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError" || name === "AbortError") return new AiError("timeout", "AI 服务响应超时，请稍后重试。");
  return new AiError("upstream", "无法连接 AI 服务，请检查接口地址是否可访问。");
}

/** Maps AI SDK provider failures to the errors the routes already speak. */
function providerError(error: unknown): AiError {
  if (RetryError.isInstance(error)) return providerError(error.lastError);
  if (APICallError.isInstance(error)) {
    return typeof error.statusCode === "number"
      ? failure(error.statusCode)
      : new AiError("upstream", "无法连接 AI 服务，请检查接口地址是否可访问。");
  }
  return transportError(error);
}

/**
 * One chat completion through the AI SDK's OpenAI-compatible provider.
 *
 * The singleton OpenAI-compatible client is reused for every request; only
 * the selected model and request payload vary.
 */
export async function chatCompletion(model: string, options: ChatOptions): Promise<ChatResult> {
  const system = options.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .filter(Boolean)
    .join("\n\n");
  const messages = options.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));

  let result: Awaited<ReturnType<typeof generateText>>;
  try {
    result = await generateText({
      model: opencode.chatModel(model),
      ...(system ? { system } : {}),
      messages,
      ...(options.json ? { responseFormat: { type: "json" as const } } : {}),
      // The callers already retry deliberately (e.g. the question-type repair pass).
      maxRetries: 0,
      timeout: options.timeoutMs ?? 60_000,
      ...(options.signal ? { abortSignal: options.signal } : {}),
    });
  } catch (error) {
    throw providerError(error);
  }

  if (!result.text.trim()) throw new AiError("invalid-output", "AI 没有返回内容，请稍后重试。");
  return { content: result.text };
}

export function streamChatCompletion(model: string, messages: ModelMessage[], options: Omit<ChatOptions, "messages" | "json"> = {}) {
  const system = messages
    .filter((message) => message.role === "system" && typeof message.content === "string")
    .map((message) => message.content)
    .filter(Boolean)
    .join("\n\n");
  const chatMessages = messages.filter((message) => message.role !== "system");

  try {
    return streamText({
      model: opencode.chatModel(model),
      ...(system ? { system } : {}),
      messages: chatMessages,
      maxRetries: 0,
      timeout: options.timeoutMs ?? 60_000,
      ...(options.signal ? { abortSignal: options.signal } : {}),
      onError: ({ error }) => providerError(error),
    });
  } catch (error) {
    throw providerError(error);
  }
}

/** GET /models — used to populate the model picker. */
export async function listModels(path = "/inference/openai/v1/models", timeoutMs = 15_000): Promise<string[]> {
  let response: Response;
  try {
    response = await fetch(`https://opencode.ai${path}`, {
      headers: { Authorization: `Bearer ${readProviderAPIKey()}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw transportError(error);
  }
  if (!response.ok) throw failure(response.status);
  const text = await response.text();
  if (text.length > MAX_BODY_LENGTH) throw new AiError("invalid-output", "AI 返回内容过大，请更换模型后重试。");
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new AiError("invalid-output", "AI 返回的不是合法 JSON，请更换模型后重试。");
  }
  const data = payload && typeof payload === "object" ? (payload as { data?: unknown }).data : undefined;
  if (!Array.isArray(data)) return [];
  return data
    .map((model) => (model && typeof model === "object" ? (model as { id?: unknown }).id : undefined))
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .slice(0, 100);
}
