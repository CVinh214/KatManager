'use client';

import { useMemo, useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import { useRequireRole } from '@/hooks/use-auth';
import { useEmployeeStore } from '@/store/employee-store';
import { useTimeLogStore } from '@/store/timelog-store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import Papa from 'papaparse';
import { Position } from '@/types';
import { formatDateISO, parseDateOnly } from '@/lib/utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsPage() {
  const { user, isHydrated, hasAccess } = useRequireRole(['manager']);
  const employees = useEmployeeStore((state) => state.employees);
  const timeLogs = useTimeLogStore((state) => state.timeLogs);
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all'>('week');
  const [positionFilter, setPositionFilter] = useState<Position | 'all'>('all');

  const filteredLogs = useMemo(() => {
    let logs = [...timeLogs];
    const today = new Date();

    if (dateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      logs = logs.filter((log) => parseDateOnly(log.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      logs = logs.filter((log) => parseDateOnly(log.date) >= monthAgo);
    }

    if (positionFilter !== 'all') {
      logs = logs.filter((log) => log.position === positionFilter);
    }

    return logs;
  }, [timeLogs, dateFilter, positionFilter]);

  const employeeStats = useMemo(() => {
    const stats = new Map<string, { name: string; hours: number; shifts: number }>();

    filteredLogs.forEach((log) => {
      const existing = stats.get(log.employeeId) || {
        name: log.employeeName || 'N/A',
        hours: 0,
        shifts: 0,
      };
      existing.hours += log.totalHours || 0;
      existing.shifts += 1;
      stats.set(log.employeeId, existing);
    });

    return Array.from(stats.values()).sort((a, b) => b.hours - a.hours);
  }, [filteredLogs]);

  const positionStats = useMemo(() => {
    const stats = new Map<Position, number>();

    filteredLogs.forEach((log) => {
      const current = stats.get(log.position) || 0;
      stats.set(log.position, current + (log.totalHours || 0));
    });

    return Array.from(stats.entries()).map(([position, hours]) => ({
      position,
      hours: parseFloat(hours.toFixed(1)),
    }));
  }, [filteredLogs]);

  const totalHours = useMemo(() => {
    return filteredLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  }, [filteredLogs]);

  const averageHours = useMemo(() => {
    if (employeeStats.length === 0) return 0;
    return totalHours / employeeStats.length;
  }, [totalHours, employeeStats]);

  const handleExportCSV = () => {
    const data = filteredLogs.map((log) => ({
      'Nhân viên': log.employeeName,
      'Ngày': log.date,
      'Giờ vào': log.actualStart,
      'Giờ ra': log.actualEnd,
      'Vị trí': log.position,
      'Tổng giờ': log.totalHours?.toFixed(1),
      'Ghi chú': log.notes || '',
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-gio-cong-${formatDateISO(new Date())}.csv`;
    link.click();
  };

  // Loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Auth check
  if (!user || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập với quyền quản lý</p>
          <a href="/login" className="text-blue-600 hover:underline">Đăng nhập</a>
        </div>
      </div>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Báo cáo</h1>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium w-full sm:w-auto"
          >
            <Download size={18} />
            Xuất CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-600 hidden sm:block" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'week' | 'month' | 'all')}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
            >
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value as Position | 'all')}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
          >
            <option value="all">Tất cả vị trí</option>
            <option value="Cashier">Cashier</option>
            <option value="Barista">Barista</option>
            <option value="Kitchen Staff">Kitchen Staff</option>
            <option value="Server">Server</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
              <div className="hidden sm:block p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Tổng giờ</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
              <div className="hidden sm:block p-2 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">TB giờ/NV</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{averageHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
              <div className="hidden sm:block p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Số ca</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Giờ công theo nhân viên</h2>
            <div className="overflow-x-auto mobile-scroll -mx-2 px-2">
              <div className="min-w-[400px]">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={employeeStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="hours" fill="#6366f1" name="Giờ làm" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">Phân bổ theo vị trí</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={positionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload }) => `${payload.position}: ${payload.hours}h`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {positionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-base sm:text-xl font-semibold text-gray-900">Chi tiết giờ công</h2>
          </div>
          <div className="overflow-x-auto mobile-scroll">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nhân viên
                  </th>
                  <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tổng giờ
                  </th>
                  <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số ca
                  </th>
                  <th className="px-3 sm:px-6 py-2.5 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    TB giờ/ca
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employeeStats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-sm">{stat.name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="font-semibold text-indigo-600 text-sm">
                        {stat.hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm">{stat.shifts}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm">
                      {(stat.hours / stat.shifts).toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
