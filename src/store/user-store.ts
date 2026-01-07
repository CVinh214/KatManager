import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: 'manager' | 'staff';
  employeeId: string;
  createdAt: Date;
}

interface UserStore {
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  updateUser: (employeeId: string, updates: Partial<UserAccount>) => void;
  deleteUser: (employeeId: string) => void;
  getUserByEmail: (email: string) => UserAccount | undefined;
  getUserByEmployeeId: (employeeId: string) => UserAccount | undefined;
  validateCredentials: (email: string, password: string) => UserAccount | null;
  initializeUsersFromEmployees: (employees: any[]) => void;
}

const DEFAULT_PASSWORD = 'Kat123@';

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],
      
      addUser: (user) => {
        const newUser: UserAccount = {
          ...user,
          id: `user-${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({
          users: [...state.users, newUser],
        }));
      },
      
      updateUser: (employeeId, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.employeeId === employeeId ? { ...user, ...updates } : user
          ),
        }));
      },
      
      deleteUser: (employeeId) => {
        set((state) => ({
          users: state.users.filter((user) => user.employeeId !== employeeId),
        }));
      },
      
      getUserByEmail: (email) => {
        return get().users.find((user) => user.email === email);
      },
      
      getUserByEmployeeId: (employeeId) => {
        return get().users.find((user) => user.employeeId === employeeId);
      },
      
      validateCredentials: (email, password) => {
        const user = get().users.find(
          (u) => u.email === email && u.password === password
        );
        return user || null;
      },
      
      // Khởi tạo users cho tất cả nhân viên hiện có
      initializeUsersFromEmployees: (employees) => {
        const existingUsers = get().users;
        const newUsers: UserAccount[] = [];
        const updatedUsers: UserAccount[] = [...existingUsers];
        

        
        employees.forEach((employee) => {
          // Kiểm tra user có tồn tại không
          const existingUserIndex = existingUsers.findIndex(
            (u) => u.employeeId === employee.id || u.email === employee.email
          );
          
          if (existingUserIndex === -1) {
            // Tạo user mới
            newUsers.push({
              id: `user-${employee.id}`,
              email: employee.email,
              password: DEFAULT_PASSWORD,
              role: employee.role,
              employeeId: employee.id,
              createdAt: new Date(),
            });
          } else {
            // Đảm bảo employeeId được set đúng
            const existingUser = updatedUsers[existingUserIndex];
            if (!existingUser.employeeId || existingUser.employeeId !== employee.id) {
              updatedUsers[existingUserIndex] = {
                ...existingUser,
                employeeId: employee.id,
              };
            }
          }
        });
        
        // Update state
        set({
          users: [...updatedUsers, ...newUsers],
        });
      },
    }),
    {
      name: 'user-accounts-storage',
    }
  )
);
