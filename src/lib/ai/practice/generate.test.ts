import { describe, expect, it } from "vitest";
import { parseGenerateFields } from "./generate";

describe("parseGenerateFields", () => {
  it("accepts the larger context used for wrong-question regeneration", () => {
    const fields = parseGenerateFields({ custom: "x".repeat(8_000) });

    expect(fields.custom).toHaveLength(8_000);
  });

  it("rejects oversized custom context", () => {
    expect(() => parseGenerateFields({ custom: "x".repeat(12_001) })).toThrowError("请求参数无效。");
  });
});
