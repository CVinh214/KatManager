import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import { hasSessionSecret } from "@/lib/env";

export async function GET() {
  const checks: Record<string, string> = {
    database: "unknown",
    sessionSecret: hasSessionSecret() ? "ok" : "missing",
  };

  try {
    await checkDatabaseConnection();
    checks.database = "ok";
  } catch (error) {
    checks.database = "error";
    console.error("Health check database error:", error);
  }

  const healthy = checks.database === "ok" && checks.sessionSecret === "ok";

  return NextResponse.json(
    {
      ok: healthy,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
