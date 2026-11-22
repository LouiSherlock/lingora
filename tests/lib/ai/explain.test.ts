import { describe, expect, it } from "vitest";
import { buildTutorContext, parseTutorRequest } from "@/lib/ai/explain";

const base = {
  question: "She ___ to school yesterday.",
  options: [
    { key: "A", text: "goes" },
    { key: "B", text: "went" },
  ],
};

describe("buildTutorContext", () => {
  it("keeps the user answer and the correct answer apart", () => {
    const context = buildTutorContext({ ...base, userAnswer: "goes", correctAnswer: "went" });

    expect(context).toContain("题目：She ___ to school yesterday.");
    expect(context).toContain("选项：A. goes；B. went");
    expect(context).toContain("用户回答：goes");
    expect(context).toContain("正确答案：went");
  });

  it("labels an unanswered question instead of inventing an answer", () => {
    const context = buildTutorContext({ ...base, correctAnswer: "went" });

    expect(context).toContain("用户回答：未作答");
    expect(context).not.toContain("用户回答：went");
  });

  it("omits the options line for fill-in questions", () => {
    const context = buildTutorContext({ question: "I have ___ finished it.", correctAnswer: "already" });

    expect(context).not.toContain("选项：");
    expect(context.split("\n")).toEqual([
      "题目：I have ___ finished it.",
      "用户回答：未作答",
      "正确答案：already",
    ]);
  });
});

describe("parseTutorRequest", () => {
  it("accepts the user answer, correct answer and keyed options", () => {
    const parsed = parseTutorRequest({
      question: "Q",
      userAnswer: "goes",
      correctAnswer: "went",
      options: base.options,
      messages: [{ role: "user", parts: [{ type: "text", text: "为什么？" }] }],
    });

    expect(parsed.userAnswer).toBe("goes");
    expect(parsed.correctAnswer).toBe("went");
    expect(parsed.options).toEqual(base.options);
  });

  it("accepts up to six options, matching the generator limit", () => {
    const six = ["A", "B", "C", "D", "E", "F"].map((key) => ({ key, text: key }));
    const messages = [{ role: "user", parts: [{ type: "text", text: "hi" }] }];

    expect(parseTutorRequest({ question: "Q", options: six, messages }).options).toHaveLength(6);
    expect(() => parseTutorRequest({ question: "Q", options: [...six, { key: "G", text: "G" }], messages })).toThrow();
  });

  it("rejects an empty question", () => {
    expect(() => parseTutorRequest({ question: "", messages: [{}] })).toThrow();
  });
});
