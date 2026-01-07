import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmployeePerformance } from '@/lib/ai-service';

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

    // Call AI service to analyze employee performance
    const analysis = await analyzeEmployeePerformance(employeeId, startDate, endDate);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing employee performance:', error);
    return NextResponse.json(
      { error: 'Failed to analyze employee performance' },
      { status: 500 }
    );
  }
}
