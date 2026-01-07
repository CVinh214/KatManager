'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useShiftStore } from '@/store/shift-store';
import { getWeekDates, formatDateISO } from '@/lib/utils';
import { Calendar, Clock, AlertCircle, CheckCircle, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { VietnamHoliday, getHolidaysInRange, getLunarDateText } from '@/lib/vietnam-holidays';

interface PreferenceForm {
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

const SHIFT_TEMPLATES = [
  { name: 'Ca sáng (7h30 - 12h30)', start: '07:30', end: '12:30' },
  { name: 'Ca chiều (12h30 - 17h)', start: '12:30', end: '17:00' },
  { name: 'Ca tối (17h - 22h)', start: '17:00', end: '22:00' },
  { name: 'Ca sáng dài (7h30 - 15h)', start: '07:30', end: '15:00' },
  { name: 'Ca chiều dài (15h - 22h)', start: '15:00', end: '22:00' },
];

export default function ShiftPreferenceForm() {
  const { user, isHydrated } = useAuth();
  const { addShiftPreference, shiftPreferences, isRegistrationEnabled, loadShiftPreferences, loadShifts } = useShiftStore();
  
  // Initialize with NEXT WEEK instead of current week
  const getNextWeek = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7); // Add 7 days
    return nextWeek;
  };
  
  const [currentWeek, setCurrentWeek] = useState<Date>(getNextWeek());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [form, setForm] = useState<PreferenceForm>({
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [assignedShifts, setAssignedShifts] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<VietnamHoliday[]>([]);

  // Load shift preferences and shifts from API when user or week changes
  useEffect(() => {
    if (user?.employeeId && weekDates.length > 0) {
      const startDate = formatDateISO(weekDates[0]);
      const endDate = formatDateISO(weekDates[6]);
      loadShiftPreferences(user.employeeId, startDate, endDate);
      loadShifts(user.employeeId, startDate, endDate);
    }
  }, [user?.employeeId, weekDates, loadShiftPreferences, loadShifts]);

  // Load lịch đã được xếp từ shifts store
  useEffect(() => {
    const { shifts } = useShiftStore.getState();
    if (user?.employeeId) {
      const myShifts = shifts.filter(s => s.employeeId === user.employeeId);
      setAssignedShifts(myShifts.map(s => ({
        employeeId: s.employeeId,
        date: s.date,
        startTime: s.start,
        endTime: s.end,
        position: s.notes?.includes('Position:') ? s.notes.split('Position:')[1].trim() : 'N/A',
        hours: calculateHours(s.start, s.end),
      })));
    }
  }, [user?.employeeId, useShiftStore.getState().shifts]);

  const calculateHours = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  };

  useEffect(() => {
    const dates = getWeekDates(currentWeek);
    setWeekDates(dates);
    checkRegistrationTime();
  }, [currentWeek, isRegistrationEnabled]);

  // Load holidays when week changes
  useEffect(() => {
    if (weekDates.length > 0) {
      const startDate = formatDateISO(weekDates[0]);
      const endDate = formatDateISO(weekDates[6]);
      const weekHolidays = getHolidaysInRange(startDate, endDate);
      setHolidays(weekHolidays);
    }
  }, [weekDates]);

  // Helper to get holiday for a specific date
  const getHolidayForDate = (date: string): VietnamHoliday | undefined => {
    return holidays.find(h => h.date === date);
  };

  const checkRegistrationTime = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Nếu quản lý bật override, luôn cho phép đăng ký
    // Nếu không, chỉ cho phép T2-T6 (1-5)
    const isWeekdayTime = dayOfWeek >= 1 && dayOfWeek <= 5;
    setIsRegistrationOpen(isRegistrationEnabled || isWeekdayTime);
  };

  // Cho phép đăng ký tất cả các ngày trong tuần (bao gồm T7, CN)
  const isWeekday = (date: Date) => {
    return true; // Cho phép đăng ký mọi ngày trong tuần (T2-CN)
  };

  const hasPreference = (dateStr: string) => {
    if (!user?.employeeId) return false;
    return shiftPreferences.some(
      (p) => p.employeeId === user.employeeId && p.date === dateStr
    );
  };

  const getPreference = (dateStr: string) => {
    if (!user?.employeeId) return null;
    return shiftPreferences.find(
      (p) => p.employeeId === user.employeeId && p.date === dateStr
    );
  };

  // Lấy lịch đã được quản lý xếp cho nhân viên
  const getAssignedShift = (dateStr: string) => {
    if (!user?.employeeId) return null;
    return assignedShifts.find(
      (s: any) => s.employeeId === user.employeeId && s.date === dateStr
    );
  };

  const handleTemplateSelect = (template: typeof SHIFT_TEMPLATES[0]) => {
    setForm({
      ...form,
      startTime: template.start,
      endTime: template.end,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!user?.employeeId) {
      setMessage({ type: 'error', text: 'Không tìm thấy thông tin nhân viên' });
      return;
    }

    if (!isRegistrationOpen) {
      setMessage({ 
        type: 'error', 
        text: 'Chỉ được đăng ký lịch từ 0h Thứ 2 đến 23h59 Thứ 6. Hiện tại là ngoài thời gian đăng ký.' 
      });
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    // Validate time
    const [startHour, startMin] = form.startTime.split(':').map(Number);
    const [endHour, endMin] = form.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      setMessage({ type: 'error', text: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc' });
      return;
    }

    try {
      // Add to store
      await addShiftPreference({
        employeeId: user.employeeId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        status: 'pending',
        notes: form.notes,
      });

      setMessage({ 
        type: 'success', 
        text: 'Đăng ký lịch thành công! Quản lý sẽ xem xét và xếp lịch cho bạn.' 
      });

      // Reset form
      setForm({
        date: '',
        startTime: '',
        endTime: '',
        notes: '',
      });
      setSelectedDate('');
    } catch (error) {
      console.error('Shift preference error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng ký lịch' 
      });
    }
  };

  // Loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Auth check
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để sử dụng tính năng này</p>
          <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="text-indigo-600" size={24} />
          Đăng ký lịch làm việc
        </h2>

        {/* Thông báo thời gian đăng ký - Simplified for mobile */}
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
          isRegistrationOpen 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {isRegistrationOpen ? (
              <CheckCircle className="text-green-600 mt-0.5 shrink-0" size={18} />
            ) : (
              <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
            )}
            <div>
              <p className={`font-semibold text-sm ${
                isRegistrationOpen ? 'text-green-800' : 'text-red-800'
              }`}>
                {isRegistrationOpen 
                  ? 'Đang trong thời gian đăng ký' 
                  : 'Ngoài thời gian đăng ký'}
              </p>
              <p className={`text-xs sm:text-sm ${
                isRegistrationOpen ? 'text-green-700' : 'text-red-700'
              }`}>
                Thời gian: <strong>T2 (0h) - T6 (23h59)</strong>
                {isRegistrationEnabled && (
                  <span className="block text-blue-700 font-semibold mt-1">
                    🔓 Đã bật đăng ký đặc biệt
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Calendar view - Mobile optimized */}
        <div className="mb-4 sm:mb-6">
          {/* Week navigation - Mobile friendly */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <button
              type="button"
              onClick={() => {
                const newWeek = new Date(currentWeek);
                newWeek.setDate(newWeek.getDate() - 7);
                setCurrentWeek(newWeek);
              }}
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-900"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 text-center">
              {weekDates.length > 0 && (
                <>
                  {weekDates[0].getDate()}/{weekDates[0].getMonth() + 1} - {weekDates[6].getDate()}/{weekDates[6].getMonth() + 1}
                </>
              )}
            </h3>
            <button
              type="button"
              onClick={() => {
                const newWeek = new Date(currentWeek);
                newWeek.setDate(newWeek.getDate() + 7);
                setCurrentWeek(newWeek);
              }}
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-900"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Chọn ngày làm việc
          </h3>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDates.map((date, idx) => {
              const dateStr = formatDateISO(date);
              const hasPref = hasPreference(dateStr);
              const pref = getPreference(dateStr);
              const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const holiday = getHolidayForDate(dateStr);
              const lunarText = getLunarDateText(dateStr);
              const isPublicHoliday = holiday?.type === 'public';

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isRegistrationOpen}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setForm({ ...form, date: dateStr });
                  }}
                  title={holiday ? holiday.name : ''}
                  className={`p-1.5 sm:p-3 rounded-lg border-2 text-center transition-all ${
                    hasPref
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : selectedDate === dateStr
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : isPublicHoliday
                      ? 'bg-red-50 border-red-400 text-red-900'
                      : holiday
                      ? 'bg-orange-50 border-orange-300 text-orange-900'
                      : isWeekend
                      ? 'bg-orange-50 border-orange-300 text-orange-900'
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${!isRegistrationOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-bold text-xs sm:text-sm">{dayNames[date.getDay()]}</div>
                  <div className="text-xs sm:text-sm">{date.getDate()}</div>
                  {holiday && (
                    <div className="hidden sm:block">
                      {isPublicHoliday && <Star size={10} className="mx-auto fill-red-500 text-red-500" />}
                    </div>
                  )}
                  {hasPref && pref && (
                    <div className="text-[10px] mt-0.5 font-semibold hidden sm:block">
                      {pref.startTime}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form đăng ký - Mobile optimized */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Khung giờ mẫu */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Chọn khung giờ có sẵn
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHIFT_TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  disabled={!isRegistrationOpen}
                  className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1">
                <Clock size={14} /> Giờ bắt đầu
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                disabled={!isRegistrationOpen}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5 flex items-center gap-1">
                <Clock size={14} /> Giờ kết thúc
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                disabled={!isRegistrationOpen}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="Ví dụ: Tôi muốn làm ca sáng..."
              disabled={!isRegistrationOpen}
            />
          </div>

          <button
            type="submit"
            disabled={!isRegistrationOpen || !form.date || !form.startTime || !form.endTime}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Đăng ký lịch làm việc
          </button>
        </form>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Lịch đã đăng ký */}
        <div className="mt-6 text-gray-900">
          <h3 className="text-base font-semibold mb-2">Lịch đã đăng ký</h3>
          <div className="space-y-2">
            {weekDates
              .filter(date => isWeekday(date))
              .map(date => {
                const dateStr = formatDateISO(date);
                const pref = getPreference(dateStr);
                const assignedShift = getAssignedShift(dateStr);
                const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                
                if (!pref && !assignedShift) return null;

                return (
                  <div 
                    key={dateStr}
                    className={`p-3 rounded-lg border ${
                      assignedShift
                        ? 'bg-green-50 border-green-300'
                        : pref?.status === 'rejected'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-blue-50 border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900">
                          {dayNames[date.getDay()]}, {date.getDate()}/{date.getMonth() + 1}
                        </div>
                        {assignedShift ? (
                          <div className="text-xs text-green-700 mt-1">
                            📍 {assignedShift.position} | {assignedShift.startTime}-{assignedShift.endTime} ({assignedShift.hours.toFixed(1)}h)
                          </div>
                        ) : pref && (
                          <div className="text-xs text-gray-600 mt-1">
                            {pref.startTime}-{pref.endTime}
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        assignedShift
                          ? 'bg-green-200 text-green-800'
                          : pref?.status === 'rejected'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {assignedShift && '✓ Đã xếp'}
                        {!assignedShift && pref?.status === 'rejected' && '✗'}
                        {!assignedShift && pref?.status === 'pending' && '⏳'}
                      </div>
                    </div>
                  </div>
                );
              })}
            {!weekDates.some(date => hasPreference(formatDateISO(date)) || getAssignedShift(formatDateISO(date))) && (
              <p className="text-center text-gray-500 py-4 text-sm">
                Chưa có lịch đăng ký cho tuần này
              </p>
            )}
          </div>
        </div>
      </div>
    </div>);
}
