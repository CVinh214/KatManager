import { NextRequest, NextResponse } from 'next/server';
import { analyzeWorkPatterns } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, startDate, endDate } = body;

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Call AI service to analyze work patterns
    const predictions = await analyzeWorkPatterns(employeeId, startDate, endDate);

    return NextResponse.json({
      success: true,
      predictions,
    });
  } catch (error) {
    console.error('Error predicting work patterns:', error);
    return NextResponse.json(
      { error: 'Failed to predict work patterns' },
      { status: 500 }
    );
  }
}
