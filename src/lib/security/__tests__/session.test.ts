import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, requireSession } from "../session";

function makeRequest(token?: string) {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `km_session=${token}`);
  }

  return new NextRequest("http://localhost/api/test", { headers });
}

describe("session auth guard", () => {
  it("returns 401 when session cookie is missing", () => {
    const req = makeRequest();
    const result = requireSession(req, ["manager"]);

    expect(result.ok).toBe(false);
    expect(result.response?.status).toBe(401);
  });

  it("returns 403 when role is not allowed", () => {
    const token = createSessionToken({
      id: "u-staff",
      role: "staff",
      employeeId: "e-1",
      email: "staff@example.com",
    });

    const req = makeRequest(token);
    const result = requireSession(req, ["manager"]);

    expect(result.ok).toBe(false);
    expect(result.response?.status).toBe(403);
  });

  it("allows access when role matches", () => {
    const token = createSessionToken({
      id: "u-manager",
      role: "manager",
      employeeId: "e-2",
      email: "manager@example.com",
    });

    const req = makeRequest(token);
    const result = requireSession(req, ["manager"]);

    expect(result.ok).toBe(true);
    expect(result.user?.id).toBe("u-manager");
    expect(result.user?.role).toBe("manager");
  });
});
