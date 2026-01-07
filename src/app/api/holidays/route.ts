import { NextRequest, NextResponse } from 'next/server';
import { getVietnamHolidays, getHolidaysInRange, getHolidayByDate, getLunarDateText } from '@/lib/vietnam-holidays';

// GET: Lấy danh sách ngày lễ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');

    // Lấy ngày lễ theo một ngày cụ thể
    if (date) {
      const holiday = getHolidayByDate(date);
      const lunarText = getLunarDateText(date);
      return NextResponse.json({
        date,
        lunarDate: lunarText,
        holiday: holiday || null,
        isPublicHoliday: holiday?.type === 'public',
      });
    }

    // Lấy ngày lễ trong khoảng thời gian
    if (startDate && endDate) {
      const holidays = getHolidaysInRange(startDate, endDate);
      return NextResponse.json(holidays);
    }

    // Lấy tất cả ngày lễ trong năm
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const holidays = getVietnamHolidays(targetYear);
    
    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}
