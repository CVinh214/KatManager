function stripQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
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

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }

  return "dev-only-session-secret-change-me";
}

export function hasSessionSecret(): boolean {
  return Boolean(process.env.SESSION_SECRET?.trim());
}
