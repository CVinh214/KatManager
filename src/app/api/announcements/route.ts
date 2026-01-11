import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// GET - Lấy danh sách thông báo
export async function GET(request: NextRequest) {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// POST - Tạo thông báo mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, imageUrl, createdBy } = body;

    // Validation
    if (!title || !content || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create lock key for duplicate prevention
    const lockKey = `announcement:${createdBy}:${title.substring(0, 20)}`;
    
    if (!acquireLock(lockKey)) {
      console.warn(`[Duplicate Prevention] Blocked duplicate announcement creation`);
      return NextResponse.json(
        { error: 'Request already in progress, please wait' },
        { status: 429 }
      );
    }

    try {
      const announcement = await prisma.announcement.create({
        data: {
          title,
          content,
          imageUrl,
          createdBy,
        },
      });

      return NextResponse.json(announcement, { status: 201 });
    } finally {
      releaseLock(lockKey);
    }
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật thông báo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, imageUrl } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement id is required' },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa thông báo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement id is required' },
        { status: 400 }
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
