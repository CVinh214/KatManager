import { NextRequest, NextResponse } from 'next/server';
import { assessRisks } from '@/lib/ai-service';

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

    // Call AI service to assess risks
    const risks = await assessRisks(employeeId, startDate, endDate);

    return NextResponse.json({
      success: true,
      risks,
    });
  } catch (error) {
    console.error('Error assessing risks:', error);
    return NextResponse.json(
      { error: 'Failed to assess risks' },
      { status: 500 }
    );
  }
}
