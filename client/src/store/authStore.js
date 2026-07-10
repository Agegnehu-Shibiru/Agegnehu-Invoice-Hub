import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userApi, authApi } from '../api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: (user) => set({ user, isAuthenticated: true }),

      logout: async () => {
        try { await authApi.logout(); } catch {}
        set({ user: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true });
          const { data } = await userApi.getMe();
          set({ user: data.data.user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      isAdmin: () => ['admin', 'superadmin'].includes(get().user?.role),
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
