import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PUT: Update user avatar
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, avatar } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: {
        id: true,
        email: true,
        role: true,
        employeeId: true,
        avatar: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar' },
      { status: 500 }
    );
  }
}

// GET: Get user avatar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatar: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch avatar' },
      { status: 500 }
    );
  }
}
