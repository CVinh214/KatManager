import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Lấy danh sách shift preferences
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

    const preferences = await prisma.shiftPreference.findMany({
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

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching shift preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift preferences' },
      { status: 500 }
    );
  }
}

// POST: Tạo shift preference mới (nhân viên đăng ký)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { employeeId, date, startTime, endTime, notes, isOff } = body;

    // Validate required fields
    if (!employeeId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId and date are required' },
        { status: 400 }
      );
    }

    // Nếu không phải nghỉ phép, validate startTime và endTime
    if (!isOff && (!startTime || !endTime)) {
      return NextResponse.json(
        { error: 'Missing required fields: startTime and endTime are required for work shifts' },
        { status: 400 }
      );
    }

    // If employeeId looks like old localStorage ID (emp-xxx), find real employee by checking all employees
    // This is a temporary fix until we implement proper authentication with database
    if (employeeId.startsWith('emp-')) {
      console.warn('Legacy employeeId detected, attempting to find employee by other means');
      // For now, we'll try to use the employeeId as-is and let it fail if not found
      // In production, you should implement proper auth that returns database employee IDs
    }

    // Validate time - chỉ khi không phải nghỉ phép
    if (!isOff && startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        );
      }
    }

    // Check if employee exists (optional - commented out for now)
    // TODO: Uncomment after implementing proper authentication
    // const employee = await prisma.employee.findUnique({
    //   where: { id: employeeId },
    // });

    // if (!employee) {
    //   return NextResponse.json(
    //     { error: 'Employee not found' },
    //     { status: 404 }
    //   );
    // }

    // Upsert: Create or update if exists
    const preference = await prisma.shiftPreference.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(date),
        },
      },
      update: {
        startTime: isOff ? null : startTime,
        endTime: isOff ? null : endTime,
        isOff: isOff || false,
        notes,
        status: 'pending', // Reset to pending if updating
      },
      create: {
        employeeId,
        date: new Date(date),
        startTime: isOff ? null : startTime,
        endTime: isOff ? null : endTime,
        isOff: isOff || false,
        notes,
        status: 'pending',
      },
    });

    return NextResponse.json(preference, { status: 201 });
  } catch (error) {
    console.error('Error creating shift preference:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create shift preference',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật shift preference
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, startTime, endTime, notes, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing preference ID' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;

    const preference = await prisma.shiftPreference.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(preference);
  } catch (error) {
    console.error('Error updating shift preference:', error);
    return NextResponse.json(
      { error: 'Failed to update shift preference' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa shift preference
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing preference ID' },
        { status: 400 }
      );
    }

    await prisma.shiftPreference.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Preference deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift preference:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift preference' },
      { status: 500 }
    );
  }
}
