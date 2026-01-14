'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useEmployeeStore } from '@/store/employee-store';
import { useShiftStore } from '@/store/shift-store';
import { ChevronLeft, ChevronRight, X, User, Star } from 'lucide-react';
import { getWeekDates, formatDateISO, formatDate } from '@/lib/utils';
import { VietnamHoliday, getHolidaysInRange, getLunarDateText } from '@/lib/vietnam-holidays';
import { getPositionConfig, getPositionIcon, getPositionStyle, setCustomPositions, COLOR_PALETTE, EMOJI_PICKER } from '@/lib/position-config';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const POSITIONS = ['Cashier', 'Waiter', 'Setup', 'OFF'];
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Shift Templates - Các khung giờ làm việc có sẵn
interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  hours: number;
}

const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  { id: '1', name: 'Ca sáng (7h30 - 12h30)', startTime: '07:30', endTime: '12:30', hours: 5.0 },
  { id: '2', name: 'Ca chiều (12h30 - 17h)', startTime: '12:30', endTime: '17:00', hours: 4.5 },
  { id: '3', name: 'Ca tối (17h - 22h)', startTime: '17:00', endTime: '22:00', hours: 5.0 },
  { id: '4', name: 'Ca sáng (7h30 - 15h)', startTime: '07:30', endTime: '15:00', hours: 7.5 },
  { id: '5', name: 'Ca chiều (15h - 22h)', startTime: '15:00', endTime: '22:00', hours: 7.0 },
  { id: '6', name: 'Ca full (7h30 - 17h)', startTime: '07:30', endTime: '17:00', hours: 9.5 },
  { id: '7', name: 'Ca full (12h30 - 22h)', startTime: '12:30', endTime: '22:00', hours: 9.5 },
];

interface ScheduleShift {
  employeeId: string;
  date: string;
  position: string;
  startTime: string;
  endTime: string;
  hours: number;
}

function ScheduleContent() {
  const router = useRouter();
  const { user, isHydrated } = useAuth();
  const { employees, loadEmployees } = useEmployeeStore();
  const { shiftPreferences, getShiftPreferencesByDateRange, isRegistrationEnabled, setRegistrationEnabled, updateShiftPreference, loadShiftPreferences, loadShifts } = useShiftStore();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get('week');
  const [currentWeek, setCurrentWeek] = useState<Date | null>(null);
  const [scheduleShifts, setScheduleShifts] = useState<ScheduleShift[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: string; mode: 'add' | 'edit'; shiftIndex?: number } | null>(null);
  const [editData, setEditData] = useState({ position: '', startTime: '', endTime: '', hours: 0 });
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(DEFAULT_SHIFT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [holidays, setHolidays] = useState<VietnamHoliday[]>([]);
  const [revenueEstimates, setRevenueEstimates] = useState<Record<string, number>>({});
  const [defaultRevenue, setDefaultRevenue] = useState<number>(10000000); // 10 triệu VND mặc định
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string>('');
  const [revenueInput, setRevenueInput] = useState<string>('');
  
  // Custom positions and templates management
  const [customPositions, setCustomPositionsState] = useState<string[]>([]);
  const [customPositionData, setCustomPositionData] = useState<Array<{name: string; color: string; icon: string}>>([]);
  const [allPositions, setAllPositions] = useState<string[]>(POSITIONS);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionColor, setNewPositionColor] = useState('#6366f1');
  const [newPositionIcon, setNewPositionIcon] = useState('📦');
  
  const [customTemplates, setCustomTemplates] = useState<ShiftTemplate[]>([]);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', startTime: '', endTime: '', hours: 0 });

  // Calculate week dates first (MUST be before useEffects that use weekDates)
  const weekDates = useMemo(() => {
    if (!currentWeek) return [];
    return getWeekDates(currentWeek);
  }, [currentWeek]);

  // Load employees from database on mount
  useEffect(() => {
    console.log('Schedule page: Loading employees from database...');
    loadEmployees();
    
    // Load custom positions from database
    loadCustomPositions();
    
    // Load shift templates from database
    loadShiftTemplates();
  }, [loadEmployees]);

  // Load custom positions from API
  const loadCustomPositions = async () => {
    try {
      const response = await fetch('/api/custom-positions');
      if (response.ok) {
        const data = await response.json();
        const positionNames = data.map((p: any) => p.name);
        const positionData = data.map((p: any) => ({ name: p.name, color: p.color, icon: p.icon }));
        setCustomPositionsState(positionNames);
        setCustomPositionData(positionData);
        setAllPositions([...POSITIONS, ...positionNames]);
        
        // Initialize position config helper
        setCustomPositions(positionData);
      }
    } catch (error) {
      console.error('Error loading custom positions:', error);
    }
  };

  // Load shift templates from API
  const loadShiftTemplates = async () => {
    try {
      const response = await fetch('/api/shift-templates');
      if (response.ok) {
        const data = await response.json();
        setCustomTemplates(data);
        setShiftTemplates([...DEFAULT_SHIFT_TEMPLATES, ...data]);
      }
    } catch (error) {
      console.error('Error loading shift templates:', error);
    }
  };

  // Load holidays when week changes
  useEffect(() => {
    if (weekDates.length > 0) {
      const startDate = formatDateISO(weekDates[0]);
      const endDate = formatDateISO(weekDates[6]);
      const weekHolidays = getHolidaysInRange(startDate, endDate);
      setHolidays(weekHolidays);
      console.log('Holidays in week:', weekHolidays);
    }
  }, [weekDates]);
  useEffect(() => {
    if (weekParam) {
      setCurrentWeek(new Date(weekParam));
    } else {
      setCurrentWeek(new Date());
    }
  }, [weekParam]);
  // Load revenue estimates when week changes
  useEffect(() => {
    if (weekDates.length > 0) {
      const startDate = formatDateISO(weekDates[0]);
      const endDate = formatDateISO(weekDates[6]);
      loadRevenueEstimates(startDate, endDate);
    }
  }, [weekDates]);

  // Load revenue estimates from API
  const loadRevenueEstimates = async (startDate: string, endDate: string) => {
    try {
      const response = await fetch(`/api/revenue-estimates?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        const estimates: Record<string, number> = {};
        data.forEach((item: any) => {
          estimates[item.date.split('T')[0]] = item.estimatedRevenue;
        });
        setRevenueEstimates(estimates);
      }
    } catch (error) {
      console.error('Failed to load revenue estimates:', error);
    }
  };

  // Save revenue estimate
  const saveRevenueEstimate = async (date: string, revenue: number) => {
    try {
      const response = await fetch('/api/revenue-estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          estimatedRevenue: revenue,
        }),
      });
      
      if (response.ok) {
        setRevenueEstimates(prev => ({ ...prev, [date]: revenue }));
      }
    } catch (error) {
      console.error('Failed to save revenue estimate:', error);
    }
  };

  // Calculate labor cost percentage for a date
  const calculateLaborCostPercent = (date: string): number => {
    const dateStr = date;
    const revenue = revenueEstimates[dateStr] || defaultRevenue;
    
    if (revenue <= 0) return 0;

    // Tính tổng giờ FT và CL cho ngày này
    let ftHours = 0;
    let clHours = 0;

    ftEmployees.forEach(emp => {
      const shift = getShiftForCell(emp.id, dateStr);
      if (shift) ftHours += shift.hours;
    });

    clEmployees.forEach(emp => {
      const shift = getShiftForCell(emp.id, dateStr);
      if (shift) clHours += shift.hours;
    });

    // Công thức: ((FT hours * 30000) + (CL hours * 24000)) * 100 / revenue
    const laborCost = (ftHours * 30000) + (clHours * 24000);
    const percentage = (laborCost * 100) / revenue;

    return percentage;
  };

  // Handle revenue edit
  const handleEditRevenue = (date: string) => {
    const currentRevenue = revenueEstimates[date] || defaultRevenue;
    setEditingDate(date);
    setRevenueInput(currentRevenue.toString());
    setShowRevenueModal(true);
  };

  const handleSaveRevenue = async () => {
    const revenue = parseFloat(revenueInput);
    if (isNaN(revenue) || revenue <= 0) {
      alert('Vui lòng nhập doanh thu hợp lệ');
      return;
    }

    await saveRevenueEstimate(editingDate, revenue);
    setShowRevenueModal(false);
    setEditingDate('');
    setRevenueInput('');
  };

  // Apply revenue to all days in week
  const applyRevenueToWeek = async () => {
    const revenue = parseFloat(revenueInput);
    if (isNaN(revenue) || revenue <= 0) {
      alert('Vui lòng nhập doanh thu hợp lệ');
      return;
    }

    try {
      const dates = weekDates.slice(0, 7).map(d => formatDateISO(d));
      const response = await fetch('/api/revenue-estimates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates,
          estimatedRevenue: revenue,
        }),
      });
      
      if (response.ok) {
        // Update local state
        const newEstimates = { ...revenueEstimates };
        dates.forEach(date => {
          newEstimates[date] = revenue;
        });
        setRevenueEstimates(newEstimates);
        setShowRevenueModal(false);
        setEditingDate('');
        setRevenueInput('');
      }
    } catch (error) {
      console.error('Failed to apply revenue to week:', error);
      alert('Có lỗi xảy ra khi cập nhật doanh thu');
    }
  };

  // Helper to get holiday for a specific date
  const getHolidayForDate = (date: string): VietnamHoliday | undefined => {
    return holidays.find(h => h.date === date);
  };

  // Helper function
  const calculateHoursFromTime = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
  };

  // Load schedule shifts from API on mount and week change
  useEffect(() => {
    setCurrentWeek(new Date());
    setIsLoaded(true);
  }, []);

  // Load shifts from API when week changes
  useEffect(() => {
    if (!currentWeek || weekDates.length === 0) return;
    
    const startDate = formatDateISO(weekDates[0]);
    const endDate = formatDateISO(weekDates[6]);
    
    console.log('Loading data for week:', startDate, '-', endDate);
    
    // Load shift preferences
    loadShiftPreferences(undefined, startDate, endDate).then(() => {
      console.log('Loaded shift preferences:', useShiftStore.getState().shiftPreferences.length);
    });
    
    // Load shifts and transform to scheduleShifts format
    loadShifts(undefined, startDate, endDate).then(() => {
      const { shifts } = useShiftStore.getState();
      console.log('Loaded shifts:', shifts.length);
      const transformed = shifts
        .filter(s => s.date >= startDate && s.date <= endDate)
        .map(s => ({
          employeeId: s.employeeId,
          date: s.date,
          position: s.notes?.includes('Position:') ? s.notes.split('Position:')[1].trim() : 'N/A',
          startTime: s.start,
          endTime: s.end,
          hours: calculateHoursFromTime(s.start, s.end),
        }));
      setScheduleShifts(transformed);
    });
  }, [currentWeek, weekDates, loadShiftPreferences, loadShifts]);

  // Log shiftPreferences when it changes
  useEffect(() => {
    console.log('ShiftPreferences updated:', shiftPreferences.length, shiftPreferences);
  }, [shiftPreferences]);

  const ftEmployees = useMemo(() => 
    employees.filter((e) => e.employeeRole === 'FT' && e.role === 'staff'),
    [employees]
  );

  const clEmployees = useMemo(() => 
    employees.filter((e) => e.employeeRole === 'CL' && e.role === 'staff'),
    [employees]
  );

  const getShiftsForCell = (employeeId: string, date: string) => {
    return scheduleShifts.filter((s) => s.employeeId === employeeId && s.date === date);
  };
  
  // Legacy function for backward compatibility
  const getShiftForCell = (employeeId: string, date: string) => {
    const shifts = getShiftsForCell(employeeId, date);
    return shifts.length > 0 ? shifts[0] : undefined;
  };
  
  // Lấy shift preference của nhân viên (thời gian đăng ký)
  const getPreferenceForCell = (employeeId: string, date: string) => {
    return shiftPreferences.find((p) => p.employeeId === employeeId && p.date === date);
  };

  
  const calculateWeeklyHours = (employeeId: string) => {
    return scheduleShifts
      .filter((s) => s.employeeId === employeeId)
      .reduce((sum, s) => sum + s.hours, 0);
  };

  const handlePreviousWeek = () => {
    if (!currentWeek) return;
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const handleNextWeek = () => {
    if (!currentWeek) return;
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const handleCellClick = (employeeId: string, date: string, mode: 'add' | 'edit' = 'add', shiftIndex?: number) => {
    if (user?.role !== 'manager') return;
    const existingShifts = getShiftsForCell(employeeId, date);
    const preference = getPreferenceForCell(employeeId, date);
    
    setSelectedCell({ employeeId, date, mode, shiftIndex });
    setSelectedTemplate('');
    
    if (mode === 'edit' && shiftIndex !== undefined && existingShifts[shiftIndex]) {
      // Edit existing shift
      const shift = existingShifts[shiftIndex];
      setEditData({
        position: shift.position,
        startTime: shift.startTime,
        endTime: shift.endTime,
        hours: shift.hours,
      });
    } else if (existingShifts.length === 0 && preference && preference.status === 'pending') {
      // Nếu có preference của nhân viên, tự động điền thời gian đăng ký
      // Bỏ qua nếu là đăng ký nghỉ phép
      if (preference.isOff) {
        // Không tự động điền nếu là nghỉ phép
        setEditData({
          position: '',
          startTime: '',
          endTime: '',
          hours: 0,
        });
      } else if (preference.startTime && preference.endTime) {
        const [startHour, startMin] = preference.startTime.split(':').map(Number);
        const [endHour, endMin] = preference.endTime.split(':').map(Number);
        const hours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
        
        setEditData({
          position: '', // Quản lý cần điền vị trí
          startTime: preference.startTime,
          endTime: preference.endTime,
          hours: Number(hours.toFixed(1)),
        });
      }
    } else {
      setEditData({ position: '', startTime: '', endTime: '', hours: 0 });
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = shiftTemplates.find(t => t.id === templateId);
      if (template) {
        setEditData({
          ...editData,
          startTime: template.startTime,
          endTime: template.endTime,
          hours: template.hours,
        });
      }
    }
  };

  const handleSaveShift = async () => {
    if (!selectedCell || !editData.position) return;

    // Handle OFF position - no time required
    const isOFF = editData.position === 'OFF';
    const startTime = isOFF ? '00:00' : editData.startTime;
    const endTime = isOFF ? '00:00' : editData.endTime;
    const hours = isOFF ? 0 : editData.hours;

    // Validate time for non-OFF positions
    if (!isOFF && (!startTime || !endTime)) {
      alert('Vui lòng nhập giờ bắt đầu và kết thúc');
      return;
    }

    const newShift: ScheduleShift = {
      employeeId: selectedCell.employeeId,
      date: selectedCell.date,
      position: editData.position,
      startTime,
      endTime,
      hours,
    };

    // Determine shift type based on time
    let shiftType: 'morning' | 'afternoon' | 'evening' = 'morning';
    if (!isOFF) {
      const hour = parseInt(startTime.split(':')[0]);
      if (hour >= 12 && hour < 17) shiftType = 'afternoon';
      else if (hour >= 17) shiftType = 'evening';
    }

    try {
      console.log('Saving shift:', {
        employeeId: selectedCell.employeeId,
        date: selectedCell.date,
        start: startTime,
        end: endTime,
        type: shiftType,
        position: editData.position,
      });

      // Save to database via API
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedCell.employeeId,
          date: selectedCell.date,
          start: startTime,
          end: endTime,
          type: shiftType,
          position: editData.position,
          notes: `Position: ${editData.position}`,
        }),
      });

      if (response.ok) {
        console.log('Shift saved successfully');
        
        // Reload shifts to sync with database
        const startDate = formatDateISO(weekDates[0]);
        const endDate = formatDateISO(weekDates[6]);
        await loadShifts(undefined, startDate, endDate);
        
        // Transform shifts to scheduleShifts format
        const { shifts } = useShiftStore.getState();
        const transformed = shifts
          .filter(s => s.date >= startDate && s.date <= endDate)
          .map(s => ({
            employeeId: s.employeeId,
            date: s.date,
            position: s.notes?.includes('Position:') ? s.notes.split('Position:')[1].trim() : 'N/A',
            startTime: s.start,
            endTime: s.end,
            hours: calculateHoursFromTime(s.start, s.end),
          }));
        setScheduleShifts(transformed);

        // Cập nhật status của shiftPreference thành 'approved'
        const preference = shiftPreferences.find(
          (p) => p.employeeId === selectedCell.employeeId && p.date === selectedCell.date
        );
        if (preference) {
          console.log('Updating preference status to approved:', preference.id);
          await updateShiftPreference(preference.id, { status: 'approved' });
        }
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
        alert(`Lỗi khi lưu lịch vào database: ${errorData.error || errorData.details || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving shift:', error);
      alert('Có lỗi xảy ra khi lưu lịch');
    }

    setSelectedCell(null);
    setEditData({ position: '', startTime: '', endTime: '', hours: 0 });
  };

  // Handle add new position
  const handleAddPosition = async () => {
    if (!newPositionName.trim()) {
      alert('Vui lòng nhập tên vị trí');
      return;
    }
    
    if (allPositions.includes(newPositionName.trim())) {
      alert('Vị trí này đã tồn tại');
      return;
    }
    
    try {
      const response = await fetch('/api/custom-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPositionName.trim(),
          label: newPositionName.trim(),
          color: newPositionColor,
          icon: newPositionIcon,
        }),
      });

      if (response.ok) {
        await loadCustomPositions();
        setNewPositionName('');
        setNewPositionColor('#6366f1');
        setNewPositionIcon('📦');
        setShowAddPositionModal(false);
        alert('✅ Đã thêm vị trí mới thành công!');
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Lỗi khi thêm vị trí'));
      }
    } catch (error) {
      console.error('Error adding position:', error);
      alert('❌ Lỗi khi thêm vị trí');
    }
  };
  
  // Handle add new template
  const handleAddTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.startTime || !newTemplate.endTime) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    // Calculate hours
    const [startHour, startMin] = newTemplate.startTime.split(':').map(Number);
    const [endHour, endMin] = newTemplate.endTime.split(':').map(Number);
    const hours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
    
    if (hours <= 0) {
      alert('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }
    
    try {
      const response = await fetch('/api/shift-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplate.name.trim(),
          startTime: newTemplate.startTime,
          endTime: newTemplate.endTime,
          hours: Number(hours.toFixed(1)),
        }),
      });

      if (response.ok) {
        await loadShiftTemplates();
        setNewTemplate({ name: '', startTime: '', endTime: '', hours: 0 });
        setShowAddTemplateModal(false);
        alert('✅ Đã thêm khung giờ mới thành công!');
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Lỗi khi thêm khung giờ'));
      }
    } catch (error) {
      console.error('Error adding template:', error);
      alert('❌ Lỗi khi thêm khung giờ');
    }
  };

  const handleDeleteShift = async () => {
    if (!selectedCell || selectedCell.mode !== 'edit' || selectedCell.shiftIndex === undefined) return;
    
    try {
      // Get the shift to delete from scheduleShifts
      const shifts = getShiftsForCell(selectedCell.employeeId, selectedCell.date);
      const shiftToDelete = shifts[selectedCell.shiftIndex];
      
      if (!shiftToDelete) {
        alert('Không tìm thấy ca làm cần xóa');
        return;
      }
      
      // Find the actual shift ID from database
      const { shifts: dbShifts } = useShiftStore.getState();
      const dbShift = dbShifts.find(s => 
        s.employeeId === selectedCell.employeeId && 
        s.date === selectedCell.date &&
        s.start === shiftToDelete.startTime &&
        s.end === shiftToDelete.endTime
      );
      
      if (!dbShift) {
        alert('Không tìm thấy ca làm trong database');
        return;
      }
      
      // Delete from API
      const response = await fetch(`/api/shifts?id=${dbShift.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Reload shifts from database
        const startDate = formatDateISO(weekDates[0]);
        const endDate = formatDateISO(weekDates[6]);
        await loadShifts(undefined, startDate, endDate);
        
        // Transform to scheduleShifts format
        const { shifts: updatedShifts } = useShiftStore.getState();
        const transformed = updatedShifts
          .filter(s => s.date >= startDate && s.date <= endDate)
          .map(s => ({
            employeeId: s.employeeId,
            date: s.date,
            position: s.notes?.includes('Position:') ? s.notes.split('Position:')[1].trim() : 'N/A',
            startTime: s.start,
            endTime: s.end,
            hours: calculateHoursFromTime(s.start, s.end),
          }));
        setScheduleShifts(transformed);
        
        setSelectedCell(null);
        setEditData({ position: '', startTime: '', endTime: '', hours: 0 });
      } else {
        alert('Không thể xóa ca làm');
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      alert('Có lỗi xảy ra khi xóa ca làm');
    }
  };

  const isManager = user?.role === 'manager';

  if (!currentWeek || weekDates.length === 0) {
    return (
      <Sidebar>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Lịch làm việc</h1>
          <div className="mt-6 text-center text-gray-500">Đang tải...</div>
        </div>
      </Sidebar>
    );
  }

  const renderEmployeeRow = (employee: any) => (
    <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-2 sm:px-4 py-2 sm:py-3 sticky left-0 z-10 bg-white border-r border-gray-200">
        <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">{employee.name}</div>
      </td>
      {weekDates.slice(0, 7).map((date) => {
        const dateStr = formatDateISO(date);
        const shifts = getShiftsForCell(employee.id, dateStr);
        const preference = getPreferenceForCell(employee.id, dateStr);
        
        return (
          <td
            key={dateStr}
            className="px-1 py-1 sm:px-2 sm:py-2 border-r border-gray-200 relative group"
          >
            <div className="min-h-[50px] sm:min-h-[60px] flex flex-col gap-0.5 sm:gap-1 items-center justify-center">
              {shifts.length > 0 ? (
                // Hiển thị tất cả các ca đã xếp
                <>
                  {shifts.map((shift, idx) => {
                    const config = getPositionConfig(shift.position);
                    const style = getPositionStyle(shift.position);
                    const icon = getPositionIcon(shift.position);
                    
                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(employee.id, dateStr, 'edit', idx);
                        }}
                        className={`text-[10px] sm:text-xs w-full p-0.5 sm:p-1 rounded border cursor-pointer hover:opacity-80 ${
                          config.bgColor || ''
                        } ${config.borderColor || ''}`}
                        style={style.backgroundColor ? {
                          backgroundColor: style.backgroundColor,
                          borderColor: style.borderColor,
                          color: style.color,
                        } : {}}
                      >
                        {shift.position === 'OFF' ? (
                          <>
                            <div className="font-semibold text-center flex items-center justify-center gap-1">
                              <span>OFF</span>
                              <span>{icon}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`font-semibold flex items-center justify-between gap-1 ${config.textColor || ''}`}>
                              <span>{shift.position}</span>
                              <span>{icon}</span>
                            </div>
                            <div className={config.textColor || 'text-green-700'}>{shift.startTime}-{shift.endTime}</div>
                            <div className={`font-medium ${config.textColor || 'text-green-600'}`}>{shift.hours.toFixed(1)}h</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {isManager && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(employee.id, dateStr, 'add');
                      }}
                      className="w-full py-0.5 text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded border border-dashed border-indigo-300 font-semibold"
                      title="Thêm ca mới"
                    >
                      +
                    </button>
                  )}
                </>
              ) : preference && preference.status === 'pending' ? (
                // Đang chờ duyệt
                <div
                  onClick={() => {
                    // Nếu là nhân viên và đang xem lịch của chính họ, chuyển sang trang đăng ký để sửa
                    if (!isManager && user?.employeeId === employee.id) {
                      // Store preference info in sessionStorage để trang đăng ký có thể load
                      sessionStorage.setItem('editPreference', JSON.stringify(preference));
                      router.push('/employee-schedule');
                    } else if (isManager) {
                      // Manager có thể click để xếp lịch
                      handleCellClick(employee.id, dateStr, 'add');
                    }
                  }}
                  className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded border w-full ${
                    preference.isOff
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-blue-50 border-blue-200'
                  } ${(!isManager && user?.employeeId === employee.id) || isManager ? 'cursor-pointer hover:bg-opacity-70' : ''}`}
                  title={!isManager && user?.employeeId === employee.id ? 'Click để sửa đăng ký' : isManager ? 'Click để xếp lịch' : ''}
                >
                  <div className={`flex items-center gap-0.5 font-semibold ${
                    preference.isOff ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    <User size={10} />
                    <span>{preference.isOff ? 'OFF' : 'ĐK'}</span>
                  </div>
                  {!preference.isOff && preference.startTime && preference.endTime && (
                    <div className="text-blue-700">{preference.startTime}-{preference.endTime}</div>
                  )}
                </div>
              ) : preference && preference.status === 'approved' ? (
                // Đã duyệt nhưng chưa có shift data
                <div className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded border w-full ${
                  preference.isOff
                    ? 'bg-yellow-100 border-yellow-400'
                    : 'bg-green-50 border-green-300'
                }`}>
                  <div className={`font-semibold ${
                    preference.isOff ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {preference.isOff ? 'OFF ✓' : '✓'}
                  </div>
                  {!preference.isOff && preference.startTime && preference.endTime && (
                    <div className="text-green-700">{preference.startTime}-{preference.endTime}</div>
                  )}
                </div>
              ) : preference && preference.status === 'rejected' ? (
                // Đã từ chối
                <div className="text-[10px] sm:text-xs bg-red-50 p-0.5 sm:p-1 rounded border border-red-200 w-full">
                  <div className="font-semibold text-red-800">✗</div>
                </div>
              ) : (
                <div
                  onClick={() => isManager && handleCellClick(employee.id, dateStr, 'add')}
                  className={`text-gray-400 text-center w-full text-xs ${isManager ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                >
                  {isManager ? '+' : '-'}
                </div>
              )}
            </div>
          </td>
        );
      })}
      <td className="px-1 sm:px-3 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm text-gray-900 bg-gray-50">
        {calculateWeeklyHours(employee.id).toFixed(1)}
      </td>
    </tr>
  );

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem lịch làm việc</p>
          <a 
            href="/login" 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-full mx-auto">
        {/* Header - Responsive */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Lịch làm việc tuần</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {/* Toggle đăng ký lịch cho quản lý */}
            {isManager && (
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg text-sm">
                <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">Đăng ký đặc biệt:</span>
                <button
                  onClick={() => setRegistrationEnabled(!isRegistrationEnabled)}
                  className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
                    isRegistrationEnabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                      isRegistrationEnabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-xs font-semibold ${
                  isRegistrationEnabled ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {isRegistrationEnabled ? '🔓' : '🔒'}
                </span>
              </div>
            )}
            {/* Week navigation */}
            <div className="flex items-center gap-2 sm:gap-3 text-gray-900 bg-white px-3 py-2 rounded-xl border-2 border-indigo-200 shadow-sm">
              <button
                onClick={handlePreviousWeek}
                className="p-1.5 sm:p-2 border-2 border-indigo-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
              >
                <ChevronLeft size={18} className="text-indigo-600" />
              </button>
              <span className="text-sm sm:text-base lg:text-lg font-semibold px-2 sm:px-4 min-w-[140px] sm:min-w-[180px] text-center text-indigo-900">
                {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
              </span>
              <button
                onClick={handleNextWeek}
                className="p-1.5 sm:p-2 border-2 border-indigo-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
              >
                <ChevronRight size={18} className="text-indigo-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Thông báo trạng thái đăng ký */}
        {isManager && isRegistrationEnabled && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>🔓 Chế độ đăng ký đặc biệt đang BẬT:</strong> NV có thể đăng ký lịch bất kể thời gian.
            </p>
          </div>
        )}

        {/* Schedule Table - Horizontal scroll */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto mobile-scroll">
            <table className="border-collapse min-w-[900px] w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col className="w-[120px] sm:w-[150px] lg:w-[192px]" />
              <col className="w-[90px] sm:w-[110px] lg:w-[128px]" />
              <col className="w-[90px] sm:w-[110px] lg:w-[128px]" />
              <col className="w-[90px] sm:w-[110px] lg:w-[128px]" />
              <col className="w-[90px] sm:w-[110px] lg:w-[128px]" />
              <col className="w-[90px] sm:w-[110px] lg:w-[128px]" />
              <col className="w-[90px] sm:w-[110px] lg:w-[128px]" />
              <col className="w-[90px] sm:w-[110px] lg:w-[128px]" />
              <col className="w-[60px] sm:w-[80px] lg:w-[96px]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-gray-900 border border-gray-300 sticky left-0 z-10 bg-gray-100">
                  Họ Tên
                </th>
                {weekDates.slice(0, 7).map((date, idx) => {
                  const dateStr = formatDateISO(date);
                  const holiday = getHolidayForDate(dateStr);
                  const lunarText = getLunarDateText(dateStr);
                  const isPublicHoliday = holiday?.type === 'public';
                  const isTraditionalHoliday = holiday?.type === 'traditional';
                  
                  return (
                    <th 
                      key={idx} 
                      className={`px-1 sm:px-4 py-2 sm:py-3 text-center border border-gray-300 ${
                        isPublicHoliday ? 'bg-red-200' : 
                        isTraditionalHoliday ? 'bg-orange-100' : 
                        'bg-blue-200'
                      }`}
                      title={holiday ? `${holiday.name}${holiday.description ? ': ' + holiday.description : ''}` : ''}
                    >
                      <div className="font-bold text-gray-900 text-xs sm:text-sm">{DAYS[idx]}</div>
                      <div className="text-[10px] sm:text-xs font-normal text-gray-900">
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">{lunarText}</div>
                      {holiday && (
                        <div className={`text-[9px] sm:text-[10px] font-semibold mt-0.5 flex items-center justify-center gap-0.5 ${
                          isPublicHoliday ? 'text-red-700' : 'text-orange-700'
                        }`}>
                          {isPublicHoliday && <Star size={8} className="fill-red-500 text-red-500" />}
                          <span className="truncate max-w-[60px] sm:max-w-[100px]">{holiday.name}</span>
                        </div>
                      )}
                    </th>
                  );
                })}
                <th className="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-gray-900 border border-gray-300 bg-yellow-200">
                  Tổng
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Chi phí nhân công % row */}
              {isManager && (
                <tr className="bg-yellow-50">
                  <td className="px-2 sm:px-4 py-2 font-bold text-xs sm:text-sm text-gray-900 border border-gray-300 sticky left-0 z-10 bg-yellow-50">
                    CP nhân công
                  </td>
                  {weekDates.slice(0, 7).map((date, idx) => {
                    const dateStr = formatDateISO(date);
                    const percentage = calculateLaborCostPercent(dateStr);
                    const isHighCost = percentage > 15;
                    const isGoodCost = percentage >= 8 && percentage <= 12;
                    
                    return (
                      <td 
                        key={dateStr} 
                        className={`px-1 sm:px-2 py-1 sm:py-2 text-center border border-gray-300 cursor-pointer hover:bg-yellow-100 ${
                          isHighCost ? 'bg-red-50' : isGoodCost ? 'bg-green-50' : 'bg-yellow-50'
                        }`}
                        onClick={() => handleEditRevenue(dateStr)}
                        title="Click để chỉnh sửa doanh thu ước chừng"
                      >
                        <div className={`text-base sm:text-2xl font-bold ${
                          isHighCost ? 'text-red-600' : isGoodCost ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {percentage.toFixed(1)}%
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
                          {((revenueEstimates[dateStr] || defaultRevenue) / 1000000).toFixed(1)}M
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-1 sm:px-2 py-1 sm:py-2 text-center border border-gray-300 bg-yellow-100">
                    <div className="text-xs sm:text-sm font-semibold text-gray-700">-</div>
                  </td>
                </tr>
              )}
              
              {/* FT Section */}
              <tr className="bg-gray-200">
                <td colSpan={8} className="px-2 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm text-gray-900 border border-gray-300">
                  FT (Full Time)
                </td>
              </tr>
              {ftEmployees.map((employee) => renderEmployeeRow(employee))}
              <tr className="bg-green-100">
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm text-gray-900 border border-gray-300 sticky left-0 z-10 bg-green-100">Tổng FT</td>
                {weekDates.slice(0, 7).map((date) => {
                  const dateStr = formatDateISO(date);
                  const total = ftEmployees.reduce((sum, emp) => {
                    const shift = getShiftForCell(emp.id, dateStr);
                    return sum + (shift?.hours || 0);
                  }, 0);
                  return (
                    <td key={dateStr} className="px-1 sm:px-3 py-1.5 sm:py-2 text-center font-bold text-xs sm:text-sm text-gray-900 border border-gray-300">
                      {total.toFixed(1)}
                    </td>
                  );
                })}
                <td className="px-1 sm:px-3 py-1.5 sm:py-2 text-center font-bold text-xs sm:text-sm text-gray-900 border border-gray-300 bg-yellow-100">
                  {ftEmployees.reduce((sum, emp) => sum + calculateWeeklyHours(emp.id), 0).toFixed(1)}
                </td>
              </tr>

              {/* CL Section */}
              <tr className="bg-gray-200">
                <td colSpan={8} className="px-2 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm text-gray-900 border border-gray-300">
                  CL (Casual Labour)
                </td>
              </tr>
              {clEmployees.map((employee) => renderEmployeeRow(employee))}
              <tr className="bg-green-100">
                <td className="px-2 sm:px-4 py-1.5 sm:py-2 font-bold text-xs sm:text-sm text-gray-900 border border-gray-300 sticky left-0 z-10 bg-green-100">Tổng CL</td>
                {weekDates.slice(0, 7).map((date) => {
                  const dateStr = formatDateISO(date);
                  const total = clEmployees.reduce((sum, emp) => {
                    const shift = getShiftForCell(emp.id, dateStr);
                    return sum + (shift?.hours || 0);
                  }, 0);
                  return (
                    <td key={dateStr} className="px-1 sm:px-3 py-1.5 sm:py-2 text-center font-bold text-xs sm:text-sm text-gray-900 border border-gray-300">
                      {total.toFixed(1)}
                    </td>
                  );
                })}
                <td className="px-1 sm:px-3 py-1.5 sm:py-2 text-center font-bold text-xs sm:text-sm text-gray-900 border border-gray-300 bg-yellow-100">
                  {clEmployees.reduce((sum, emp) => sum + calculateWeeklyHours(emp.id), 0).toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>

        {!isManager && (
          <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>Lưu ý:</strong> Chỉ quản lý mới có thể chỉnh sửa lịch làm việc.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal - Mobile friendly */}
      {selectedCell && isManager && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCell.mode === 'add' ? '➕ Thêm ca' : '✏️ Sửa ca'}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {employees.find((e) => e.id === selectedCell.employeeId)?.name} - {selectedCell.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Hiển thị thông tin preference nếu có */}
              {(() => {
                const preference = getPreferenceForCell(selectedCell.employeeId, selectedCell.date);
                if (preference && preference.status === 'pending') {
                  return (
                    <div className={`mb-4 p-3 border rounded-lg ${
                      preference.isOff 
                        ? 'bg-yellow-50 border-yellow-300' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className={preference.isOff ? 'text-yellow-600' : 'text-blue-600'} />
                        <span className={`font-semibold ${preference.isOff ? 'text-yellow-800' : 'text-blue-800'}`}>
                          {preference.isOff ? '🏖️ NV đăng ký nghỉ phép' : '📝 NV đã đăng ký:'}
                        </span>
                      </div>
                      {!preference.isOff && preference.startTime && preference.endTime && (
                        <div className="text-sm text-blue-700 mt-1">
                          ⏰ {preference.startTime} - {preference.endTime}
                        </div>
                      )}
                      {preference.notes && (
                        <div className={`text-sm mt-2 p-2 rounded ${
                          preference.isOff 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <span className="font-semibold">💬 Ghi chú:</span> {preference.notes}
                        </div>
                      )}
                    </div>
                  );
                }
              })()}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-900">Vị trí</label>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowAddPositionModal(true);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      + Thêm
                    </button>
                  </div>
                  <select
                    value={editData.position}
                    onChange={(e) => {
                      const pos = e.target.value;
                      if (pos === 'OFF') {
                        setEditData({ position: pos, startTime: '00:00', endTime: '00:00', hours: 0 });
                      } else {
                        setEditData({ ...editData, position: pos });
                      }
                    }}
                    className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="">-- Chọn vị trí --</option>
                    {allPositions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                
                {editData.position !== 'OFF' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-900">Khung giờ</label>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowAddTemplateModal(true);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          + Thêm
                        </button>
                      </div>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-gray-900"
                      >
                        <option value="">-- Chọn có sẵn --</option>
                        {shiftTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.hours}h)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1.5">Giờ bắt đầu</label>
                        <input
                          type="time"
                          value={editData.startTime}
                          onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                          className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1.5">Giờ kết thúc</label>
                        <input
                          type="time"
                          value={editData.endTime}
                          onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                          className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                      </div>
                    </div>
                    
                    {/* Calculated Hours Display */}
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                      <span className="text-sm font-medium text-indigo-700">Giờ công:</span>
                      <span className="text-lg font-bold text-indigo-600">{editData.hours.toFixed(1)}h</span>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
                {selectedCell.mode === 'edit' && selectedCell.shiftIndex !== undefined && (
                  <button
                    onClick={handleDeleteShift}
                    className="w-full sm:w-auto px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                  >
                    🗑️ Xóa
                  </button>
                )}
                <div className="flex gap-2 flex-1 sm:flex-none sm:ml-auto">
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveShift}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    {selectedCell.mode === 'add' ? 'Thêm' : 'Lưu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Estimate Modal - Mobile friendly */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 sm:p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Doanh thu ước chừng</h3>
              <p className="text-sm text-gray-600">
                Ngày: {new Date(editingDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Doanh thu (VND)
                </label>
                <input
                  type="number"
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(e.target.value)}
                  placeholder="VD: 10000000"
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  = {(parseFloat(revenueInput) / 1000000).toFixed(1)} triệu VND
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="font-semibold text-blue-900 mb-2">Công thức:</div>
                <div className="text-blue-800 text-xs space-y-1">
                  <div>• FT: <strong>30k/giờ</strong> | CL: <strong>24k/giờ</strong></div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSaveRevenue}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Lưu cho ngày này
              </button>
              <button
                onClick={applyRevenueToWeek}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Áp dụng cả tuần
              </button>
              <button
                onClick={() => {
                  setShowRevenueModal(false);
                  setEditingDate('');
                  setRevenueInput('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">➕ Thêm vị trí mới</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tạo vị trí làm việc mới cho nhân viên
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tên vị trí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="VD: Trainer, Security, Cleaning, ..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPosition();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Vị trí này sẽ xuất hiện trong dropdown khi xếp lịch
                </p>
              </div>
              
              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Màu sắc <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewPositionColor(color.value)}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        newPositionColor === color.value
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={newPositionColor}
                    onChange={(e) => setNewPositionColor(e.target.value)}
                    className="h-8 w-16 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600">Hoặc chọn màu tùy chỉnh</span>
                </div>
              </div>
              
              {/* Emoji Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Icon <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {EMOJI_PICKER.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewPositionIcon(emoji)}
                      className={`text-2xl h-10 w-10 rounded hover:bg-gray-100 transition-all ${
                        newPositionIcon === emoji
                          ? 'bg-indigo-100 ring-2 ring-indigo-500'
                          : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={newPositionIcon}
                    onChange={(e) => setNewPositionIcon(e.target.value.slice(0, 2))}
                    placeholder="Hoặc nhập emoji từ bàn phím"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    maxLength={2}
                  />
                </div>
              </div>
              
              {/* Preview */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-indigo-200">
                <div className="text-xs font-medium text-gray-600 mb-2">Xem trước:</div>
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold text-sm"
                  style={{
                    backgroundColor: `${newPositionColor}20`,
                    borderColor: `${newPositionColor}80`,
                    color: newPositionColor
                  }}
                >
                  <span>{newPositionName || 'Tên vị trí'}</span>
                  <span className="text-xl">{newPositionIcon}</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="font-semibold text-blue-900 mb-1">Các vị trí hiện có:</div>
                <div className="text-blue-800 flex flex-wrap gap-1">
                  {allPositions.filter(p => p !== 'OFF').map(pos => (
                    <span key={pos} className="bg-white px-2 py-0.5 rounded text-xs">
                      {pos}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleAddPosition}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
              >
                ✅ Thêm vị trí
              </button>
              <button
                onClick={() => {
                  setShowAddPositionModal(false);
                  setNewPositionName('');
                  setNewPositionColor('#6366f1');
                  setNewPositionIcon('📦');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Template Modal */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">➕ Thêm khung giờ làm việc</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tạo khung giờ cố định để dễ chọn khi xếp lịch
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tên khung giờ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="VD: Ca đặc biệt (9h - 18h)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Giờ bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newTemplate.startTime}
                    onChange={(e) => setNewTemplate({ ...newTemplate, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Giờ kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={newTemplate.endTime}
                    onChange={(e) => setNewTemplate({ ...newTemplate, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
              </div>
              
              {newTemplate.startTime && newTemplate.endTime && (
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  <div className="font-semibold text-green-900">
                    ⏰ Tổng giờ: {(() => {
                      const [startHour, startMin] = newTemplate.startTime.split(':').map(Number);
                      const [endHour, endMin] = newTemplate.endTime.split(':').map(Number);
                      const hours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
                      return hours > 0 ? `${hours.toFixed(1)} giờ` : 'Không hợp lệ';
                    })()}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <div className="font-semibold text-blue-900 mb-1">💡 Mẹo:</div>
                <div className="text-blue-800 text-xs">
                  Sau khi tạo, khung giờ này sẽ xuất hiện trong dropdown "Khung giờ làm việc" khi xếp lịch, giúp bạn không phải nhập thủ công mỗi lần.
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleAddTemplate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
              >
                ✅ Thêm khung giờ
              </button>
              <button
                onClick={() => {
                  setShowAddTemplateModal(false);
                  setNewTemplate({ name: '', startTime: '', endTime: '', hours: 0 });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
