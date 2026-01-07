import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Lấy danh sách shifts (lịch đã xếp)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    
    if (employeeId) {
      where.employeeId = employeeId;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}

// POST: Tạo shift mới (quản lý xếp lịch)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, start, end, type, position, notes, preferenceId } = body;

    console.log('Creating shift:', { employeeId, date, start, end, type, position });

    // Validate required fields
    if (!employeeId || !date || !start || !end || !type) {
      return NextResponse.json(
        { error: 'Missing required fields', received: { employeeId, date, start, end, type } },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      console.error('Employee not found:', employeeId);
      return NextResponse.json(
        { 
          error: 'Employee not found',
          details: `No employee found with ID: ${employeeId}. This may be a legacy localStorage ID. Please logout and login again to sync with database.`
        },
        { status: 404 }
      );
    }

    console.log('Employee found:', employee.name);

    // Create shift
    const shift = await prisma.shift.create({
      data: {
        employeeId,
        date: new Date(date),
        start,
        end,
        type,
        status: 'approved',
        notes: notes || `Position: ${position || 'N/A'}`,
      },
    });

    console.log('Shift created:', shift.id);

    // If this is from a preference, mark preference as approved
    if (preferenceId) {
      await prisma.shiftPreference.update({
        where: { id: preferenceId },
        data: { status: 'approved' },
      });
      console.log('Preference marked as approved:', preferenceId);
    }

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create shift',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật shift
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, start, end, type, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing shift ID' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (start) updateData.start = start;
    if (end) updateData.end = end;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const shift = await prisma.shift.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { error: 'Failed to update shift' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa shift
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing shift ID' },
        { status: 400 }
      );
    }

    await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift' },
      { status: 500 }
    );
  }
}
