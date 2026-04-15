import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/security/session";

// GET: Lấy thông tin user hiện tại từ session cookie
export async function GET(request: NextRequest) {
  try {
    const auth = requireSession(request, ["manager", "staff"]);
    if (!auth.ok) return auth.response;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        employee: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      employee: user.employee
        ? {
            id: user.employee.id,
            code: user.employee.code,
            name: user.employee.name,
            employeeRole: user.employee.employeeRole,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
