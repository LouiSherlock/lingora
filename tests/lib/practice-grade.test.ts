import { describe, expect, it } from "vitest";
import type { Question } from "@/lib/practice-data";
import { answerLabel, isAnswerCorrect, normalizeAnswer } from "@/lib/practice-grade";

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
    expect(normalizeAnswer("  B ")).toBe("b");
    expect(normalizeAnswer(undefined)).toBe("");
  });
});

describe("isAnswerCorrect", () => {
  it("grades case-insensitively", () => {
    expect(isAnswerCorrect(question, "b")).toBe(true);
    expect(isAnswerCorrect(question, "A")).toBe(false);
    expect(isAnswerCorrect(question, undefined)).toBe(false);
  });
});

describe("answerLabel", () => {
  it("prefixes the option key", () => {
    expect(answerLabel(question, "B")).toBe("B. has lived");
  });

  it("defaults to the correct answer", () => {
    expect(answerLabel(question)).toBe("B. has lived");
  });

  it("returns fill-in answers unchanged", () => {
    expect(answerLabel({ ...question, options: [], answer: "have done" }, "Have done")).toBe("Have done");
  });
});
