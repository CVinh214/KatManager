import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AuthState } from "@/types";
import { useEmployeeStore } from "./employee-store";
import { useShiftStore } from "./shift-store";
import { useTimeLogStore } from "./timelog-store";

const clearRuntimeDataStores = () => {
  useEmployeeStore.setState({ employees: [] });
  useShiftStore.setState({
    shifts: [],
    shiftRequests: [],
    shiftPreferences: [],
    isRegistrationEnabled: false,
  });
  useTimeLogStore.setState({ timeLogs: [] });
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          // Gọi API login để xác thực với database
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            clearRuntimeDataStores();

            const user = {
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              employeeId: data.user.employeeId,
              avatar: data.user.avatar,
              isSandbox: (data.user.email || "")
                .toLowerCase()
                .endsWith("@test.local"),
            };
            set({ user, isAuthenticated: true });
            return true;
          }

          console.error("Login failed:", data.error);
          return false;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },
      logout: () => {
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {
          // ignore network errors on logout
        });
        clearRuntimeDataStores();
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
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
