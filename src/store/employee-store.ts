import { create } from 'zustand';
import { Employee, EmployeeState, EmployeeRole } from '@/types';
import { generateId } from '@/lib/utils';
import { useUserStore } from './user-store';

// Note: No longer using INITIAL_EMPLOYEES or persist middleware
// Employees are now loaded from database via API

// Helper function to determine role based on employeeRole
const getRoleFromEmployeeRole = (employeeRole: EmployeeRole): 'manager' | 'staff' => {
  // SM, SUP, CAP are managers; FT, CL are staff
  return ['SM', 'SUP', 'CAP'].includes(employeeRole) ? 'manager' : 'staff';
};

export const useEmployeeStore = create<EmployeeState>()((set, get) => ({
  employees: [],
  
  // Load employees from API
  loadEmployees: async (opts?: { role?: string; search?: string; limit?: number; offset?: number; append?: boolean }) => {
    try {
      const role = opts?.role ?? 'staff';
      const limit = typeof opts?.limit === 'number' ? opts!.limit : 50;
      const offset = typeof opts?.offset === 'number' ? opts!.offset : 0;
      const search = opts?.search;

      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (search) params.append('search', search);
      if (limit) params.append('limit', String(limit));
      if (offset) params.append('offset', String(offset));

      const response = await fetch(`/api/employees?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const employees = data.map((emp: any) => ({
          id: emp.id,
          code: emp.code,
          name: emp.name,
          employeeRole: emp.employeeRole,
          role: emp.role,
          email: emp.email,
          phone: emp.phone,
          avatar: emp.avatar,
          createdAt: new Date(emp.createdAt),
        }));

        if (opts?.append) {
          set((state) => ({ employees: [...state.employees, ...employees] }));
        } else {
          set({ employees });
        }

        console.log('✅ Loaded employees from database:', employees.length, 'employees', opts?.append ? '(appended)' : '');
      } else {
        console.error('❌ Failed to load employees:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to load employees:', error);
    }
  },

  addEmployee: (employee) => {
    // Auto-set role based on employeeRole
    const role = getRoleFromEmployeeRole(employee.employeeRole);
    
    const newEmployee: Employee = {
      ...employee,
      role, // Override with auto-calculated role
      id: generateId(),
      createdAt: new Date(),
    };
    set((state) => ({
      employees: [...state.employees, newEmployee],
    }));
    
    // Tự động tạo tài khoản user cho nhân viên mới
    const { addUser } = useUserStore.getState();
    addUser({
      email: newEmployee.email,
      password: 'Kat123@', // Mật khẩu mặc định
      role: newEmployee.role,
      employeeId: newEmployee.id,
    });
  },

  updateEmployee: (id, updates) => {
    // Auto-set role if employeeRole is being updated
    let finalUpdates = { ...updates };
    if (updates.employeeRole) {
      finalUpdates.role = getRoleFromEmployeeRole(updates.employeeRole);
    }
    
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...finalUpdates } : emp
      ),
    }));
    
    // Nếu cập nhật email hoặc role, cập nhật luôn user account
    if (finalUpdates.email || finalUpdates.role) {
      const { updateUser } = useUserStore.getState();
      updateUser(id, {
        email: finalUpdates.email,
        role: finalUpdates.role,
      });
    }
  },

  deleteEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    }));
    
    // Xóa luôn user account
    const { deleteUser } = useUserStore.getState();
    deleteUser(id);
  },

  getEmployeeById: (id) => {
    return get().employees.find((emp) => emp.id === id);
  },
}));
