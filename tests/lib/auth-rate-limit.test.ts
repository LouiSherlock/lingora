import { describe, expect, it } from "vitest";
import { clearLoginFailures, getLoginRateLimit, recordLoginFailure } from "@/lib/auth-rate-limit";

describe("login rate limit", () => {
  it("limits after five failed attempts for the same key", () => {
    const key = `test-${crypto.randomUUID()}`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordLoginFailure(key);
    }

    expect(getLoginRateLimit(key).limited).toBe(true);
    clearLoginFailures(key);
    expect(getLoginRateLimit(key).limited).toBe(false);
  });

  it("tracks keys independently", () => {
    const first = `test-${crypto.randomUUID()}`;
    const second = `test-${crypto.randomUUID()}`;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordLoginFailure(first);
    }

    expect(getLoginRateLimit(second).limited).toBe(false);
  });
});
