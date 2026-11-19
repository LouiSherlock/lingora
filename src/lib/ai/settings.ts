import { z } from "zod";
import { validateProviderUrl } from "../ai-url";
import { decryptCredential } from "../server-crypto";
import { AiError } from "./errors";

/** What the browser sends as `ai` on every AI request. */
const providerSchema = z.object({
  baseUrl: z.string().max(500),
  model: z.string().max(200).optional(),
  credential: z.unknown(),
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

function decrypt(credential: unknown): string {
  try {
    return decryptCredential(credential);
  } catch {
    return "";
  }
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
  const apiKey = decrypt(parsed.data.credential);
  if (!apiKey || apiKey.length > 2048) throw new AiError("config", "无法读取 API Key，请重新填写并确认配置。");
  const model = parsed.data.model?.trim() ?? "";
  if (requireModel && !model) throw new AiError("config", "请先选择模型。");
  return {
    origin,
    prefix: origin.pathname.replace(/\/$/, ""),
    model,
    apiKey,
  };
}
