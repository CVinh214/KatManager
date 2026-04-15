import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { createSessionToken } from "../lib/security/session";

function makeRequest(pathname: string, method = "GET", token?: string) {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `km_session=${token}`);
  }

  return new NextRequest(`http://localhost${pathname}`, {
    method,
    headers,
  });
}

describe("api middleware auth policies", () => {
  it("allows public auth login endpoint without session", async () => {
    const req = makeRequest("/api/auth/login", "POST");
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it("blocks protected endpoint without session (401)", async () => {
    const req = makeRequest("/api/time-logs", "GET");
    const res = await proxy(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Unauthorized" });
  });

  it("blocks manager-only endpoint for staff session (403)", async () => {
    const staffToken = createSessionToken({
      id: "staff-user",
      role: "staff",
      employeeId: "emp-1",
      email: "staff@example.com",
    });

    const req = makeRequest("/api/revenue-estimates", "GET", staffToken);
    const res = await proxy(req);

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: "Forbidden" });
  });

  it("allows manager-only endpoint for manager session", async () => {
    const managerToken = createSessionToken({
      id: "manager-user",
      role: "manager",
      employeeId: "emp-2",
      email: "manager@example.com",
    });

    const req = makeRequest("/api/revenue-estimates", "GET", managerToken);
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it("blocks sandbox test accounts from store data APIs", async () => {
    const sandboxToken = createSessionToken({
      id: "sandbox-admin",
      role: "manager",
      employeeId: "emp-3",
      email: "admin@test.local",
    });

    const req = makeRequest("/api/employees", "GET", sandboxToken);
    const res = await proxy(req);

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      error: "Sandbox account cannot access store data",
    });
  });
});
