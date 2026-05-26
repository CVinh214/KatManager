function stripQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

const BUILD_TIME_DATABASE_URL =
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

function isBuildTime(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    if (isBuildTime()) {
      return BUILD_TIME_DATABASE_URL;
    }
    throw new Error("DATABASE_URL is not set");
  }

  let url = stripQuotes(raw);

  if (!url.includes("sslmode=") && !url.includes("ssl=")) {
    url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }

  return url;
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
    ? stripQuotes(process.env.SESSION_SECRET)
    : "";

  if (secret) return secret;

  if (process.env.NODE_ENV === "production" && !isBuildTime()) {
    throw new Error("SESSION_SECRET is required in production");
  }

  return "dev-only-session-secret-change-me";
}

export function hasSessionSecret(): boolean {
  return Boolean(process.env.SESSION_SECRET?.trim());
}
