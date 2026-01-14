/**
 * Date utilities with timezone-safe handling for Vietnam (UTC+7)
 * Fixes the issue where dates shift when accessed at 6am
 */

/**
 * Parse date string (YYYY-MM-DD) to Date object without timezone conversion
 * This ensures "2026-01-15" stays as Jan 15 in local timezone
 */
export function parseDateSafe(dateStr: string): Date {
  // Parse as local date, not UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Convert Date to YYYY-MM-DD in local timezone
 * Replaces date.toISOString().split('T')[0] which uses UTC
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end of day in local timezone for database queries
 */
export function getDateRangeLocal(dateStr: string): { start: Date; end: Date } {
  const date = parseDateSafe(dateStr);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get week dates starting from Monday (for Vietnam)
 */
export function getWeekDates(date: Date = new Date()): Date[] {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(curr.getFullYear(), curr.getMonth(), first + i, 0, 0, 0, 0);
    dates.push(day);
  }
  
  return dates;
}

/**
 * Get date range for API queries (returns YYYY-MM-DD strings)
 */
export function getWeekDateRange(weekStart: Date): { startDate: string; endDate: string } {
  const dates = getWeekDates(weekStart);
  return {
    startDate: formatDateLocal(dates[0]),
    endDate: formatDateLocal(dates[6]),
  };
}