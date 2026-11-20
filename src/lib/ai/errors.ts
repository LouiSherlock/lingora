export type AiErrorCode = "config" | "invalid-request" | "upstream" | "timeout" | "invalid-output";

const DEFAULT_STATUS: Record<AiErrorCode, number> = {
  config: 400,
  "invalid-request": 400,
  upstream: 502,
  timeout: 504,
  "invalid-output": 502,
};

const DEFAULT_MESSAGE: Record<AiErrorCode, string> = {
  config: "请先在设置中选择模型。",
  "invalid-request": "请求参数无效。",
  upstream: "AI 服务暂时不可用，请稍后重试。",
  timeout: "AI 服务响应超时，请稍后重试。",
  "invalid-output": "AI 返回的内容无法使用，请更换模型或重新生成。",
};

/** An expected failure of an AI call. Routes map it to a status and a Chinese message. */
export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  readonly needsConfiguration: boolean;

  constructor(code: AiErrorCode, message = DEFAULT_MESSAGE[code], status = DEFAULT_STATUS[code]) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = status;
    this.needsConfiguration = code === "config";
  }
}

export function isAiError(error: unknown): error is AiError {
  return error instanceof AiError;
}

/**
 * Turns any thrown value into a response body. Unexpected errors keep a generic
 * message so internals never reach the client.
 */
export function toErrorBody(error: unknown): { status: number; body: { error: string; code: AiErrorCode | "unexpected"; needsConfiguration?: boolean } } {
  if (isAiError(error)) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code, ...(error.needsConfiguration ? { needsConfiguration: true } : {}) },
    };
  }
  console.error("[ai] unexpected failure", error instanceof Error ? error.message : typeof error);
  return { status: 500, body: { error: "服务端处理失败，请稍后重试。", code: "unexpected" } };
}
