import { z } from "zod";
import { validateProviderUrl } from "../ai-url";
import { AiError } from "./errors";

/** What the browser sends as `ai` on every AI request. */
const providerSchema = z.object({
  baseUrl: z.string().max(500),
  model: z.string().max(200).optional(),
  apiKey: z.string().max(2048),
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

function readAPIKey(apiKey: string): string {
  const value = apiKey.trim();
  if (!value) throw new Error("API key is required");
  return value;
}

/**
 * Validates the AI configuration a route received. Every AI route goes through
 * here, so the checks cannot drift apart.
 */
export function readProvider(input: unknown, options: { requireModel?: boolean } = {}): Provider {
  const { requireModel = true } = options;
  const parsed = providerSchema.safeParse(input);
  if (!parsed.success) throw new AiError("config");
  const origin = validateProviderUrl(parsed.data.baseUrl);
  if (!origin) throw new AiError("config", "兼容接口地址无效，请填写公网可访问的 http(s) 地址。");
  let apiKey: string;
  try {
    apiKey = readAPIKey(parsed.data.apiKey);
  } catch {
    throw new AiError("config", "无法读取 API Key，请重新填写并确认配置。");
  }
  const model = parsed.data.model?.trim() ?? "";
  if (requireModel && !model) throw new AiError("config", "请先选择模型。");
  return {
    origin,
    prefix: origin.pathname.replace(/\/$/, ""),
    model,
    apiKey,
  };
}
