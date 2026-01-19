import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateOnly(date) : date;
  return d.toLocaleDateString('vi-VN');
}

export function formatTime(time: string): string {
  return time;
}

export function calculateHours(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
}

export function getWeekDates(date: Date = new Date()): Date[] {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const dates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(curr);
    day.setDate(first + i);
    dates.push(day);
  }
  
  return dates;
}

export function formatDateISO(date: Date): string {
  // Format using local date components to avoid UTC offset shifting the day
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(dateStr: string): Date {
  // Accept either 'YYYY-MM-DD' or full ISO ('YYYY-MM-DDTHH:mm:...') and create a local Date at local midnight.
  if (!dateStr) return new Date(NaN);
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    const [y, m, d] = match[1].split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Fallback to Date constructor for other formats
  return new Date(dateStr);
}
