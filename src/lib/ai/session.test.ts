import { describe, expect, it } from "vitest";
import { pickSessionId, readSessionId, withConversation } from "./session";

describe("readSessionId", () => {
  it("keeps strings and trims them", () => {
    expect(readSessionId("  abc  ")).toBe("abc");
  });

  it("ignores non-strings and caps length", () => {
    expect(readSessionId(42)).toBe("");
    expect(readSessionId(undefined)).toBe("");
    expect(readSessionId("x".repeat(500))).toHaveLength(200);
  });
});

describe("pickSessionId", () => {
  it("reads a provider conversation field", () => {
    expect(pickSessionId({ session_id: "s1" })).toBe("s1");
    expect(pickSessionId({ conversation_id: "c1" })).toBe("c1");
  });

  it("reads the provider's id as the conversation id", () => {
    // This gateway returns its conversation id in `id`; it is forwarded as `conversation_id`.
    expect(pickSessionId({ id: "chatcmpl-36d1eb0d" })).toBe("chatcmpl-36d1eb0d");
  });

  it("falls back to response headers", () => {
    const response = new Response("{}", { headers: { "x-session-id": "h1" } });
    expect(pickSessionId({}, response)).toBe("h1");
  });

  it("prefers the payload over headers", () => {
    const response = new Response("{}", { headers: { "x-session-id": "h1" } });
    expect(pickSessionId({ session_id: "s1" }, response)).toBe("s1");
  });
});

describe("withConversation", () => {
  it("adds the field only when there is an id", () => {
    expect(withConversation({ model: "m" }, "")).toEqual({ model: "m" });
    expect(withConversation({ model: "m" }, "s1")).toEqual({ model: "m", conversation_id: "s1" });
  });
});
