import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Simple in-memory lock to prevent duplicate submissions
const submissionLocks = new Map<string, number>();
const LOCK_DURATION = 2000; // 2 seconds

function acquireLock(key: string): boolean {
  const now = Date.now();
  const existing = submissionLocks.get(key);
  
  if (existing && now - existing > LOCK_DURATION) {
    submissionLocks.delete(key);
  }
  
  if (submissionLocks.has(key)) {
    return false;
  }
  
  submissionLocks.set(key, now);
  return true;
}

function releaseLock(key: string): void {
  submissionLocks.delete(key);
}

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
      // Parse dates in local timezone to avoid offset issues
      const [startY, startM, startD] = startDate.split('-').map(Number);
      const [endY, endM, endD] = endDate.split('-').map(Number);
      
      where.date = {
        gte: new Date(startY, startM - 1, startD, 0, 0, 0, 0),
        lte: new Date(endY, endM - 1, endD, 23, 59, 59, 999),
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

    // Create lock key for duplicate prevention
    const lockKey = `timelog:${employeeId}:${date}:${position}`;
    
    if (!acquireLock(lockKey)) {
      console.warn(`[Duplicate Prevention] Blocked duplicate time log creation`);
      return NextResponse.json(
        { error: 'Request already in progress, please wait' },
        { status: 429 }
      );
    }

    try {
      // Calculate total hours
      let totalHours = 0;
      if (position !== 'OFF' && actualStart && actualEnd) {
        const [startHour, startMin] = actualStart.split(':').map(Number);
        const [endHour, endMin] = actualEnd.split(':').map(Number);
        totalHours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
      }

      // Time log không cần tạo shift - chỉ ghi nhận giờ công thực tế
      const [y, m, d] = date.split('-').map(Number);
      const timeLog = await prisma.timeLog.create({
        data: {
          employeeId,
          date: new Date(y, m - 1, d, 12, 0, 0, 0),
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
    } finally {
      releaseLock(lockKey);
    }
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
