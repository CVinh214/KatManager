import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Lấy danh sách custom positions
export async function GET() {
  try {
    const positions = await prisma.customPosition.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching custom positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom positions' },
      { status: 500 }
    );
  }
}

// POST - Tạo custom position mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, label, color, icon } = body;

    if (!name || !label) {
      return NextResponse.json(
        { error: 'Name and label are required' },
        { status: 400 }
      );
    }

    const position = await prisma.customPosition.create({
      data: {
        name,
        label,
        color: color || '#6366f1',
        icon: icon || '📦',
      },
    });

    return NextResponse.json(position);
  } catch (error: any) {
    console.error('Error creating custom position:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Position name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create custom position' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa custom position (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    await prisma.customPosition.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom position:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom position' },
      { status: 500 }
    );
  }
}
