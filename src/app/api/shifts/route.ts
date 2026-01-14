import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Simple in-memory lock to prevent duplicate submissions
const submissionLocks = new Map<string, number>();
const LOCK_DURATION = 2000; // 2 seconds

function acquireLock(key: string): boolean {
  const now = Date.now();
  const existing = submissionLocks.get(key);
  
  // Clean up old locks
  if (existing && now - existing > LOCK_DURATION) {
    submissionLocks.delete(key);
  }
  
  // Check if locked
  if (submissionLocks.has(key)) {
    return false;
  }
  
  // Acquire lock
  submissionLocks.set(key, now);
  return true;
}

function releaseLock(key: string): void {
  submissionLocks.delete(key);
}

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
      // Parse dates in local timezone to avoid offset issues
      const [startY, startM, startD] = startDate.split('-').map(Number);
      const [endY, endM, endD] = endDate.split('-').map(Number);
      
      where.date = {
        gte: new Date(startY, startM - 1, startD, 0, 0, 0, 0),
        lte: new Date(endY, endM - 1, endD, 23, 59, 59, 999),
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

    // Create lock key for duplicate prevention
    const lockKey = `shift:${employeeId}:${date}:${start}:${end}`;
    
    // Try to acquire lock
    if (!acquireLock(lockKey)) {
      console.warn(`[Duplicate Prevention] Blocked duplicate shift creation for ${lockKey}`);
      return NextResponse.json(
        { error: 'Request already in progress, please wait' },
        { status: 429 }
      );
    }

    try {
      // Check if employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      // Create shift
      const [y, m, d] = date.split('-').map(Number);
      const shift = await prisma.shift.create({
        data: {
          employeeId,
          date: new Date(y, m - 1, d, 12, 0, 0, 0),
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
    } finally {
      // Always release lock
      releaseLock(lockKey);
    }
  } catch (error: any) {
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
