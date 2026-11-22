import { describe, expect, it } from "vitest";
import { parseGenerateFields } from "@/lib/ai/practice/generate";

describe("parseGenerateFields", () => {
  it("accepts the larger context used for wrong-question regeneration", () => {
    const fields = parseGenerateFields({ custom: "x".repeat(8_000) });

    expect(fields.custom).toHaveLength(8_000);
  });

  it("rejects oversized custom context", () => {
    expect(() => parseGenerateFields({ custom: "x".repeat(12_001) })).toThrowError("请求参数无效。");
  });

  it("clamps the question count into 5–20", () => {
    expect(parseGenerateFields({ count: 0 }).count).toBe(5);
    expect(parseGenerateFields({ count: 1 }).count).toBe(5);
    expect(parseGenerateFields({ count: 12.7 }).count).toBe(12);
    expect(parseGenerateFields({ count: 99 }).count).toBe(20);
    expect(parseGenerateFields({ count: "abc" }).count).toBe(5);
    expect(parseGenerateFields({ count: undefined }).count).toBe(5);
  });

  it("falls back to A2 for an unknown level and keeps valid levels", () => {
    expect(parseGenerateFields({ level: "B2" }).level).toBe("B2");
    expect(parseGenerateFields({ level: "Z9" }).level).toBe("A2");
    expect(parseGenerateFields({ level: "b2" }).level).toBe("A2");
    expect(parseGenerateFields({ level: "" }).level).toBe("A2");
  });

  it("falls back to a default topic instead of an empty one", () => {
    expect(parseGenerateFields({ topic: "   " }).topic).toBe("英语练习");
    expect(parseGenerateFields({ topic: "现在完成时" }).topic).toBe("现在完成时");
  });

  it("rejects a topic longer than the 120 character limit", () => {
    expect(() => parseGenerateFields({ topic: "主".repeat(121) })).toThrowError("请求参数无效。");
    expect(parseGenerateFields({ topic: "主".repeat(120) }).topic).toHaveLength(120);
  });
});
