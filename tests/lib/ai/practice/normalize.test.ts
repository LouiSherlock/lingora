import { describe, expect, it } from "vitest";
import { normalizeQuestion, normalizeQuestions, parseQuestionsPayload, typeCoverage } from "@/lib/ai/practice/normalize";

const ctx = { level: "A2", topic: "现在完成时", count: 5 };

describe("normalizeQuestion", () => {
  it("maps a choice answer given as option text to its key", () => {
    const question = normalizeQuestion({ type: "single_choice", stem: "She ____ here.", options: [{ key: "A", text: "lives" }, { key: "B", text: "has lived" }], answer: "has lived" }, 0, ctx.level, ctx.topic);
    expect(question?.answer).toBe("B");
  });

  it("keeps a declared fill_blank answer even without options", () => {
    const question = normalizeQuestion({ type: "fill_blank", stem: "I ____ it.", answer: "have done" }, 0, ctx.level, ctx.topic);
    expect(question).toMatchObject({ type: "fill_blank", options: [], answer: "have done" });
  });

  it("forces the true/false option pair and reads Chinese answers", () => {
    const question = normalizeQuestion({ type: "true_false", stem: "He haved it.", answer: "错误" }, 0, ctx.level, ctx.topic);
    expect(question?.options).toEqual([{ key: "A", text: "正确" }, { key: "B", text: "错误" }]);
    expect(question?.answer).toBe("B");
  });

  it("drops questions without a stem or answer", () => {
    expect(normalizeQuestion({ type: "fill_blank", stem: "", answer: "x" }, 0, ctx.level, ctx.topic)).toBeNull();
    expect(normalizeQuestion({ type: "fill_blank", stem: "x", answer: "" }, 0, ctx.level, ctx.topic)).toBeNull();
  });

  it("drops single choice questions whose answer is not one of the options", () => {
    const question = normalizeQuestion({ type: "single_choice", stem: "x", options: [{ key: "A", text: "a" }, { key: "B", text: "b" }], answer: "z" }, 0, ctx.level, ctx.topic);
    expect(question).toBeNull();
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

describe("typeCoverage", () => {
  it("counts represented types", () => {
    const questions = normalizeQuestions([
      { type: "fill_blank", stem: "a", answer: "b" },
      { type: "true_false", stem: "c", answer: "正确" },
    ], ctx);
    expect(typeCoverage(questions)).toBe(2);
  });
});
