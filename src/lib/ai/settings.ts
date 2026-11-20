import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { AiError } from "./errors";

/** Fixed OpenAI-compatible endpoint; the browser never supplies it. */
export const PROVIDER_BASE_URL = "https://opencode.ai/inference/openai/v1";

export const opencode = createOpenAICompatible({
  name: "opencode",
  baseURL: PROVIDER_BASE_URL,
  apiKey: process.env.PROVIDER_API_KEY,
});

/** What the browser sends as `ai` on every AI request. */
const providerSchema = z.object({
  model: z.string().max(200).optional(),
});

export function readProviderAPIKey(): string {
  const apiKey = process.env.PROVIDER_API_KEY?.trim();
  if (!apiKey) throw new AiError("config", "服务端未配置 PROVIDER_API_KEY，请在 .env 中设置后重启服务。");
  return apiKey;
}

/**
 * Validates the browser-selected model. The provider and API key are fixed on
 * the server and never accepted from the browser.
 */
export function readModel(input: unknown, options: { requireModel?: boolean } = {}): string {
  const { requireModel = true } = options;
  const parsed = providerSchema.safeParse(input ?? {});
  if (!parsed.success) throw new AiError("config");
  readProviderAPIKey();
  const model = parsed.data.model?.trim() ?? "";
  if (requireModel && !model) throw new AiError("config", "请先在设置中选择模型。");
  return model;
}
