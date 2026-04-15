import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";

export const SESSION_COOKIE_NAME = "km_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface SessionUser {
  id: string;
  role: Role;
  employeeId?: string;
  email?: string;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }

  return "dev-only-session-secret-change-me";
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    id: user.id,
    role: user.role,
    employeeId: user.employeeId,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadPart);
  return `${payloadPart}.${signature}`;
}

export function parseSessionToken(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadPart, signature] = parts;
  const expectedSignature = sign(payloadPart);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return null;

  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as SessionPayload;
    if (!payload.id || !payload.role || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.id,
      role: payload.role,
      employeeId: payload.employeeId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, user: SessionUser) {
  const token = createSessionToken(user);
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionUser(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export function requireSession(request: NextRequest, allowedRoles?: Role[]) {
  const user = getSessionUser(request);
  if (!user) {
    return {
      ok: false as const,
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      ok: false as const,
      user,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    user,
    response: null,
  };
}
