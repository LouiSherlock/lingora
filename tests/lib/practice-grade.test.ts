import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/practice-data";
import { answerLabel, answerText, isAnswerCorrect, normalizeAnswer } from "@/lib/practice-grade";

const question: Question = {
  id: "q1",
  type: "single_choice",
  level: "A2",
  knowledgePoints: ["现在完成时"],
  stem: "She ____ here.",
  options: [{ key: "A", text: "lives" }, { key: "B", text: "has lived" }],
  answer: "B",
  explanation: "…",
};

describe("normalizeAnswer", () => {
  it("ignores case and surrounding space", () => {
    expect(normalizeAnswer("  b ")).toBe("b");
    expect(normalizeAnswer(undefined)).toBe("");
  });
});

describe("isAnswerCorrect", () => {
  it("grades the option key case-insensitively", () => {
    expect(isAnswerCorrect(question, "B")).toBe(true);
    expect(isAnswerCorrect(question, "b")).toBe(true);
    expect(isAnswerCorrect(question, "A")).toBe(false);
    expect(isAnswerCorrect(question, undefined)).toBe(false);
  });

  it("grades fill-in answers with the same rule", () => {
    const fill: Question = { ...question, type: "fill_blank", options: [], answer: "have done" };

    expect(isAnswerCorrect(fill, "Have Done")).toBe(true);
    expect(isAnswerCorrect(fill, "done")).toBe(false);
  });
});

describe("answerText", () => {
  it("turns a key into its option text", () => {
    expect(answerText(question, "B")).toBe("has lived");
    expect(answerText(question)).toBe("has lived");
  });

  it("returns fill-in answers and unknown values unchanged", () => {
    const fill: Question = { ...question, type: "fill_blank", options: [], answer: "have done" };

    expect(answerText(fill)).toBe("have done");
    expect(answerText(question, "Z")).toBe("Z");
  });
});

describe("answerLabel", () => {
  it("prefixes the option key for display", () => {
    expect(answerLabel(question, "B")).toBe("B. has lived");
    expect(answerLabel(question)).toBe("B. has lived");
  });

  it("returns fill-in answers unchanged", () => {
    const fill: Question = { ...question, type: "fill_blank", options: [], answer: "have done" };

    expect(answerLabel(fill)).toBe("have done");
  });
});
