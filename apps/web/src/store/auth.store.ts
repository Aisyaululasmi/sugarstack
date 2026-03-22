import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@sugarstack/shared';
import { authRepository } from '@/core/infrastructure/api/auth.repository';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const { user, token } = await authRepository.login(email, password);
        set({ user, token });
      },

      register: async (email, password, name) => {
        const { user, token } = await authRepository.register(email, password, name);
        set({ user, token });
      },

      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'sugarstack-auth',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
