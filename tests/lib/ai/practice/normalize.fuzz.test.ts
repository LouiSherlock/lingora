import { describe, expect, it } from "vitest";
import { normalizeQuestion, normalizeQuestions, parseQuestionsPayload } from "@/lib/ai/practice/normalize";
import type { Question } from "@/lib/practice-data";

/** 固定种子的伪随机，保证用例可重复。 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEEDS = [20261122, 7, 99, 12345, 888888, 31337];

const stems = ["x", "", "  ", "She ___ to school.", "一".repeat(1000), null, 42, "We have ___ apples."];
const answers = ["A", "B", "C", "D", "a", "b", "A.", "some", "any", "正确", "错误", "", "  ", "Z", null, 3, {}];
const optionTexts = ["some", "any", "a", "an", "lives", "has lived", "", "  ", "x".repeat(500), "正确", "错误", null, 7, {}, ["nested"]];
const optionKeys = ["A", "B", "C", "D", "a", "", "  ", null, 5, "AB"];
const types = ["single_choice", "fill_blank", "true_false", "Single Choice", "单选", undefined, null];
const pointValues = ["Some 与 Any", "", "  ", "x".repeat(200), null, 5];

function makeGenerator(seed: number) {
  const rand = mulberry32(seed);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

  const randomOptions = () => {
    if (rand() < 0.15) return pick([null, 42, "x", {}, { length: 2, 0: "a", 1: "b" }]);
    if (rand() < 0.1) return ["some", "any"];
    return Array.from({ length: Math.floor(rand() * 8) }, () => {
      if (rand() < 0.15) return pick([null, 42, "x", {}, ["nested"]]);
      const option: Record<string, unknown> = {};
      if (rand() < 0.9) option.text = pick(optionTexts);
      if (rand() < 0.9) option.key = pick(optionKeys);
      return option;
    });
  };

  const randomRawQuestion = () => {
    const raw: Record<string, unknown> = {};
    if (rand() < 0.9) raw.stem = pick(stems);
    if (rand() < 0.9) raw.type = pick(types);
    if (rand() < 0.85) raw.answer = pick(answers);
    if (rand() < 0.8) raw.options = randomOptions();
    if (rand() < 0.7) raw.explanation = pick(["…", "", "x".repeat(3000), null]);
    if (rand() < 0.7) raw.knowledgePoints = pick([[], [pick(pointValues)], [pick(pointValues), pick(pointValues)], pick(pointValues), null]);
    return raw;
  };

  return { rand, randomRawQuestion };
}

function assertValidQuestion(question: Question) {
  expect(question.id).toMatch(/^q\d+$/);
  expect(question.stem.length).toBeGreaterThan(0);
  expect(question.stem.length).toBeLessThanOrEqual(400);
  expect(question.explanation.length).toBeLessThanOrEqual(2000);
  expect(["single_choice", "fill_blank", "true_false"]).toContain(question.type);

  expect(question.knowledgePoints.length).toBeGreaterThan(0);
  expect(question.knowledgePoints.length).toBeLessThanOrEqual(6);
  for (const point of question.knowledgePoints) {
    expect(point.length).toBeGreaterThan(0);
    expect(point.length).toBeLessThanOrEqual(60);
  }

  expect(question.options.length).toBeLessThanOrEqual(6);
  const keys = question.options.map((option) => option.key.toLowerCase());
  expect(new Set(keys).size).toBe(keys.length);
  for (const option of question.options) {
    expect(option.text.length).toBeGreaterThan(0);
    expect(option.text.length).toBeLessThanOrEqual(300);
    expect(option.key.length).toBeGreaterThan(0);
    expect(option.key.length).toBeLessThanOrEqual(4);
  }

  expect(question.answer.length).toBeGreaterThan(0);

  if (question.type === "fill_blank") {
    expect(question.options).toEqual([]);
    return;
  }

  // 答案必须是某个真实存在的选项 key，这是判分的唯一依据。
  expect(question.options.map((option) => option.key)).toContain(question.answer);

  if (question.type === "true_false") {
    expect(question.options).toEqual([{ key: "A", text: "正确" }, { key: "B", text: "错误" }]);
    expect(["A", "B"]).toContain(question.answer);
  }
}

describe("normalize fuzz", () => {
  it("never throws on garbage input", () => {
    for (const seed of SEEDS) {
      const { randomRawQuestion } = makeGenerator(seed);
      for (let index = 0; index < 300; index += 1) {
        expect(() => normalizeQuestion(randomRawQuestion(), index, "A2", "主题")).not.toThrow();
      }
      expect(() => normalizeQuestion(null, 0, "A2", "主题")).not.toThrow();
      expect(() => normalizeQuestion("x", 0, "A2", "主题")).not.toThrow();
      expect(() => normalizeQuestion([], 0, "A2", "主题")).not.toThrow();
    }
  });

  it("always returns a question the player and grader can use", () => {
    let kept = 0;
    for (const seed of SEEDS) {
      const { randomRawQuestion } = makeGenerator(seed);
      for (let index = 0; index < 300; index += 1) {
        // 一半用超长主题，覆盖知识点回落到主题时的截断。
        const topic = index % 2 ? "主".repeat(120) : "主题";
        const question = normalizeQuestion(randomRawQuestion(), index, "A2", topic);
        if (!question) continue;
        kept += 1;
        assertValidQuestion(question);
      }
    }
    expect(kept).toBeGreaterThan(0);
  });

  it("keeps ids sequential, stems unique and the count capped", () => {
    for (const seed of SEEDS) {
      const { rand, randomRawQuestion } = makeGenerator(seed);
      for (let round = 0; round < 30; round += 1) {
        const raw = Array.from({ length: 1 + Math.floor(rand() * 12) }, () => randomRawQuestion());
        const count = 1 + Math.floor(rand() * 8);
        const questions = normalizeQuestions(raw, { level: "A2", topic: "主题", count });

        expect(questions.length).toBeLessThanOrEqual(count);
        questions.forEach((question, index) => {
          expect(question.id).toBe(`q${index + 1}`);
          assertValidQuestion(question);
        });
        const stems = questions.map((question) => question.stem.toLowerCase());
        expect(new Set(stems).size).toBe(stems.length);
      }
    }
  });

  it("rejects payloads that are not a question list before normalizing", () => {
    expect(() => parseQuestionsPayload("[]")).toThrow();
    expect(() => parseQuestionsPayload('{"questions":[]}')).toThrow();
    expect(() => parseQuestionsPayload("```json\n{\"questions\":[]}\n```")).toThrow();
  });
});
