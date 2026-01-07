'use client';

import { useState, useMemo, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { ChevronLeft, ChevronRight, X, Plus, Trash2 } from 'lucide-react';
import { formatDateISO, getWeekDates, formatDate } from '@/lib/utils';

interface TimeLog {
  id: string;
  employeeId: string;
  date: string;
  actualStart: string;
  actualEnd: string;
  position: string;
  positionNote?: string;
  notes?: string;
  totalHours: number;
  employee?: {
    name: string;
    code: string;
  };
}

interface Employee {
  id: string;
  name: string;
  employeeRole: string;
  role: string; // 'manager' or 'staff'
}

// Shift Templates - Các khung giờ làm việc có sẵn (sync với schedule page)
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

const DEFAULT_POSITIONS = ['Cashier', 'Waiter', 'Setup'];

const getPositionLabel = (position: string): string => {
  const labels: Record<string, string> = {
    Cashier: 'Cashier',
    Waiter: 'Waiter',
    Setup: 'Setup',
  };
  return labels[position] || position;
};

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function TimeLogsPage() {
  const { user, isHydrated } = useAuth();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  // Shift templates và positions (sync từ localStorage với trang schedule)
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(DEFAULT_SHIFT_TEMPLATES);
  const [allPositions, setAllPositions] = useState<string[]>(DEFAULT_POSITIONS);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Modal state
  const [selectedCell, setSelectedCell] = useState<{ 
    employeeId: string; 
    date: string; 
    mode: 'add' | 'edit'; 
    logIndex?: number 
  } | null>(null);
  
  const [formData, setFormData] = useState({
    actualStart: '--:--',
    actualEnd: '--:--',
    position: 'Cashier',
    positionNote: '',
    notes: '',
  });

  // Calculate week dates
  const weekDates = useMemo(() => {
    return getWeekDates(currentWeek);
  }, [currentWeek]);

  // Load custom positions and templates from database (sync with schedule page)
  useEffect(() => {
    const loadCustomData = async () => {
      try {
        // Load custom positions
        const positionsResponse = await fetch('/api/custom-positions');
        if (positionsResponse.ok) {
          const customPositions = await positionsResponse.json();
          const customPositionNames = customPositions.map((p: any) => p.name);
          setAllPositions([...DEFAULT_POSITIONS, ...customPositionNames]);
        }
        
        // Load shift templates
        const templatesResponse = await fetch('/api/shift-templates');
        if (templatesResponse.ok) {
          const customTemplates = await templatesResponse.json();
          setShiftTemplates([...DEFAULT_SHIFT_TEMPLATES, ...customTemplates]);
        }
      } catch (error) {
        console.error('Error loading custom data:', error);
      }
    };
    
    loadCustomData();
  }, []);

  // Load employees (exclude managers)
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (response.ok) {
          const data = await response.json();
          // Filter out managers from time logs - check 'role' field not 'employeeRole'
          const nonManagers = data.filter((emp: Employee) => 
            emp.role?.toLowerCase() !== 'manager'
          );
          setEmployees(nonManagers);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    loadEmployees();
  }, []);

  // Load time logs for current week
  useEffect(() => {
    const loadTimeLogs = async () => {
      if (weekDates.length === 0) return;
      
      setLoading(true);
      try {
        const startDate = formatDateISO(weekDates[0]);
        const endDate = formatDateISO(weekDates[6]);

        const response = await fetch(
          `/api/time-logs?startDate=${startDate}&endDate=${endDate}`
        );

        if (response.ok) {
          const data = await response.json();
          setTimeLogs(data);
        }
      } catch (error) {
        console.error('Error loading time logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTimeLogs();
  }, [weekDates]);

  // Load time logs for selected month (for stats)
  useEffect(() => {
    const loadMonthlyTimeLogs = async () => {
      try {
        const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const lastDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

        const startDate = formatDateISO(firstDay);
        const endDate = formatDateISO(lastDay);

        const response = await fetch(
          `/api/time-logs?startDate=${startDate}&endDate=${endDate}`
        );

        if (response.ok) {
          const data = await response.json();
          // Use this data for monthly stats only, keep weekDates logs for table
        }
      } catch (error) {
        console.error('Error loading monthly time logs:', error);
      }
    };
    
    loadMonthlyTimeLogs();
  }, [selectedMonth]);

  // Get time logs for a specific cell
  const getLogsForCell = (employeeId: string, date: string): TimeLog[] => {
    return timeLogs.filter(log => log.employeeId === employeeId && log.date === date);
  };

  // Calculate weekly hours for an employee
  const calculateWeeklyHours = (employeeId: string) => {
    return timeLogs
      .filter(log => log.employeeId === employeeId)
      .reduce((sum, log) => sum + log.totalHours, 0);
  };

  // Calculate monthly statistics per employee
  const monthlyStats = useMemo(() => {
    const stats: Record<string, { totalHours: number; positions: Record<string, number> }> = {};
    
    timeLogs.forEach(log => {
      if (!stats[log.employeeId]) {
        stats[log.employeeId] = { totalHours: 0, positions: {} };
      }
      stats[log.employeeId].totalHours += log.totalHours;
      stats[log.employeeId].positions[log.position] = 
        (stats[log.employeeId].positions[log.position] || 0) + 1;
    });
    
    return stats;
  }, [timeLogs]);

  // Handle cell click - open modal
  const handleCellClick = (employeeId: string, date: string) => {
    const logs = getLogsForCell(employeeId, date);
    
    if (logs.length > 0) {
      // Edit first log
      setSelectedCell({ employeeId, date, mode: 'edit', logIndex: 0 });
      const log = logs[0];
      setFormData({
        actualStart: log.actualStart,
        actualEnd: log.actualEnd,
        position: log.position,
        positionNote: log.positionNote || '',
        notes: log.notes || '',
      });
      setSelectedTemplate('');
    } else {
      // Add new log
      setSelectedCell({ employeeId, date, mode: 'add' });
      setFormData({
        actualStart: '',
        actualEnd: '',
        position: 'Cashier',
        positionNote: '',
        notes: '',
      });
      setSelectedTemplate('');
    }
  };

  // Handle add another log to same cell
  const handleAddAnotherLog = (employeeId: string, date: string) => {
    setSelectedCell({ employeeId, date, mode: 'add' });
    setFormData({
      actualStart: '',
      actualEnd: '',
      position: 'Cashier',
      positionNote: '',
      notes: '',
    });
    setSelectedTemplate('');
  };

  // Handle template selection - auto fill start/end time
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = shiftTemplates.find(t => t.id === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev,
          actualStart: template.startTime,
          actualEnd: template.endTime,
        }));
      }
    }
  };

  // Calculate hours from time
  const calculateHours = (start: string, end: string): number => {
    if (!start || !end || start === '--:--' || end === '--:--') return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
  };

  // Handle save time log
  const handleSaveLog = async () => {
    if (!selectedCell) return;

    try {
      const logs = getLogsForCell(selectedCell.employeeId, selectedCell.date);
      
      if (selectedCell.mode === 'edit' && logs[selectedCell.logIndex || 0]) {
        // Update existing log
        const log = logs[selectedCell.logIndex || 0];
        const response = await fetch('/api/time-logs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: log.id,
            ...formData,
          }),
        });

        if (response.ok) {
          const updated = await response.json();
          setTimeLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
        }
      } else {
        // Create new log
        const response = await fetch('/api/time-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: selectedCell.employeeId,
            date: selectedCell.date,
            ...formData,
          }),
        });

        if (response.ok) {
          const created = await response.json();
          setTimeLogs(prev => [...prev, created]);
        }
      }

      setSelectedCell(null);
    } catch (error) {
      console.error('Error saving time log:', error);
      alert('Lỗi khi lưu ghi chú công');
    }
  };

  // Handle delete time log
  const handleDeleteLog = async (logId: string) => {
    try {
      const response = await fetch(`/api/time-logs?id=${logId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTimeLogs(prev => prev.filter(l => l.id !== logId));
        setSelectedCell(null);
      }
    } catch (error) {
      console.error('Error deleting time log:', error);
      alert('Lỗi khi xóa ghi chú công');
    }
  };

  // Navigation
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

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
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem ghi chú công</p>
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

  const monthName = selectedMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const weekTitle = `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`;

  return (
    <Sidebar>
      <div className="max-w-full">
        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Ghi chú công</h1>
          <p className="text-sm text-gray-600 hidden sm:block">
            {user.role === 'manager' 
              ? 'Xem và chỉnh sửa ghi chú công của tất cả nhân viên'
              : 'Ghi nhận giờ làm việc của bản thân và đồng nghiệp'}
          </p>
        </div>

        {/* Month Selector for Stats - Responsive */}
        <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900">Thống kê tháng</h2>
            <div className="flex items-center gap-2 text-gray-900">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm sm:text-lg font-medium min-w-[140px] sm:min-w-[200px] text-center text-gray-900">
                {monthName}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Statistics by Employee - Scrollable on mobile */}
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto mobile-scroll">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tổng giờ
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Chi tiết vị trí
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map(employee => {
                  const stats = monthlyStats[employee.id] || { totalHours: 0, positions: {} };
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-center font-semibold text-indigo-600">
                        {stats.totalHours.toFixed(1)}h
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-600">
                        {Object.entries(stats.positions).length > 0 ? (
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {Object.entries(stats.positions).map(([pos, count]) => (
                              <span key={pos} className="inline-flex items-center px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                {pos}: {count}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Week Navigation - Responsive */}
        <div className="mb-4 bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between text-gray-900">
            <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2">
              <button
                onClick={goToPreviousWeek}
                className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Tuần trước</span>
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors text-xs sm:text-sm font-medium"
              >
                Tuần này
              </button>
              <button
                onClick={goToNextWeek}
                className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Tuần sau</span>
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="text-sm sm:text-lg font-semibold text-gray-900 text-center">
              {weekTitle}
            </div>
          </div>
        </div>

        {/* Time Logs Table - Horizontal scroll on mobile */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          ) : (
            <div className="overflow-x-auto mobile-scroll">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 min-w-[100px] sm:min-w-[150px]">
                      Nhân viên
                    </th>
                    {weekDates.map((date, index) => (
                      <th
                        key={date.toISOString()}
                        className="px-1 sm:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-l border-gray-200 min-w-[100px] sm:min-w-[140px]"
                      >
                        <div>{DAYS[index]}</div>
                        <div className="text-[10px] sm:text-xs font-normal text-gray-500 mt-0.5">
                          {formatDate(date)}
                        </div>
                      </th>
                    ))}
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-l border-gray-200 min-w-[60px] sm:min-w-[100px]">
                      Tổng
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200">
                        <span className="line-clamp-2">{employee.name}</span>
                      </td>
                      {weekDates.map((date) => {
                        const dateStr = formatDateISO(date);
                        const logs = getLogsForCell(employee.id, dateStr);
                        
                        return (
                          <td
                            key={dateStr}
                            className="border-l border-gray-200 p-1 align-top"
                          >
                            <div className="min-h-[50px] sm:min-h-[60px] space-y-1">
                              {logs.map((log, idx) => (
                                <div
                                  key={log.id}
                                  onClick={() => {
                                    setSelectedCell({ 
                                      employeeId: employee.id, 
                                      date: dateStr, 
                                      mode: 'edit', 
                                      logIndex: idx 
                                    });
                                    setFormData({
                                      actualStart: log.actualStart,
                                      actualEnd: log.actualEnd,
                                      position: log.position,
                                      positionNote: log.positionNote || '',
                                      notes: log.notes || '',
                                    });
                                  }}
                                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded p-1 sm:p-1.5 cursor-pointer transition-colors"
                                >
                                  <div className="text-[10px] sm:text-xs font-semibold text-blue-900">
                                    {log.actualStart}-{log.actualEnd}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-blue-700">
                                    {log.position} ({log.totalHours.toFixed(1)}h)
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => handleAddAnotherLog(employee.id, dateStr)}
                                className="w-full py-1 sm:py-1.5 text-[10px] sm:text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-gray-300 hover:border-indigo-300 rounded transition-colors flex items-center justify-center gap-0.5"
                              >
                                <Plus size={12} />
                                <span className="hidden sm:inline">{logs.length > 0 ? 'Thêm' : 'Ghi'}</span>
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      <td className="border-l border-gray-200 px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-indigo-600">
                        {calculateWeeklyHours(employee.id).toFixed(1)}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add/Edit Time Log - Mobile friendly */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {selectedCell.mode === 'edit' ? 'Sửa ghi công' : 'Thêm ghi công'}
              </h2>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Nhân viên:</strong>{' '}
                  {employees.find(e => e.id === selectedCell.employeeId)?.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Ngày:</strong> {formatDate(new Date(selectedCell.date))}
                </div>
              </div>

              <div className="space-y-4">
                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vị trí
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {allPositions.map(pos => (
                      <option key={pos} value={pos}>
                        {getPositionLabel(pos)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shift Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khung giờ có sẵn
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn hoặc nhập thủ công --</option>
                    {shiftTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ vào
                    </label>
                    <input
                      type="time"
                      value={formData.actualStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, actualStart: e.target.value }))}
                      className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giờ ra
                    </label>
                    <input
                      type="time"
                      value={formData.actualEnd}
                      onChange={(e) => setFormData(prev => ({ ...prev, actualEnd: e.target.value }))}
                      className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Calculated Hours */}
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm font-medium text-indigo-700">Giờ công:</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {calculateHours(formData.actualStart, formData.actualEnd).toFixed(1)}h
                  </span>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ghi chú thêm..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
                <div>
                  {selectedCell.mode === 'edit' && (
                    <button
                      onClick={() => {
                        const logs = getLogsForCell(selectedCell.employeeId, selectedCell.date);
                        const log = logs[selectedCell.logIndex || 0];
                        if (log) {
                          handleDeleteLog(log.id);
                        }
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                      Xóa
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveLog}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    {selectedCell.mode === 'edit' ? 'Cập nhật' : 'Lưu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
