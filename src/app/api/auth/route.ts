import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { clearLoginFailures, getLoginRateLimit, recordLoginFailure } from "@/lib/auth-rate-limit";
import { signToken } from "@/lib/jwt";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function clientKey(request: Request) {
  // Production proxies should overwrite these headers with the connecting IP.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const key = clientKey(request);
  const rateLimit = getLoginRateLimit(key);
  if (rateLimit.limited) {
    return NextResponse.json(
      { message: "尝试次数过多，请 15 分钟后重试。", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }

  const validCode = process.env.AUTH_CODE;
  if (!validCode || !/^\d{6}$/.test(validCode)) {
    return NextResponse.json({ message: "登录服务尚未配置。", code: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  const code =
    body && typeof body === "object" && "code" in body && typeof body.code === "string"
      ? body.code
      : "";

  if (!/^\d{6}$/.test(code)) {
    recordLoginFailure(key);
    return NextResponse.json({ message: "请输入 6 位数字验证码。", code: "INVALID_CODE_FORMAT" }, { status: 400 });
  }

  if (!safeEqual(code, validCode)) {
    recordLoginFailure(key);
    return NextResponse.json({ message: "验证码错误。", code: "INVALID_CODE" }, { status: 401 });
  }

  try {
    const token = await signToken();
    clearLoginFailures(key);
    return NextResponse.json({ token, expiresIn: 3600 });
  } catch {
    return NextResponse.json({ message: "登录服务尚未配置。", code: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  }
}
