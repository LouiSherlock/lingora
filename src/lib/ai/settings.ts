import { z } from "zod";
import { validateProviderUrl } from "../ai-url";
import { AiError } from "./errors";

/** Fixed OpenAI-compatible endpoint; the browser never supplies it. */
export const PROVIDER_BASE_URL = "https://opencode.ai/inference/openai/v1";

/** What the browser sends as `ai` on every AI request. */
const providerSchema = z.object({
  model: z.string().max(200).optional(),
});

export type Provider = {
  /** Provider host, kept as the URL the user typed. */
  origin: URL;
  /** Path prefix that endpoints are appended to, without a trailing slash. */
  prefix: string;
  model: string;
  apiKey: string;
};

export function endpoint(provider: Provider, path: string): URL {
  return new URL(`${provider.prefix}/${path}`, provider.origin.origin);
}

/** Base URL handed to the AI SDK provider, path prefix included, without a trailing slash. */
export function providerBaseURL(provider: Provider): string {
  return `${provider.origin.origin}${provider.prefix}`;
}

function readServerAPIKey(): string {
  const value = process.env.PROVIDER_API_KEY?.trim();
  if (!value) throw new AiError("config", "服务端未配置 PROVIDER_API_KEY，请在 .env 中设置后重启服务。");
  return value;
}

/**
 * Validates the model a route received and pairs it with the server-side key
 * and fixed endpoint. Every AI route goes through here, so the checks cannot
 * drift apart.
 */
export function readProvider(input: unknown, options: { requireModel?: boolean } = {}): Provider {
  const { requireModel = true } = options;
  const parsed = providerSchema.safeParse(input ?? {});
  if (!parsed.success) throw new AiError("config");
  const origin = validateProviderUrl(PROVIDER_BASE_URL);
  if (!origin) throw new AiError("config", "AI 接口地址无效，请检查服务端配置。");
  const model = parsed.data.model?.trim() ?? "";
  if (requireModel && !model) throw new AiError("config", "请先在设置中选择模型。");
  return {
    origin,
    prefix: origin.pathname.replace(/\/$/, ""),
    model,
    apiKey: readServerAPIKey(),
  };
}
