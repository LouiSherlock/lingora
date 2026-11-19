import { AiError } from "./errors";
import { pickSessionId } from "./session";
import { endpoint, type Provider } from "./settings";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  messages: ChatMessage[];
  /** Ask the provider for a JSON object response. */
  json?: boolean;
  /** Conversation to continue, when the provider supports it. */
  sessionId?: string;
  timeoutMs?: number;
  /** Caller's abort signal (client disconnect, page navigation). */
  signal?: AbortSignal;
};

export type ChatResult = {
  content: string;
  /** Provider-issued conversation id, or "" when it returned none. */
  sessionId: string;
};

/** Guards against a provider streaming megabytes back into the JSON parser. */
const MAX_BODY_LENGTH = 2_000_000;

function composeSignal(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeout;
  const combine = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any;
  if (combine) return combine([signal, timeout]);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted || timeout.aborted) abort();
  signal.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length > MAX_BODY_LENGTH) throw new AiError("invalid-output", "AI 返回内容过大，请更换模型后重试。");
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError("invalid-output", "AI 返回的不是合法 JSON，请更换模型后重试。");
  }
}

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

/** POST /chat/completions and normalize success, timeout and provider failures. */
export async function chatCompletion(provider: Provider, options: ChatOptions): Promise<ChatResult> {
  const url = endpoint(provider, "chat/completions");
  const body: Record<string, unknown> = { model: provider.model, messages: options.messages };
  if (options.json) body.response_format = { type: "json_object" };
  if (options.sessionId) body.conversation_id = options.sessionId;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: composeSignal(options.timeoutMs ?? 60_000, options.signal),
    });
  } catch (error) {
    throw transportError(error);
  }

  if (!response.ok) throw failure(response.status);
  const payload = await readJson(response);
  const source = payload && typeof payload === "object" ? payload as { choices?: { message?: { content?: unknown } }[] } : {};
  const content = source.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new AiError("invalid-output", "AI 没有返回内容，请稍后重试。");

  return { content, sessionId: pickSessionId(payload, response) };
}

/** GET /models — used to populate the model picker. */
export async function listModels(provider: Provider, timeoutMs = 15_000): Promise<string[]> {
  const url = new URL(`${endpoint(provider, "models").toString()}`);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${provider.apiKey}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw transportError(error);
  }
  if (!response.ok) throw failure(response.status);
  const payload = await readJson(response);
  const data = payload && typeof payload === "object" ? (payload as { data?: unknown }).data : undefined;
  if (!Array.isArray(data)) return [];
  return data
    .map((model) => (model && typeof model === "object" ? (model as { id?: unknown }).id : undefined))
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .slice(0, 100);
}
