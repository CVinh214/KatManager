'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { user, isAuthenticated, login, logout, updateAvatar } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Determine hydration by checking persisted storage key in localStorage (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = 'auth-storage';
      // If key exists, assume persisted state will be rehydrated shortly.
      // If not, still mark hydrated so auth flows continue.
      const stored = localStorage.getItem(key);
      // small timeout to allow zustand persist to finish rehydration
      setTimeout(() => setIsHydrated(true), 0);
    } catch (e) {
      setIsHydrated(true);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isHydrated,
    login,
    logout: handleLogout,
    updateAvatar,
  };
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = 'auth-storage';
      const stored = localStorage.getItem(key);
      setTimeout(() => setIsHydrated(true), 0);
    } catch (e) {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  return { isAuthenticated, isHydrated };
}

export function useRequireRole(allowedRoles: ('manager' | 'staff')[]) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = 'auth-storage';
      const stored = localStorage.getItem(key);
      setTimeout(() => setIsHydrated(true), 0);
    } catch (e) {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !allowedRoles.includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [isHydrated, isAuthenticated, user, allowedRoles, router]);

  return { user, isHydrated, hasAccess: user ? allowedRoles.includes(user.role) : false };
}
