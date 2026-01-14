'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Home,
  Users,
  Calendar,
  Clock,
  Bell,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  Heart,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
  code: string;
}

interface SidebarProps {
  children: React.ReactNode;
}

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const { user, logout, isHydrated } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (user?.employeeId) {
      fetch(`/api/employees?id=${user.employeeId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setCurrentEmployee(data);
          }
        })
        .catch(err => console.error('Failed to load employee:', err));
    }
  }, [user?.employeeId]);

  const menuItems = [
    {
      name: 'Trang chủ',
      href: '/dashboard',
      icon: Home,
      roles: ['manager', 'staff'],
      showInBottomNav: true,
    },
    {
      name: 'Nhân viên',
      href: '/employees',
      icon: Users,
      roles: ['manager'],
      showInBottomNav: true,
    },
    {
      name: 'Đăng ký lịch',
      href: '/employee-schedule',
      icon: Calendar,
      roles: ['staff'],
      showInBottomNav: true,
    },
    {
      name: 'Lịch làm việc',
      href: '/schedule',
      icon: Calendar,
      roles: ['manager', 'staff'],
      showInBottomNav: true,
    },
    {
      name: 'Giờ công',
      href: '/time-logs',
      icon: Clock,
      roles: ['manager', 'staff'],
      showInBottomNav: true,
    },
    {
      name: 'Thông báo',
      href: '/announcements',
      icon: Bell,
      roles: ['manager', 'staff'],
      showInBottomNav: false,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  // Items for bottom navigation (max 4 + more)
  const bottomNavItems = filteredMenuItems.filter(item => item.showInBottomNav).slice(0, 4);
  const moreMenuItems = filteredMenuItems.filter(item => !bottomNavItems.includes(item));

  // Show loading while hydrating to prevent flash of empty menu
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 safe-area-top"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">（づ￣3￣）づ╭❤️～</h1>
          <div className="flex items-center gap-2">
            {/* {user && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {user.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
              </span>
            )} */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-70 bg-white border-r border-gray-200 transition-transform',
          'hidden lg:block'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-indigo-600">（づ￣3￣）づ╭❤️～</h1>
            {user && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {currentEmployee?.name || user.email}
                </p>
                <p className="text-xs text-gray-600 capitalize mt-1">
                  {user.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                  {currentEmployee?.code && ` • ${currentEmployee.code}`}
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => setShowDonate(true)}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-pink-600 hover:bg-pink-50 transition-colors"
            >
              <Heart size={20} />
              <span>Nuôi tôi</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile slide-out menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed top-0 right-0 z-50 h-screen w-72 bg-white shadow-xl lg:hidden animate-slide-in-right">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  {user && (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        {currentEmployee?.name || user.email}
                      </p>
                      <p className="text-xs text-gray-600">
                        {user.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                        {currentEmployee?.code && ` • ${currentEmployee.code}`}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowDonate(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  <Heart size={20} />
                  <span>Nuôi tôi</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom"
      >
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center py-1 px-3 rounded-lg transition-colors min-w-[64px]',
                  isActive
                    ? 'text-indigo-600'
                    : 'text-gray-500'
                )}
              >
                <Icon size={22} />
                <span className="text-[10px] mt-1 font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
          {moreMenuItems.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={cn(
                  'flex flex-col items-center py-1 px-3 rounded-lg transition-colors min-w-[64px]',
                  showMoreMenu ? 'text-indigo-600' : 'text-gray-500'
                )}
              >
                <MoreHorizontal size={22} />
                <span className="text-[10px] mt-1 font-medium">Thêm</span>
              </button>
              {showMoreMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {moreMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMoreMenu(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 transition-colors',
                            isActive
                              ? 'bg-indigo-50 text-indigo-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          <Icon size={18} />
                          <span className="text-sm">{item.name}</span>
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowDonate(true);
                      }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-pink-600 hover:bg-pink-50 transition-colors border-t border-gray-100"
                    >
                      <Heart size={18} />
                      <span className="text-sm">Nuôi tôi</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        logout();
                      }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} />
                      <span className="text-sm">Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="lg:ml-64 pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="p-4 lg:p-6" style={{ minHeight: '100vh' }}>
          {children}
        </div>
      </main>

      {/* Donate Modal */}
      {showDonate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDonate(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDonate(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
            
            <div className="text-center mb-6">
              <Heart size={48} className="text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuôi tôi</h2>
              <p className="text-gray-600">Cảm ơn bạn đã ủng hộ dự án! 💖</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* MBBank */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <h3 className="font-semibold text-blue-900 mb-3">MBBank</h3>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <img
                    src="/donate/MBBank.jpg"
                    alt="MBBank QR Code"
                    className="w-full h-auto rounded"
                  />
                </div>
              </div>

              {/* Momo */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 text-center">
                <h3 className="font-semibold text-pink-900 mb-3">Momo</h3>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <img
                    src="/donate/Momo.jpg"
                    alt="Momo QR Code"
                    className="w-full h-auto rounded"
                  />
                </div>
              </div>

              {/* Viettinbank */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <h3 className="font-semibold text-green-900 mb-3">Viettinbank</h3>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <img
                    src="/donate/Viettinbank.jpg"
                    alt="Viettinbank QR Code"
                    className="w-full h-auto rounded"
                  />
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Quét mã QR để chuyển khoản qua ứng dụng ngân hàng
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
