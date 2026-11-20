import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(raw);
}

export function signToken() {
  return new SignJWT({ role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("login-user")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

export function verifyToken(token: string) {
  return jwtVerify(token, getSecret(), { algorithms: ["HS256"], subject: "login-user" });
}
