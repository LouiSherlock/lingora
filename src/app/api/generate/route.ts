import { NextResponse } from "next/server";
import type { Question } from "../../../lib/practice-data";
import { validateProviderUrl } from "../../../lib/ai-url";
import { decryptCredential } from "../../../lib/server-crypto";

const QUESTION_TYPES: Question["type"][] = ["single_choice", "fill_blank", "true_false"];

const systemPrompt = `Create English practice questions. Return JSON {questions:[{type,level,knowledgePoints,stem,options,answer,explanation}]}.
Allowed types: single_choice, fill_blank, true_false.
Cover all three types whenever count is 3 or more: include at least one of each, and keep them roughly balanced.
single_choice: 3-4 options with keys A, B, C, D; answer is the correct option key.
true_false: exactly two options: A = 正确, B = 错误; answer must be A or B.
fill_blank: options must be an empty array; answer is one short English word or phrase.
stem and option text are in English. Explanations are in Simplified Chinese and must explain why the answer is correct in 2-4 sentences, not just repeat the answer.`;

type RawQuestion = Partial<Question> & { options?: unknown; knowledgePoints?: unknown; answer?: unknown };

function normalizeAnswerToken(value: string) {
  return value.trim().replace(/[.。:：、)\]】]+$/u, "").toUpperCase();
}

function normalizeQuestion(raw: unknown, index: number, level: string, topic: string): Question {
  const source = raw && typeof raw === "object" ? raw as RawQuestion : {};
  const options = Array.isArray(source.options)
    ? source.options.reduce<{ key: string; text: string }[]>((list, option, optionIndex) => {
        if (!option || typeof option !== "object") return list;
        const candidate = option as { key?: unknown; text?: unknown };
        if (typeof candidate.text !== "string" || !candidate.text.trim()) return list;
        list.push({ key: typeof candidate.key === "string" && candidate.key ? candidate.key.toUpperCase() : String.fromCharCode(65 + optionIndex), text: candidate.text });
        return list;
      }, [])
    : [];
  const rawAnswer = typeof source.answer === "string" ? source.answer.trim() : "";
  const matchingOption = options.find((option) => option.text.trim().toLowerCase() === rawAnswer.toLowerCase());
  let type: Question["type"] = source.type === "single_choice" || source.type === "true_false" || source.type === "fill_blank"
    ? source.type
    : options.length ? "single_choice" : "fill_blank";

  if (type === "fill_blank") {
    return {
      id: `q${index + 1}`,
      type,
      level,
      knowledgePoints: Array.isArray(source.knowledgePoints) ? source.knowledgePoints.filter((point): point is string => typeof point === "string") : [topic],
      stem: typeof source.stem === "string" ? source.stem.trim() : "",
      options: [],
      answer: rawAnswer,
      explanation: typeof source.explanation === "string" ? source.explanation.trim() : "",
    };
  }

  if (type === "true_false") {
    const normalizedAnswer = normalizeAnswerToken(rawAnswer).toLowerCase();
    const answer = ["a", "true", "t", "正确", "对"].includes(normalizedAnswer)
      ? "A"
      : ["b", "false", "f", "错误", "错"].includes(normalizedAnswer)
        ? "B"
        : matchingOption?.key ?? "A";
    type = "true_false";
    return {
      id: `q${index + 1}`,
      type,
      level,
      knowledgePoints: Array.isArray(source.knowledgePoints) ? source.knowledgePoints.filter((point): point is string => typeof point === "string") : [topic],
      stem: typeof source.stem === "string" ? source.stem.trim() : "",
      options: [{ key: "A", text: "正确" }, { key: "B", text: "错误" }],
      answer,
      explanation: typeof source.explanation === "string" ? source.explanation.trim() : "",
    };
  }

  type = "single_choice";
  const answerToken = normalizeAnswerToken(rawAnswer);
  return {
    id: `q${index + 1}`,
    type,
    level,
    knowledgePoints: Array.isArray(source.knowledgePoints) ? source.knowledgePoints.filter((point): point is string => typeof point === "string") : [topic],
    stem: typeof source.stem === "string" ? source.stem.trim() : "",
    options,
    answer: matchingOption?.key ?? (/^[A-Z]$/.test(answerToken) ? answerToken : rawAnswer),
    explanation: typeof source.explanation === "string" ? source.explanation.trim() : "",
  };
}

function typeCoverage(questions: Question[]) {
  return QUESTION_TYPES.filter((type) => questions.some((question) => question.type === type)).length;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.slice(0, 120) : "英语练习";
    const level = typeof body.level === "string" && /^([A-C][1-2])$/.test(body.level) ? body.level : "A2";
    const count = Math.max(5, Math.min(20, Number(body.count) || 5));
    const ai = body.ai;
    const base = validateProviderUrl(ai?.baseUrl);
    const apiKey = decryptCredential(ai?.credential);
    if (!base || !apiKey || apiKey.length > 2048 || typeof ai?.model !== "string" || ai.model.length < 1 || ai.model.length > 200) return NextResponse.json({ error: "请先完成 AI 兼容接口配置，并选择模型。", needsConfiguration: true }, { status: 400 });
    const completionUrl = new URL(`${base.pathname.replace(/\/$/, "")}/chat/completions`, base.origin);

    let aiSessionId = typeof body.conversationId === "string" ? body.conversationId : "";

    async function requestQuestions(extraInstruction = "") {
      const response = await fetch(completionUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ai.model,
          ...(aiSessionId ? { conversation_id: aiSessionId } : {}),
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `${systemPrompt}${extraInstruction ? `\n${extraInstruction}` : ""}` },
            { role: "user", content: JSON.stringify({ topic, level, difficulty: body.difficulty, count, kind: body.kind, custom: body.custom, requiredTypes: QUESTION_TYPES }) },
          ],
        }),
        signal: AbortSignal.timeout(60000),
      });

   
      if (!response.ok) throw new Error("AI 服务请求失败，请检查服务端配置。");
      const result = await response.json();
      console.log(result)
      if (typeof result.id === "string" && result.id) aiSessionId = result.id;
      const parsed = JSON.parse(result.choices?.[0]?.message?.content ?? "{}");
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 1) throw new Error("模型返回格式无效");
      return parsed.questions.slice(0, count)
        .map((raw: unknown, index: number) => normalizeQuestion(raw, index, level, topic))
        .filter((question: Question) => question.stem && question.answer && (question.type === "fill_blank" || question.options.length >= 2));
    }

    let questions = await requestQuestions();
    if (!questions.length) return NextResponse.json({ error: "AI 返回的题目格式不完整，请更换模型或重新生成。" }, { status: 502 });

    if (count >= 3 && typeCoverage(questions) < QUESTION_TYPES.length) {
      try {
        const retry = await requestQuestions("The previous response missed a required question type. This time you MUST include single_choice, fill_blank and true_false questions.");
        if (typeCoverage(retry) > typeCoverage(questions)) questions = retry;
      } catch {
        // Keep the first batch when the retry fails; partial type coverage is better than no practice.
      }
    }

    const practice = { id: crypto.randomUUID(), title: `${topic} · ${level}`, questions, createdAt: new Date().toISOString() };
    return NextResponse.json({ practice });
  } catch { return NextResponse.json({ error: "练习生成失败，请稍后重试。" }, { status: 400 }); }
}
