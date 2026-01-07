import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lấy danh sách shift templates
export async function GET() {
  try {
    const templates = await prisma.shiftTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching shift templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift templates' },
      { status: 500 }
    );
  }
}

// POST - Tạo shift template mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startTime, endTime, hours } = body;

    if (!name || !startTime || !endTime || hours === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const template = await prisma.shiftTemplate.create({
      data: {
        name,
        startTime,
        endTime,
        hours,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating shift template:', error);
    return NextResponse.json(
      { error: 'Failed to create shift template' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa shift template (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await prisma.shiftTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift template:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift template' },
      { status: 500 }
    );
  }
}
