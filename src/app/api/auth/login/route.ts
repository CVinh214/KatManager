import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_PASSWORD = 'Kat123@';
const DEMO_PASSWORD = '123';

// POST: Đăng nhập với email/phone và password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email/SĐT và mật khẩu là bắt buộc' },
        { status: 400 }
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
      if (email === 'admin@company.com' || email === 'staff@company.com') {
        // Demo accounts - tìm user với role tương ứng
        const role = email === 'admin@company.com' ? 'manager' : 'staff';
        const demoUser = await prisma.user.findFirst({
          where: { role },
          include: { employee: true },
        });
        
        if (demoUser && (password === DEMO_PASSWORD || password === DEFAULT_PASSWORD)) {
          return NextResponse.json({
            success: true,
            user: {
              id: demoUser.id,
              email: demoUser.email,
              role: demoUser.role,
              employeeId: demoUser.employeeId,
              employee: demoUser.employee ? {
                id: demoUser.employee.id,
                code: demoUser.employee.code,
                name: demoUser.employee.name,
                employeeRole: demoUser.employee.employeeRole,
              } : null,
            },
          });
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Email/SĐT hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // So sánh password
    // Chấp nhận: password trong DB, default password, hoặc demo password
    const validPasswords = [user.password, DEFAULT_PASSWORD, DEMO_PASSWORD];
    if (!validPasswords.includes(password)) {
      return NextResponse.json(
        { success: false, error: 'Email/SĐT hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Trả về thông tin user
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee ? {
          id: user.employee.id,
          code: user.employee.code,
          name: user.employee.name,
          employeeRole: user.employee.employeeRole,
        } : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi đăng nhập' },
      { status: 500 }
    );
  }
}
