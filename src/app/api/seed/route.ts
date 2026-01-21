import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Danh sách 11 nhân viên từ ACCOUNTS_INFO.md
const EMPLOYEES_DATA = [
  {
    code: 'K1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    employeeRole: 'SM',
    role: 'manager',
    phone: null,
  },
  {
    code: 'K2',
    name: 'Lê Văn B',
    email: 'levanb@example.com',
    employeeRole: 'FT',
    role: 'staff',
    phone: null,
  },
];

const DEFAULT_PASSWORD = 'Kat123@';

export async function POST() {
  try {
    const results = {
      employeesCreated: 0,
      employeesUpdated: 0,
      usersCreated: 0,
      usersUpdated: 0,
      errors: [] as string[],
    };

    // Password không hash (giống localStorage) - TODO: implement bcrypt later
    const password = DEFAULT_PASSWORD;

    for (const empData of EMPLOYEES_DATA) {
      try {
        // Upsert employee
        const employee = await prisma.employee.upsert({
          where: { email: empData.email },
          update: {
            code: empData.code,
            name: empData.name,
            employeeRole: empData.employeeRole as any,
            role: empData.role as any,
            phone: empData.phone,
          },
          create: {
            code: empData.code,
            name: empData.name,
            email: empData.email,
            employeeRole: empData.employeeRole as any,
            role: empData.role as any,
            phone: empData.phone,
          },
        });

        const isNewEmployee = !results.employeesUpdated;
        if (isNewEmployee) {
          results.employeesCreated++;
        } else {
          results.employeesUpdated++;
        }

        // Upsert user account
        const user = await prisma.user.upsert({
          where: { email: empData.email },
          update: {
            role: empData.role as any,
            employeeId: employee.id,
          },
          create: {
            email: empData.email,
            password: password,
            role: empData.role as any,
            employeeId: employee.id,
          },
        });

        const isNewUser = !results.usersUpdated;
        if (isNewUser) {
          results.usersCreated++;
        } else {
          results.usersUpdated++;
        }
      } catch (error) {
        results.errors.push(`Failed to process ${empData.name}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      results,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET method for convenience (can access via browser)
export async function GET() {
  return POST();
}
