import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasSessionSecret } from "@/lib/env";
import { setSessionCookie } from "@/lib/security/session";

const DEFAULT_PASSWORD = "Kat123@";
const DEMO_PASSWORD = "123";

// POST: Đăng nhập với email/phone và password
export async function POST(request: NextRequest) {
  try {
    if (!hasSessionSecret()) {
      console.error("Login blocked: SESSION_SECRET is missing");
      return NextResponse.json(
        {
          success: false,
          error: "Server chưa cấu hình SESSION_SECRET. Kiểm tra file .env trên VPS.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email/SĐT và mật khẩu là bắt buộc" },
        { status: 400 },
      );
    }

    // Tìm user trong database theo email hoặc phone
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true,
      },
    });

    // Nếu không tìm thấy theo email, thử tìm theo phone
    if (!user) {
      const employee = await prisma.employee.findFirst({
        where: { phone: email },
        include: { user: { include: { employee: true } } },
      });

      if (employee?.user) {
        user = employee.user;
      }
    }

    if (!user) {
      // Thử với email demo
      if (email === "admin@company.com" || email === "staff@company.com") {
        // Demo accounts - tìm user với role tương ứng
        const role = email === "admin@company.com" ? "manager" : "staff";
        const demoUser = await prisma.user.findFirst({
          where: { role },
          include: { employee: true },
        });

        if (
          demoUser &&
          (password === DEMO_PASSWORD || password === DEFAULT_PASSWORD)
        ) {
          const response = NextResponse.json({
            success: true,
            user: {
              id: demoUser.id,
              email: demoUser.email,
              role: demoUser.role,
              employeeId: demoUser.employeeId,
              avatar: demoUser.employee?.avatar || null,
              employee: demoUser.employee
                ? {
                    id: demoUser.employee.id,
                    code: demoUser.employee.code,
                    name: demoUser.employee.name,
                    employeeRole: demoUser.employee.employeeRole,
                  }
                : null,
            },
          });
          setSessionCookie(response, {
            id: demoUser.id,
            role: demoUser.role,
            employeeId: demoUser.employeeId || undefined,
            email: demoUser.email,
          });
          return response;
        }
      }

      return NextResponse.json(
        { success: false, error: "Email/SĐT hoặc mật khẩu không đúng" },
        { status: 401 },
      );
    }

    // So sánh password
    // Chấp nhận: password trong DB, default password, hoặc demo password
    const validPasswords = [user.password, DEFAULT_PASSWORD, DEMO_PASSWORD];
    if (!validPasswords.includes(password)) {
      return NextResponse.json(
        { success: false, error: "Email/SĐT hoặc mật khẩu không đúng" },
        { status: 401 },
      );
    }

    // Trả về thông tin user
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        avatar: user.employee?.avatar || null,
        employee: user.employee
          ? {
              id: user.employee.id,
              code: user.employee.code,
              name: user.employee.name,
              employeeRole: user.employee.employeeRole,
            }
          : null,
      },
    });
    setSessionCookie(response, {
      id: user.id,
      role: user.role,
      employeeId: user.employeeId || undefined,
      email: user.email,
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Không kết nối được database. Kiểm tra DATABASE_URL trong .env trên VPS và Supabase.",
        },
        { status: 503 },
      );
    }

    if (error instanceof Error && error.message.includes("SESSION_SECRET")) {
      return NextResponse.json(
        {
          success: false,
          error: "Server chưa cấu hình SESSION_SECRET.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Đã xảy ra lỗi khi đăng nhập" },
      { status: 500 },
    );
  }
}
