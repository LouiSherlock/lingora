import { NextResponse } from "next/server";
import { validateProviderUrl } from "../../../lib/ai-url";
export async function POST(request: Request) {
  try {
    const { question, answer, followUp, ai } = await request.json();
    if (typeof question !== "string" || typeof followUp !== "string" || followUp.length > 1000) return NextResponse.json({ error: "问题内容无效。" }, { status: 400 });
    const base = validateProviderUrl(ai?.baseUrl);
    if (!base || typeof ai?.apiKey !== "string" || !ai.apiKey || typeof ai?.model !== "string" || !ai.model) return NextResponse.json({ error: "请先完成 AI 兼容接口配置。" }, { status: 400 });
    const completionUrl = new URL(`${base.pathname.replace(/\/$/, "")}/chat/completions`, base.origin);
    const response = await fetch(completionUrl, { method: "POST", headers: { Authorization: `Bearer ${ai.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: ai.model, messages: [{ role: "system", content: "你是一位耐心的英语老师。使用简体中文简明回答语法问题。" }, { role: "user", content: `题目：${String(question).slice(0,1000)}\n答案：${String(answer).slice(0,300)}\n追问：${followUp}` }] }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) return NextResponse.json({ error: "AI 助教请求失败。" }, { status: 502 });
    const data = await response.json(); return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? "暂时没有生成回答。" });
  } catch { return NextResponse.json({ error: "请求格式无效。" }, { status: 400 }); }
}
