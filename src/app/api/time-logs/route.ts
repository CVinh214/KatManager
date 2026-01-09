import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lấy danh sách time logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    // Optional: filter by employeeId
    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Optional: filter by date range
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Format date to string for frontend
    const formattedLogs = timeLogs.map(log => ({
      ...log,
      date: log.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching time logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time logs' },
      { status: 500 }
    );
  }
}

// POST - Tạo time log mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, actualStart, actualEnd, position, positionNote, notes } = body;

    // Validation
    if (!employeeId || !date || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Nếu không phải OFF, validate actualStart và actualEnd
    if (position !== 'OFF' && (!actualStart || !actualEnd)) {
      return NextResponse.json(
        { error: 'actualStart and actualEnd are required for non-OFF positions' },
        { status: 400 }
      );
    }

    // Calculate total hours
    let totalHours = 0;
    if (position !== 'OFF' && actualStart && actualEnd) {
      const [startHour, startMin] = actualStart.split(':').map(Number);
      const [endHour, endMin] = actualEnd.split(':').map(Number);
      totalHours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
    }

    // Time log không cần tạo shift - chỉ ghi nhận giờ công thực tế
    const timeLog = await prisma.timeLog.create({
      data: {
        employeeId,
        date: new Date(date),
        actualStart: position === 'OFF' ? '00:00' : actualStart,
        actualEnd: position === 'OFF' ? '00:00' : actualEnd,
        position,
        positionNote,
        notes,
        totalHours,
      },
      include: {
        employee: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Format date to string for frontend
    const formattedLog = {
      ...timeLog,
      date: timeLog.date.toISOString().split('T')[0],
    };

    return NextResponse.json(formattedLog, { status: 201 });
  } catch (error) {
    console.error('Error creating time log:', error);
    return NextResponse.json(
      { error: 'Failed to create time log' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật time log
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, actualStart, actualEnd, position, positionNote, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Time log id is required' },
        { status: 400 }
      );
    }

    // Calculate total hours
    let totalHours = undefined;
    if (position !== 'OFF' && actualStart && actualEnd) {
      const [startHour, startMin] = actualStart.split(':').map(Number);
      const [endHour, endMin] = actualEnd.split(':').map(Number);
      totalHours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
    } else if (position === 'OFF') {
      totalHours = 0;
    }

    const timeLog = await prisma.timeLog.update({
      where: { id },
      data: {
        ...(actualStart && { actualStart: position === 'OFF' ? '00:00' : actualStart }),
        ...(actualEnd && { actualEnd: position === 'OFF' ? '00:00' : actualEnd }),
        ...(actualEnd && { actualEnd }),
        ...(position && { position }),
        ...(positionNote !== undefined && { positionNote }),
        ...(notes !== undefined && { notes }),
        ...(totalHours !== undefined && { totalHours }),
      },
      include: {
        employee: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Format date to string for frontend
    const formattedLog = {
      ...timeLog,
      date: timeLog.date.toISOString().split('T')[0],
    };

    return NextResponse.json(formattedLog);
  } catch (error) {
    console.error('Error updating time log:', error);
    return NextResponse.json(
      { error: 'Failed to update time log' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa time log
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Time log id is required' },
        { status: 400 }
      );
    }

    await prisma.timeLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time log:', error);
    return NextResponse.json(
      { error: 'Failed to delete time log' },
      { status: 500 }
    );
  }
}
