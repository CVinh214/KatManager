import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState } from '@/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          // Gọi API login để xác thực với database
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            const user = {
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              employeeId: data.user.employeeId,
              avatar: data.user.avatar,
            };
            set({ user, isAuthenticated: true });
            return true;
          }

          console.error('Login failed:', data.error);
          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      updateAvatar: (avatar: string) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, avatar } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
