import { NextResponse } from "next/server";
import { sampleQuestions, type Question } from "../../../lib/practice-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 120) : "英语练习";
    const level = typeof body.level === "string" && /^([A-C][1-2])$/.test(body.level) ? body.level : "A2";
    const count = Math.max(5, Math.min(20, Number(body.count) || 5));
    let questions: Question[];
    const key = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL;
    if (key && baseUrl && model) {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Create English practice questions. Return JSON {questions:[{type,level,knowledgePoints,stem,options,answer,explanation}]}. type is single_choice, fill_blank, or true_false. Explanations are in Simplified Chinese." }, { role: "user", content: JSON.stringify({ topic, level, difficulty: body.difficulty, count, kind: body.kind, custom: body.custom }) }] }) });
      if (!response.ok) return NextResponse.json({ error: "AI 服务请求失败，请检查服务端配置。" }, { status: 502 });
      const result = await response.json();
      const parsed = JSON.parse(result.choices?.[0]?.message?.content ?? "{}");
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 1) throw new Error("模型返回格式无效");
      questions = parsed.questions.slice(0, count).map((q: Question, index: number) => ({ ...q, id: `q${index + 1}`, level, knowledgePoints: Array.isArray(q.knowledgePoints) ? q.knowledgePoints : [topic], options: Array.isArray(q.options) ? q.options : [] }));
    } else {
      questions = Array.from({ length: count }, (_, i) => ({ ...sampleQuestions[i % sampleQuestions.length], id: `q${i + 1}`, level, knowledgePoints: [topic] }));
    }
    const practice = { id: crypto.randomUUID(), title: `${topic} · ${level}`, questions, createdAt: new Date().toISOString() };
    return NextResponse.json({ practice });
  } catch { return NextResponse.json({ error: "练习生成失败，请稍后重试。" }, { status: 400 }); }
}
