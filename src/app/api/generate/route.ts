import { NextResponse } from "next/server";
import type { Question } from "../../../lib/practice-data";
import { validateProviderUrl } from "../../../lib/ai-url";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 120) : "英语练习";
    const level = typeof body.level === "string" && /^([A-C][1-2])$/.test(body.level) ? body.level : "A2";
    const count = Math.max(5, Math.min(20, Number(body.count) || 5));
    const ai = body.ai;
    const base = validateProviderUrl(ai?.baseUrl);
    if (!base || typeof ai?.apiKey !== "string" || ai.apiKey.length < 1 || ai.apiKey.length > 2048 || typeof ai?.model !== "string" || ai.model.length < 1 || ai.model.length > 200) return NextResponse.json({ error: "请先完成 AI 兼容接口配置，并选择模型。", needsConfiguration: true }, { status: 400 });
    let questions: Question[];
    {
      const completionUrl = new URL(`${base.pathname.replace(/\/$/, "")}/chat/completions`, base.origin);
      const response = await fetch(completionUrl, { method: "POST", headers: { Authorization: `Bearer ${ai.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: ai.model, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Create English practice questions. Return JSON {questions:[{type,level,knowledgePoints,stem,options,answer,explanation}]}. type is single_choice, fill_blank, or true_false. Explanations are in Simplified Chinese." }, { role: "user", content: JSON.stringify({ topic, level, difficulty: body.difficulty, count, kind: body.kind, custom: body.custom }) }] }), signal: AbortSignal.timeout(60000) });
      if (!response.ok) return NextResponse.json({ error: "AI 服务请求失败，请检查服务端配置。" }, { status: 502 });
      const result = await response.json();
      const parsed = JSON.parse(result.choices?.[0]?.message?.content ?? "{}");
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 1) throw new Error("模型返回格式无效");
      questions = parsed.questions.slice(0, count).map((raw: unknown, index: number) => {
        const q = raw && typeof raw === "object" ? raw as Partial<Question> : {};
        const options = Array.isArray(q.options) ? q.options.filter((option) => option && typeof option.text === "string").map((option, optionIndex) => ({ key: typeof option.key === "string" && option.key ? option.key : String.fromCharCode(65 + optionIndex), text: option.text })) : [];
        const rawAnswer = typeof q.answer === "string" ? q.answer : "";
        const matchingOption = options.find((option) => option.text.trim().toLowerCase() === rawAnswer.trim().toLowerCase());
        const type = q.type === "single_choice" || q.type === "true_false" || q.type === "fill_blank" ? q.type : options.length ? "single_choice" : "fill_blank";
        return { id: `q${index + 1}`, type, level, knowledgePoints: Array.isArray(q.knowledgePoints) ? q.knowledgePoints.filter((point): point is string => typeof point === "string") : [topic], stem: typeof q.stem === "string" ? q.stem : "", options, answer: matchingOption?.key ?? rawAnswer, explanation: typeof q.explanation === "string" ? q.explanation : "" };
      });
    }
    const practice = { id: crypto.randomUUID(), title: `${topic} · ${level}`, questions, createdAt: new Date().toISOString() };
    return NextResponse.json({ practice });
  } catch { return NextResponse.json({ error: "练习生成失败，请稍后重试。" }, { status: 400 }); }
}
