"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import {
  Users,
  Calendar,
  Clock,
  Bell,
  AlertCircle,
  CheckCircle,
  User,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import {
  formatDateISO,
  formatDate,
  getWeekDates,
  parseDateOnly,
} from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  code: string;
  employeeRole: string;
  role: string;
  avatar?: string;
}

interface Shift {
  id: string;
  employeeId: string;
  date: string;
  start: string;
  end: string;
  status: string;
  notes?: string;
}

interface TimeLog {
  id: string;
  employeeId: string;
  date: string;
  actualStart: string;
  actualEnd: string;
  totalHours: number;
  employee?: {
    name: string;
  };
}

interface ShiftPreference {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  employee?: {
    name: string;
  };
}

export default function DashboardPage() {
  const { user, isHydrated, updateAvatar } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [shiftPreferences, setShiftPreferences] = useState<ShiftPreference[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [employeesOffset, setEmployeesOffset] = useState(0);
  const [notifPermission, setNotifPermission] = useState<
    "default" | "granted" | "denied"
  >(() => {
    if (typeof Notification === "undefined") return "default";
    return Notification.permission as "default" | "granted" | "denied";
  });
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const EMPLOYEES_PAGE_LIMIT = 50;

  // Load all data
  useEffect(() => {
    if (!user) return;

    if (user.isSandbox) {
      setAnnouncements([]);
      setEmployees([]);
      setCurrentEmployee(null);
      setShifts([]);
      setTimeLogs([]);
      setShiftPreferences([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const weekDates = getWeekDates(today);
        const startDate = formatDateISO(weekDates[0]);
        const endDate = formatDateISO(weekDates[6]);

        // Parallel fetch
        const [
          announcementsRes,
          employeesRes,
          shiftsRes,
          timeLogsRes,
          preferencesRes,
        ] = await Promise.all([
          fetch("/api/announcements"),
          // Load staff only to reduce payload (first page)
          fetch(
            `/api/employees?role=staff&limit=${EMPLOYEES_PAGE_LIMIT}&offset=0`,
          ),
          fetch(`/api/shifts?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/time-logs?startDate=${startDate}&endDate=${endDate}`),
          fetch(
            `/api/shift-preferences?startDate=${startDate}&endDate=${endDate}`,
          ),
        ]);

        if (announcementsRes.ok) {
          const data = await announcementsRes.json();
          setAnnouncements(data);
        }

        if (employeesRes.ok) {
          const data = await employeesRes.json();

          // Find current employee
          if (user?.employeeId) {
            const emp = data.find((e: Employee) => e.id === user.employeeId);
            setCurrentEmployee(emp || null);
          }
          setEmployees(data);
          setEmployeesOffset(data.length);
        }

        if (shiftsRes.ok) {
          const data = await shiftsRes.json();
          setShifts(data);
        }

        if (timeLogsRes.ok) {
          const data = await timeLogsRes.json();
          setTimeLogs(data);
        }

        if (preferencesRes.ok) {
          const data = await preferencesRes.json();
          setShiftPreferences(data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.employeeId]);

  // Check notification permission and platform to show a small banner (non-blocking)
  useEffect(() => {
    if (!isHydrated || !user) return;

    const ua =
      typeof navigator !== "undefined" && navigator.userAgent
        ? navigator.userAgent.toLowerCase()
        : "";
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIos(ios);
    const mobile =
      /mobi|android|iphone|ipad|ipod|tablet/.test(ua) ||
      (typeof navigator !== "undefined" && (navigator.maxTouchPoints ?? 0) > 0);
    setIsMobile(mobile);

    const p =
      typeof Notification !== "undefined"
        ? (Notification.permission as "default" | "granted" | "denied")
        : "default";
    setNotifPermission(p);

    if (ios) {
      // On iOS, web push support is limited; show informational banner linking to guide
      setShowIosBanner(p !== "granted");
      setShowNotifBanner(false);

      // Re-show banner when user returns to the app (focus/visibility), so it appears again after they navigate away
      const handleVisibility = () => {
        const perm =
          typeof Notification !== "undefined"
            ? (Notification.permission as "default" | "granted" | "denied")
            : "default";
        setNotifPermission(perm);
        setShowIosBanner(perm !== "granted");
      };

      window.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", handleVisibility);

      return () => {
        window.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", handleVisibility);
      };
    }

    // Non-iOS: show small banner if not granted (only on mobile devices)
    setShowNotifBanner(mobile && p !== "granted");
  }, [isHydrated, user]);

  const requestNotificationPermission = async () => {
    if (
      typeof Notification === "undefined" ||
      !("requestPermission" in Notification)
    )
      return;
    try {
      const p = await (Notification as any).requestPermission();
      setNotifPermission(p);
      setShowNotifBanner(p !== "granted");
      setShowIosBanner(false);
    } catch (e) {
      console.error(e);
    }
  };

  const recheckPermission = () => {
    const p =
      typeof Notification !== "undefined"
        ? (Notification.permission as "default" | "granted" | "denied")
        : "default";
    setNotifPermission(p);
    setShowNotifBanner(p !== "granted");
    if (isIos) setShowIosBanner(p !== "granted");
  };

  // Load next page of employees (lazy-load)
  const loadMoreEmployees = async () => {
    try {
      const res = await fetch(
        `/api/employees?role=staff&limit=${EMPLOYEES_PAGE_LIMIT}&offset=${employeesOffset}`,
      );
      if (res.ok) {
        const data = await res.json();
        setEmployees((prev) => [...prev, ...data]);
        setEmployeesOffset((prev) => prev + data.length);
      }
    } catch (err) {
      console.error("Failed to load more employees", err);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const today = formatDateISO(new Date());

    // Manager stats
    const totalEmployees = employees.filter((e) => e.role !== "manager").length;
    const todayShifts = shifts.filter((s) => s.date === today);
    const weekHours = timeLogs.reduce((sum, log) => sum + log.totalHours, 0);
    const pendingPreferences = shiftPreferences.filter(
      (p) => p.status === "pending",
    );

    // Employee stats - Giờ làm hôm nay
    const myTodayShifts = shifts.filter(
      (s) => s.employeeId === user?.employeeId && s.date === today,
    );
    const todayWorkHours = myTodayShifts.reduce((total, shift) => {
      const [startHour, startMin] = shift.start.split(":").map(Number);
      const [endHour, endMin] = shift.end.split(":").map(Number);
      const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
      return total + hours;
    }, 0);

    return {
      totalEmployees,
      todayShifts: todayShifts.length,
      weekShifts: shifts.length,
      weekHours: weekHours.toFixed(1),
      pendingPreferences: pendingPreferences.length,
      totalAnnouncements: announcements.length,
      todayWorkHours: todayWorkHours.toFixed(1),
    };
  }, [
    employees,
    shifts,
    timeLogs,
    shiftPreferences,
    announcements,
    user?.employeeId,
  ]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Redirect to login if not authenticated
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

  const isGuest = !user;
  const isSandbox = !!user?.isSandbox;
  const isManager = user?.role === "manager";
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  // Lấy tên nhân viên, chỉ lấy tên cuối cùng (ví dụ: "Nguyễn Văn An" -> "An")
  const getEmployeeName = () => {
    if (user?.employeeId) {
      const employee = employees.find((emp) => emp.id === user.employeeId);
      if (employee?.name) {
        const nameParts = employee.name.trim().split(" ");
        return nameParts[nameParts.length - 1]; // Lấy tên cuối
      }
    }
    return user?.email?.split("@")[0] || "Bạn";
  };

  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header with Avatar */}
        <div className="mb-4 sm:mb-8">
          {isGuest && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">
              Bạn đang xem chế độ công khai dành cho khách. Dữ liệu cửa hàng
              được ẩn. Nếu cần quyền quản lý/admin, vui lòng liên hệ chủ web.
            </div>
          )}
          {isSandbox && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900 text-sm">
              Bạn đang dùng tài khoản test (sandbox). Dữ liệu cửa hàng bị ẩn
              hoàn toàn.
            </div>
          )}
          <div className="flex flex-col items-center gap-4 mb-6">
            {/* Avatar Upload */}
            {!isGuest && user && (
              <AvatarUpload
                userId={user.id}
                employeeId={user.employeeId}
                currentAvatar={user.avatar || undefined}
                userName={getEmployeeName()}
                onAvatarChange={(newAvatar) => {
                  // Update avatar in auth store immediately
                  updateAvatar(newAvatar);
                }}
              />
            )}

            {/* Greeting */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
              {greeting()}, {isGuest ? "Bạn" : getEmployeeName()}! 👋
            </h1>
          </div>
        </div>

        {/* Small non-blocking notification/banner UI
        {showIosBanner && notifPermission !== 'granted' && (
          <div className="mt-2 rounded-md bg-amber-50 border border-amber-100 p-3 text-amber-900">
            <div className="flex items-center justify-between">
              <div className="text-sm">Trình duyệt trên iPhone/iPad không hỗ trợ thông báo đầy đủ. Mở trang "Cài đặt" để được hướng dẫn cài Ứng dụng.</div>
            </div>
          </div>
        )} */}

        {showNotifBanner && !showIosBanner && notifPermission !== "granted" && (
          <div className="mt-2 rounded-md bg-sky-50 border border-sky-100 p-3 text-sky-900">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                Nhận thông báo để không bỏ lỡ lịch và thông báo quan trọng.
              </div>
              <div className="flex items-center gap-2">
                {notifPermission === "default" && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={requestNotificationPermission}
                  >
                    Bật thông báo
                  </button>
                )}
                {notifPermission === "denied" && (
                  <>
                    <Link
                      href="/settings-mobile"
                      className="text-sky-700 underline text-sm"
                    >
                      Hướng dẫn
                    </Link>
                    <button
                      className="text-sky-700 text-sm"
                      onClick={recheckPermission}
                    >
                      Kiểm tra lại
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-8">
              {isManager ? (
                <>
                  <StatCard
                    title="Nhân viên"
                    value={stats.totalEmployees}
                    icon={Users}
                    color="blue"
                    href="/employees"
                  />
                  {/* <StatCard
                    title="Ca hôm nay"
                    value={stats.todayShifts}
                    icon={Calendar}
                    color="green"
                    href="/schedule"
                  /> */}
                  {/* <StatCard
                    title="Giờ công tuần"
                    value={`${stats.weekHours}h`}
                    icon={Clock}
                    color="purple"
                    href="/time-logs"
                  /> */}
                  <StatCard
                    title="Chờ duyệt"
                    value={stats.pendingPreferences}
                    icon={AlertCircle}
                    color="orange"
                    href="/schedule"
                    highlight={stats.pendingPreferences > 0}
                  />
                </>
              ) : (
                <>
                  {/* <StatCard
                    title="Ca tuần này"
                    value={shifts.filter(s => s.employeeId === user.employeeId).length}
                    icon={Calendar}
                    color="blue"
                    href="/schedule"
                  /> */}
                  {/* <StatCard
                    title="Giờ làm hôm nay"
                    value={`${stats.todayWorkHours}h`}
                    icon={Clock}
                    color="green"
                    href="/schedule"
                  /> */}
                  {/* <StatCard
                    title="Đăng ký chờ"
                    value={shiftPreferences.filter(p => p.employeeId === user.employeeId && p.status === 'pending').length}
                    icon={AlertCircle}
                    color="purple"
                    href="/employee-schedule"
                  /> */}
                  {/* <StatCard
                    title="Thông báo"
                    value={stats.totalAnnouncements}
                    icon={Bell}
                    color="orange"
                    href="/announcements"
                  /> */}
                </>
              )}
            </div>

            <div className="w-full">
              {/* Latest Announcements */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Bell size={18} className="text-indigo-600" />
                    Thông báo mới
                  </h2>
                  <Link
                    href="/announcements"
                    className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm flex items-center gap-1"
                  >
                    Xem tất cả
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="p-3 sm:p-4">
                  {announcements.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      Chưa có thông báo
                    </p>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {announcements.slice(0, 3).map((announcement) => (
                        <Link
                          key={announcement.id}
                          href="/announcements"
                          className="block p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <h3 className="font-medium text-gray-900 mb-0.5 text-sm line-clamp-1">
                            {announcement.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {formatDateTime(announcement.createdAt)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 sm:p-4 border-t border-gray-100 flex justify-end">
                {employees.length >= EMPLOYEES_PAGE_LIMIT && (
                  <button
                    onClick={loadMoreEmployees}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Tải thêm nhân viên
                  </button>
                )}
              </div>

              {/* Today's Schedule / My Schedule */}
              {/* <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={18} className="text-green-600" />
                    {isManager ? 'Lịch hôm nay' : 'Lịch của tôi'}
                  </h2>
                  <Link 
                    href="/schedule" 
                    className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm flex items-center gap-1"
                  >
                    Xem lịch
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="p-3 sm:p-4">
                  {isManager ? (
                    <TodaySchedule shifts={shifts} employees={employees} />
                  ) : (
                    <MyWeekSchedule 
                      shifts={shifts.filter(s => s.employeeId === user.employeeId)} 
                    />
                  )}
                </div>
              </div> */}

              {/* Manager: Pending Approvals */}
              {/* {isManager && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <AlertCircle size={18} className="text-orange-600" />
                      Chờ duyệt
                    </h2>
                    {PendingPreferences.length > 0 && (
                      <Link 
                      href="/schedule" 
                      className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm flex items-center gap-1"
                    >
                      Xử lý
                      <ChevronRight size={14} />
                    </Link>
                    )
                    }
                  </div>
                  <div className="p-3 sm:p-4">
                    <PendingPreferences preferences={shiftPreferences} />
                  </div>
                </div>
              )} */}

              {/* Recent Time Logs */}
              {/* <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock size={18} className="text-purple-600" />
                    Giờ công gần đây
                  </h2>
                  <Link 
                    href="/time-logs" 
                    className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm flex items-center gap-1"
                  >
                    Xem tất cả
                    <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="p-3 sm:p-4">
                  <RecentTimeLogs 
                    logs={isManager ? timeLogs : timeLogs.filter(l => l.employeeId === user.employeeId)} 
                  />
                </div>
              </div> */}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 sm:mt-8">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Thao tác nhanh
              </h1>
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {isManager ? (
                  <>
                    <QuickAction
                      href="/schedule"
                      icon={Calendar}
                      label="Xếp lịch"
                      color="blue"
                    />
                    <QuickAction
                      href="/time-logs"
                      icon={Clock}
                      label="Ghi công"
                      color="green"
                    />
                    <QuickAction
                      href="/employees"
                      icon={Users}
                      label="Nhân viên"
                      color="purple"
                    />
                    <QuickAction
                      href="/announcements"
                      icon={Bell}
                      label="Thông báo"
                      color="orange"
                    />
                  </>
                ) : (
                  <>
                    <QuickAction
                      href="/settings-mobile"
                      icon={Download}
                      label="Cài đặt"
                      color="blue"
                    />
                    <QuickAction
                      href="/schedule"
                      icon={Calendar}
                      label="Xem lịch"
                      color="green"
                    />
                    <QuickAction
                      href="/time-logs"
                      icon={Clock}
                      label="Giờ công"
                      color="purple"
                    />
                    <QuickAction
                      href="/announcements"
                      icon={Bell}
                      label="Thông báo"
                      color="orange"
                    />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
}

// Components

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
  highlight = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange";
  href: string;
  highlight?: boolean;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Link href={href}>
      <div
        className={`bg-white rounded-lg shadow p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer ${highlight ? "ring-2 ring-orange-400" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-gray-600 text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">
              {title}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {value}
            </p>
          </div>
          <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${colors[color]}`}>
            <Icon size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
    purple: "bg-purple-500 hover:bg-purple-600",
    orange: "bg-orange-500 hover:bg-orange-600",
  };

  return (
    <Link href={href}>
      <div
        className={`${colors[color]} text-white rounded-lg p-2.5 sm:p-4 text-center transition-colors cursor-pointer`}
      >
        <Icon size={20} className="mx-auto mb-1 sm:mb-2 sm:w-6 sm:h-6" />
        <p className="text-xs sm:text-sm font-medium truncate">{label}</p>
      </div>
    </Link>
  );
}

// function TodaySchedule({ shifts, employees }: { shifts: Shift[]; employees: Employee[] }) {
//   const today = formatDateISO(new Date());
//   const todayShifts = shifts.filter(s => s.date === today);

//   if (todayShifts.length === 0) {
//     return <p className="text-gray-500 text-center py-4 text-sm">Không có ca làm hôm nay</p>;
//   }

//   return (
//     <div className="space-y-2">
//       {todayShifts.slice(0, 5).map((shift) => {
//         const employee = employees.find(e => e.id === shift.employeeId);
//         return (
//           <div key={shift.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg gap-2">
//             <div className="flex items-center gap-2 sm:gap-3 min-w-0">
//               <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
//                 <User size={14} className="text-indigo-600 sm:w-4 sm:h-4" />
//               </div>
//               <div className="min-w-0">
//                 <p className="font-medium text-gray-900 text-sm truncate">{employee?.name || 'N/A'}</p>
//                 <p className="text-xs sm:text-sm text-gray-600">{shift.start} - {shift.end}</p>
//               </div>
//             </div>
//             <CheckCircle size={16} className="text-green-500 shrink-0" />
//           </div>
//         );
//       })}
//       {todayShifts.length > 5 && (
//         <p className="text-xs sm:text-sm text-gray-500 text-center">+{todayShifts.length - 5} ca khác</p>
//       )}
//     </div>
//   );
// }

// function MyWeekSchedule({ shifts }: { shifts: Shift[] }) {
//   const today = formatDateISO(new Date());
//   const todayShifts = shifts.filter(s => s.date === today);

//   if (todayShifts.length === 0) {
//     return (
//       <div className="text-center py-6">
//         <Calendar size={32} className="mx-auto text-gray-400 mb-2" />
//         <p className="text-gray-500 text-sm">Không có ca làm hôm nay</p>
//         <p className="text-xs text-gray-400 mt-1">Nghỉ ngơi và nạp năng lượng! 😊</p>
//       </div>
//     );
//   }

// Tính tổng giờ làm
// const totalHours = todayShifts.reduce((total, shift) => {
//   const [startHour, startMin] = shift.start.split(':').map(Number);
//   const [endHour, endMin] = shift.end.split(':').map(Number);
//   const hours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
//   return total + hours;
// }, 0);

// return (
//   <div className="space-y-3">
//     {/* Tổng giờ làm hôm nay
//     <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-xs text-gray-600 font-medium">Tổng giờ hôm nay</p>
//           <p className="text-2xl font-bold text-green-700">{totalHours.toFixed(1)}h</p>
//         </div>
//         <Clock size={32} className="text-green-600 opacity-50" />
//       </div>
//     </div> */}

//     {/* Danh sách ca làm */}
//     <div className="space-y-2">
//       <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ca làm việc hôm nay</p>
//       {todayShifts.map((shift) => {
//         // Extract position from notes
//         const position = shift.notes?.includes('Position:')
//           ? shift.notes.split('Position:')[1].trim()
//           : 'Chưa xác định';

//         const [startHour, startMin] = shift.start.split(':').map(Number);
//         const [endHour, endMin] = shift.end.split(':').map(Number);
//         const hours = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;

//         return (
//           <div key={shift.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between gap-3">
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 mb-2">
//                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
//                     <User size={16} className="text-blue-600" />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="font-semibold text-gray-900 text-sm">{position}</p>
//                     <p className="text-xs text-gray-500">Vị trí làm việc</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-4 text-sm">
//                   <div className="flex items-center gap-1.5">
//                     <Clock size={14} className="text-gray-400" />
//                     <span className="font-medium text-gray-700">{shift.start} - {shift.end}</span>
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <span className="text-gray-500">•</span>
//                     <span className="text-gray-600">{hours.toFixed(1)}h</span>
//                   </div>
//                 </div>
//               </div>

//               <CheckCircle size={20} className="text-green-500 shrink-0 mt-1" />
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   </div>
// );
// }

function PendingPreferences({
  preferences,
}: {
  preferences: ShiftPreference[];
}) {
  const pending = preferences.filter((p) => p.status === "pending");

  if (pending.length === 0) {
    return (
      <div className="text-center py-4">
        <CheckCircle size={28} className="mx-auto text-green-500 mb-2" />
        <p className="text-gray-500 text-sm">Không có đăng ký chờ duyệt</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pending.slice(0, 4).map((pref) => (
        <div
          key={pref.id}
          className="flex items-center justify-between p-2.5 sm:p-3 bg-orange-50 rounded-lg gap-2"
        >
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {pref.employee?.name || "N/A"}
            </p>
            <p className="text-xs text-gray-600">
              {formatDate(pref.date)} • {pref.startTime}-{pref.endTime}
            </p>
          </div>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium shrink-0">
            Chờ
          </span>
        </div>
      ))}
      {pending.length > 4 && (
        <p className="text-xs sm:text-sm text-gray-500 text-center">
          +{pending.length - 4} đăng ký khác
        </p>
      )}
    </div>
  );
}

function getMondayOfWeek(dateStr: string) {
  const date = parseDateOnly(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // CN thì lùi về T2 trước đó
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return formatDateISO(monday);
}

function RecentTimeLogs({ logs }: { logs: TimeLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4 text-sm">Chưa có giờ công</p>
    );
  }

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-2">
      {sortedLogs.slice(0, 4).map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg gap-2"
        >
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {log.employee?.name || formatDate(log.date)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              {log.actualStart} - {log.actualEnd}
            </p>
          </div>
          <span className="font-semibold text-purple-600 text-sm shrink-0">
            {log.totalHours.toFixed(1)}h
          </span>
        </div>
      ))}
    </div>
  );
}
