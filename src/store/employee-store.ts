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
  loadEmployees: async () => {
    try {
      const response = await fetch('/api/employees');
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
        set({ employees });
        console.log('✅ Loaded employees from database:', employees.length, 'employees');
        console.log('Sample employee IDs:', employees.slice(0, 3).map((e: Employee) => ({ id: e.id, code: e.code, name: e.name })));
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
