import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "km_session";

const PUBLIC_API_PATHS = new Set<string>([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/holidays",
]);

const SANDBOX_ALLOWED_PATHS = new Set<string>([
  "/api/auth/logout",
  "/api/auth/me",
  "/api/holidays",
]);

type Role = "manager" | "staff";

type SessionPayload = {
  id: string;
  role: Role;
  employeeId?: string;
  email?: string;
  exp: number;
};

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const decoded = atob(padded);
  const bytes = new Uint8Array(decoded.length);

  for (let i = 0; i < decoded.length; i += 1) {
    bytes[i] = decoded.charCodeAt(i);
  }

  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signWithSecret(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }

  return "dev-only-session-secret-change-me";
}

function parsePayload(payloadPart: string): SessionPayload | null {
  try {
    const payloadText = new TextDecoder().decode(base64UrlToBytes(payloadPart));
    const payload = JSON.parse(payloadText) as SessionPayload;

    if (!payload.id || !payload.role || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function getSessionFromCookie(
  request: NextRequest,
): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) {
    return null;
  }

  const secret = getSessionSecret();
  const expectedSignature = await signWithSecret(payloadPart, secret);
  if (signature !== expectedSignature) {
    return null;
  }

  return parsePayload(payloadPart);
}

function needsManagerRole(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/ai")) return true;
  if (pathname.startsWith("/api/manager")) return true;
  if (pathname.startsWith("/api/revenue-estimates")) return true;
  if (pathname.startsWith("/api/seed")) return true;

  if (
    pathname === "/api/announcements" &&
    ["POST", "PUT", "DELETE"].includes(method)
  )
    return true;
  if (
    pathname === "/api/custom-positions" &&
    ["POST", "DELETE"].includes(method)
  )
    return true;
  if (
    pathname === "/api/shift-templates" &&
    ["POST", "DELETE"].includes(method)
  )
    return true;
  if (pathname === "/api/shifts" && ["POST", "PUT", "DELETE"].includes(method))
    return true;
  if (
    pathname === "/api/time-logs" &&
    ["POST", "PUT", "DELETE"].includes(method)
  )
    return true;
  if (pathname === "/api/employees" && method === "PUT") return true;

  return false;
}

function isSandboxAccount(session: SessionPayload): boolean {
  return (session.email || "").toLowerCase().endsWith("@test.local");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  if (PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const session = await getSessionFromCookie(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isSandboxAccount(session) && !SANDBOX_ALLOWED_PATHS.has(pathname)) {
    return NextResponse.json(
      { error: "Sandbox account cannot access store data" },
      { status: 403 },
    );
  }

  if (
    needsManagerRole(pathname, request.method) &&
    session.role !== "manager"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
