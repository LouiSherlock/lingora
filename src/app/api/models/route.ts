import { NextResponse } from "next/server";
import { validateProviderUrl } from "../../../lib/ai-url";

export async function POST(request: Request) {
  try {
    const { baseUrl, apiKey } = await request.json();
    const base = validateProviderUrl(baseUrl);
    if (!base || typeof apiKey !== "string" || apiKey.length < 1 || apiKey.length > 2048) return NextResponse.json({ error: "请填写有效的兼容接口地址和 API Key。" }, { status: 400 });
    const modelsUrl = new URL(`${base.pathname.replace(/\/$/, "")}/models`, base.origin);
    const response = await fetch(modelsUrl, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) return NextResponse.json({ error: `获取模型失败（HTTP ${response.status}），请检查地址和 API Key。` }, { status: 502 });
    const payload = await response.json();
    const models = Array.isArray(payload.data) ? payload.data.map((model: { id?: unknown }) => model.id).filter((id: unknown): id is string => typeof id === "string").slice(0, 100) : [];
    return NextResponse.json({ models });
  } catch { return NextResponse.json({ error: "连接模型服务失败，请确认接口地址可访问并兼容 OpenAI Models API。" }, { status: 502 }); }
}
