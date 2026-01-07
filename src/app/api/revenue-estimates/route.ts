import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Lấy doanh thu ước chừng
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Lấy doanh thu cho một ngày cụ thể
    if (date) {
      const estimate = await prisma.revenueEstimate.findUnique({
        where: { date: new Date(date) },
      });
      
      return NextResponse.json(estimate);
    }

    // Lấy doanh thu trong khoảng thời gian
    if (startDate && endDate) {
      const estimates = await prisma.revenueEstimate.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        orderBy: { date: 'asc' },
      });
      
      return NextResponse.json(estimates);
    }

    // Lấy tất cả
    const estimates = await prisma.revenueEstimate.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    });
    
    return NextResponse.json(estimates);
  } catch (error) {
    console.error('Error fetching revenue estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue estimates' },
      { status: 500 }
    );
  }
}

// POST: Tạo hoặc cập nhật doanh thu ước chừng
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, estimatedRevenue, notes } = body;

    if (!date || !estimatedRevenue) {
      return NextResponse.json(
        { error: 'Date and estimatedRevenue are required' },
        { status: 400 }
      );
    }

    // Upsert: tạo mới hoặc cập nhật nếu đã tồn tại
    const estimate = await prisma.revenueEstimate.upsert({
      where: { date: new Date(date) },
      create: {
        date: new Date(date),
        estimatedRevenue: parseFloat(estimatedRevenue),
        notes,
      },
      update: {
        estimatedRevenue: parseFloat(estimatedRevenue),
        notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error saving revenue estimate:', error);
    return NextResponse.json(
      { error: 'Failed to save revenue estimate' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật doanh thu ước chừng cho nhiều ngày (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { dates, estimatedRevenue, notes } = body;

    if (!dates || !Array.isArray(dates) || !estimatedRevenue) {
      return NextResponse.json(
        { error: 'Dates array and estimatedRevenue are required' },
        { status: 400 }
      );
    }

    // Cập nhật cho nhiều ngày cùng lúc
    const promises = dates.map((date: string) =>
      prisma.revenueEstimate.upsert({
        where: { date: new Date(date) },
        create: {
          date: new Date(date),
          estimatedRevenue: parseFloat(estimatedRevenue),
          notes,
        },
        update: {
          estimatedRevenue: parseFloat(estimatedRevenue),
          notes,
          updatedAt: new Date(),
        },
      })
    );

    const results = await Promise.all(promises);

    return NextResponse.json({
      success: true,
      count: results.length,
      estimates: results,
    });
  } catch (error) {
    console.error('Error bulk updating revenue estimates:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update revenue estimates' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa doanh thu ước chừng
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    await prisma.revenueEstimate.delete({
      where: { date: new Date(date) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting revenue estimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete revenue estimate' },
      { status: 500 }
    );
  }
}
