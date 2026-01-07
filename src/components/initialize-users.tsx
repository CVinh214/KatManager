'use client';

import { useEffect } from 'react';
import { useEmployeeStore } from '@/store/employee-store';
import { useUserStore } from '@/store/user-store';

/**
 * Component để khởi tạo user accounts cho tất cả nhân viên
 * Chỉ chạy một lần khi app load lần đầu
 */
export function InitializeUsers() {
  const employees = useEmployeeStore((state) => state.employees);
  const initializeUsersFromEmployees = useUserStore((state) => state.initializeUsersFromEmployees);

  useEffect(() => {
    // Khởi tạo users cho tất cả nhân viên hiện có
    if (employees.length > 0) {
      initializeUsersFromEmployees(employees);
    }
  }, [employees, initializeUsersFromEmployees]);

  return null; // Component này không render gì
}
