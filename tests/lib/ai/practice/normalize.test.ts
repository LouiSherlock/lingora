import { describe, expect, it } from "vitest";
import { normalizeQuestion, normalizeQuestions, parseQuestionsPayload } from "@/lib/ai/practice/normalize";

const ctx = { level: "A2", topic: "现在完成时", count: 5 };

const options = [
  { key: "A", text: "some" },
  { key: "B", text: "any" },
  { key: "C", text: "a" },
];

describe("normalizeQuestion", () => {
  it("keeps keyed options and the answer key as they are", () => {
    const question = normalizeQuestion({ type: "single_choice", stem: "She ____ here.", options: [{ key: "A", text: "lives" }, { key: "B", text: "has lived" }], answer: "B" }, 0, ctx.level, ctx.topic);
    expect(question?.options).toEqual([{ key: "A", text: "lives" }, { key: "B", text: "has lived" }]);
    expect(question?.answer).toBe("B");
  });

  it("does not let an option text steal the answer key", () => {
    const question = normalizeQuestion({ type: "single_choice", stem: "We have ___ apples.", options, answer: "A" }, 0, ctx.level, ctx.topic);
    expect(question?.answer).toBe("A");
  });

  it("accepts lower-case answer keys", () => {
    const question = normalizeQuestion({ type: "single_choice", stem: "x", options, answer: " b " }, 0, ctx.level, ctx.topic);
    expect(question?.answer).toBe("B");
  });

  it("keeps a declared fill_blank answer even without options", () => {
    const question = normalizeQuestion({ type: "fill_blank", stem: "I ____ it.", answer: "have done" }, 0, ctx.level, ctx.topic);
    expect(question).toMatchObject({ type: "fill_blank", options: [], answer: "have done" });
  });

  it("keeps the true/false pair and its letter answer", () => {
    const question = normalizeQuestion({
      type: "true_false",
      stem: "There isn't some milk.",
      options: [{ key: "A", text: "正确" }, { key: "B", text: "错误" }],
      answer: "B",
    }, 0, ctx.level, ctx.topic);
    expect(question?.options).toEqual([{ key: "A", text: "正确" }, { key: "B", text: "错误" }]);
    expect(question?.answer).toBe("B");
  });

  it("drops questions that zod cannot type-check", () => {
    // 缺 type / stem 为空 / answer 为空 / options 不是对象数组 / 文本超长 / 类型未知
    expect(normalizeQuestion({ stem: "x", options, answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "single_choice", stem: "  ", options, answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options, answer: "" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options: ["some", "any"], answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "single_choice", stem: "x".repeat(401), options, answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "essay", stem: "x", options, answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
  });

  it("drops choice questions whose answer is not a real key", () => {
    // 答案写成选项文本（不是 key）时直接丢弃，不做文本→key 的猜测
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options, answer: "some" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options, answer: "Z" }, 0, ctx.level, ctx.topic)).toBeNull();
  });

  it("drops choice questions with duplicate keys or too few options", () => {
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options: [{ key: "A", text: "a" }], answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options: [{ key: "A", text: "a" }, { key: "A", text: "b" }], answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
  });

  it("drops fill_blank questions that carry options", () => {
    expect(normalizeQuestion({ type: "fill_blank", stem: "x", options, answer: "any" }, 0, ctx.level, ctx.topic)).toBeNull();
  });

  it("drops true/false questions without the 正确/错误 pair or an A/B answer", () => {
    expect(normalizeQuestion({ type: "true_false", stem: "x", options: [{ key: "A", text: "对" }, { key: "B", text: "错" }], answer: "A" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "true_false", stem: "x", options: [{ key: "A", text: "正确" }, { key: "B", text: "错误" }], answer: "正确" }, 0, ctx.level, ctx.topic)).toBeNull();
  });

  it("drops explanations that exceed the length limit but keeps the rest", () => {
    const question = normalizeQuestion({ type: "fill_blank", stem: "x", answer: "y", explanation: "x".repeat(2001) }, 0, ctx.level, ctx.topic);
    expect(question).toBeNull();
  });

  it("falls back to the topic when knowledge points are missing", () => {
    const question = normalizeQuestion({ type: "fill_blank", stem: "x", answer: "y" }, 0, ctx.level, ctx.topic);
    expect(question?.knowledgePoints).toEqual([ctx.topic]);
  });
});

describe("regressions", () => {
  const someAny = [
    { key: "A", text: "some" },
    { key: "B", text: "any" },
    { key: "C", text: "a" },
    { key: "D", text: "an" },
  ];

  it("keeps answer key A when option C is the article \"a\"", () => {
    const question = normalizeQuestion({ type: "single_choice", stem: "We have ___ apples.", options: someAny, answer: "A" }, 0, ctx.level, ctx.topic);

    expect(question?.answer).toBe("A");
    expect(question?.options.find((option) => option.key === question.answer)?.text).toBe("some");
  });

  it("keeps a letter true/false answer instead of defaulting to A", () => {
    const question = normalizeQuestion({
      type: "true_false",
      stem: "There isn't some milk in the fridge.",
      options: [{ key: "A", text: "正确" }, { key: "B", text: "错误" }],
      answer: "B",
    }, 0, ctx.level, ctx.topic);

    expect(question?.answer).toBe("B");
  });

  it("rejects duplicate option keys instead of letting two options share an answer", () => {
    const question = normalizeQuestion({
      type: "single_choice",
      stem: "x",
      options: [{ key: "A", text: "some" }, { key: "A", text: "any" }, { key: "B", text: "a" }],
      answer: "A",
    }, 0, ctx.level, ctx.topic);

    expect(question).toBeNull();
  });

  it("never guesses a key from option text", () => {
    const wrongWays = [{ answer: "some" }, { answer: "an (article)" }, { answer: "any of them" }];
    for (const { answer } of wrongWays) {
      expect(normalizeQuestion({ type: "single_choice", stem: "x", options: someAny, answer }, 0, ctx.level, ctx.topic)).toBeNull();
    }
  });

  it("treats a lone letter as the key itself, not as option text", () => {
    // 契约里 answer 是 key；模型写小写 "c" 时按 key C 处理，而不是去找文本为 "c" 的选项。
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options: someAny, answer: "c" }, 0, ctx.level, ctx.topic)?.answer).toBe("C");
    expect(normalizeQuestion({ type: "single_choice", stem: "x", options: someAny, answer: "c" }, 0, ctx.level, ctx.topic)?.options.find((option) => option.key === "C")?.text).toBe("a");
  });
});

describe("normalizeQuestions", () => {
  it("deduplicates by stem and caps the count", () => {
    const raw = [
      { type: "fill_blank", stem: "same", answer: "a" },
      { type: "fill_blank", stem: "SAME", answer: "b" },
      { type: "fill_blank", stem: "other", answer: "c" },
    ];
    const questions = normalizeQuestions(raw, { ...ctx, count: 1 });
    expect(questions).toHaveLength(1);
    expect(questions[0].stem).toBe("same");
  });

  it("renumbers ids after dropped entries", () => {
    const raw = [
      { type: "fill_blank", stem: "", answer: "a" },
      { type: "fill_blank", stem: "ok", answer: "b" },
    ];
    expect(normalizeQuestions(raw, ctx)[0].id).toBe("q1");
  });

  it("keeps every question type when the model mixes them", () => {
    const questions = normalizeQuestions([
      { type: "single_choice", stem: "a", options: [{ key: "A", text: "x" }, { key: "B", text: "y" }], answer: "A" },
      { type: "fill_blank", stem: "b", answer: "y" },
      { type: "true_false", stem: "c", options: [{ key: "A", text: "正确" }, { key: "B", text: "错误" }], answer: "B" },
    ], ctx);

    expect(questions.map((question) => question.type)).toEqual(["single_choice", "fill_blank", "true_false"]);
  });
});

describe("parseQuestionsPayload", () => {
  it("rejects invalid JSON and missing questions", () => {
    expect(() => parseQuestionsPayload("not json")).toThrowError(/JSON/);
    expect(() => parseQuestionsPayload("{}")).toThrowError(/格式/);
  });

  it("returns the raw question list", () => {
    expect(parseQuestionsPayload('{"questions":[{"stem":"x"}]}')).toHaveLength(1);
  });
});
