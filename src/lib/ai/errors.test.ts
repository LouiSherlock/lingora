import { describe, expect, it } from "vitest";
import { AiError, isAiError, toErrorBody } from "./errors";

describe("AiError", () => {
  it("carries a code, status and Chinese message", () => {
    const error = new AiError("timeout");
    expect(error.status).toBe(504);
    expect(error.message).toContain("超时");
    expect(error.needsConfiguration).toBe(false);
  });

  it("marks configuration failures so the UI can link to settings", () => {
    expect(new AiError("config").needsConfiguration).toBe(true);
  });
});

describe("toErrorBody", () => {
  it("maps known failures", () => {
    expect(toErrorBody(new AiError("invalid-request"))).toEqual({
      status: 400,
      body: { error: "请求参数无效。", code: "invalid-request" },
    });
  });

  it("hides unexpected failures", () => {
    const { status, body } = toErrorBody(new Error("database password is secret"));
    expect(status).toBe(500);
    expect(body.code).toBe("unexpected");
    expect(body.error).not.toContain("secret");
  });

  it("narrows with isAiError", () => {
    expect(isAiError(new AiError("config"))).toBe(true);
    expect(isAiError(new Error("x"))).toBe(false);
  });
});
