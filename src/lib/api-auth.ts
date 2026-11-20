import { errors } from "jose";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

function unauthorized(code: string, message: string) {
  return NextResponse.json(
    { code, message },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

/** Route-handler check in addition to Proxy, so APIs remain protected in depth. */
export async function authorizeApiRequest(request: Request) {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    return NextResponse.json(
      { code: "AUTH_NOT_CONFIGURED", message: "登录服务尚未配置。" },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return unauthorized("MISSING_TOKEN", "未登录");

  try {
    await verifyToken(token);
    return null;
  } catch (error) {
    if (error instanceof errors.JWTExpired) return unauthorized("TOKEN_EXPIRED", "登录已过期");
    return unauthorized("INVALID_TOKEN", "无效的 token");
  }
}
