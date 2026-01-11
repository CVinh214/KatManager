import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Lấy danh sách employees từ database
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// PUT: Update employee (e.g., avatar)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, avatar, ...otherFields } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (avatar !== undefined) updateData.avatar = avatar;
    
    // Add other fields if provided
    Object.keys(otherFields).forEach(key => {
      if (otherFields[key] !== undefined) {
        updateData[key] = otherFields[key];
      }
    });

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}
