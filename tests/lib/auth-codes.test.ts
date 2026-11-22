import { afterEach, describe, expect, it } from "vitest";
import { parseAuthCodes } from "@/lib/auth-codes";

describe("parseAuthCodes", () => {
  it("keeps every valid six-digit code in a comma-separated list", () => {
    expect(parseAuthCodes("456789,345623,789034,125256")).toEqual([
      "456789",
      "345623",
      "789034",
      "125256",
    ]);
  });

  it("tolerates surrounding spaces and duplicates", () => {
    expect(parseAuthCodes(" 456789, 345623 ,456789,789034 ")).toEqual(["456789", "345623", "789034"]);
  });

  it("does not treat other separators as separators", () => {
    expect(parseAuthCodes("456789，345623")).toEqual([]);
    expect(parseAuthCodes("456789 345623")).toEqual([]);
  });

  it("drops entries that are not six digits", () => {
    expect(parseAuthCodes("456789,12345,abcdef,1234567")).toEqual(["456789"]);
  });

  it("returns nothing when the variable is missing or empty", () => {
    expect(parseAuthCodes(undefined)).toEqual([]);
    expect(parseAuthCodes("  ,  ")).toEqual([]);
  });
});

describe("auth API", () => {
  const originalSecret = process.env.AUTH_SECRET;
  const originalCodes = process.env.AUTH_CODE;

  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret;
    process.env.AUTH_CODE = originalCodes;
  });

  async function login(code: string) {
    process.env.AUTH_SECRET = "test-secret-that-is-at-least-32-characters";
    const { POST } = await import("@/app/api/auth/route");
    return POST(
      new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { "x-forwarded-for": `test-${crypto.randomUUID()}` },
        body: JSON.stringify({ code }),
      }),
    );
  }

  it("accepts any of the configured codes", async () => {
    process.env.AUTH_CODE = "456789,345623,789034,125256";

    for (const code of ["456789", "345623", "789034", "125256"]) {
      const response = await login(code);
      expect(response.status).toBe(200);
      expect(await response.json()).toHaveProperty("token");
    }
  });

  it("rejects a code that is not configured", async () => {
    process.env.AUTH_CODE = "456789,345623";

    const response = await login("111111");
    expect(response.status).toBe(401);
  });

  it("reports an unconfigured login service when no code is valid", async () => {
    process.env.AUTH_CODE = "12345,abc";

    const response = await login("456789");
    expect(response.status).toBe(503);
  });
});
