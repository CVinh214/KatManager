import { NextRequest, NextResponse } from 'next/server';
import { optimizeSchedule } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, constraints } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate' },
        { status: 400 }
      );
    }

    // Call AI service to optimize schedule
    const optimizedSchedule = await optimizeSchedule(startDate, endDate, constraints);

    return NextResponse.json({
      success: true,
      schedule: optimizedSchedule,
    });
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to optimize schedule' },
      { status: 500 }
    );
  }
}
