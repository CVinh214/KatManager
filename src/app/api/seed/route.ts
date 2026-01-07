import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Danh sách 11 nhân viên từ ACCOUNTS_INFO.md
const EMPLOYEES_DATA = [
  {
    code: 'K1502',
    name: 'Phạm Thị Lê Quyên',
    email: 'Minciu23@gmail.com',
    employeeRole: 'SM',
    role: 'manager',
    phone: null,
  },
  {
    code: 'K08582',
    name: 'Lê Nguyễn Khánh Vy',
    email: 'khanhvylenguyen1302@gmail.com',
    employeeRole: 'FT',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K1500',
    name: 'Võ Lâm Chi Vĩnh',
    email: 'cvinh214204@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K3288',
    name: 'Vũ Ngọc Diễm Quỳnh',
    email: 'dqynhdaily@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K3762',
    name: 'Trịnh Minh Khánh Vy',
    email: 'khanhvydaiat0@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K6550',
    name: 'Vũ Hoàng Hải Yến',
    email: 'vuhoanghalyen1111@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K7973',
    name: 'Huỳnh Thị Thu Hương',
    email: 'thherena24112006@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K09542',
    name: 'Đinh Hà Vi',
    email: 'nguyenanvy02082005@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K9879',
    name: 'Lê Thị Thu Hiền',
    email: 'lehienb66@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K10103',
    name: 'Phạm Nguyễn Nhật Minh',
    email: 'nhatminhp0@gmail.com',
    employeeRole: 'CL',
    role: 'staff',
    phone: null,
  },
  {
    code: 'K10505',
    name: 'Nguyễn Trần Quốc Anh',
    email: 'rinrin22082008@gmail.com',
    employeeRole: 'CL',
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
