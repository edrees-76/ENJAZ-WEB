import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: { username: string; role: string } | null;
  token: string | null;
  login: (token: string, username: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, username, role) => set({ token, user: { username, role }, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'enjaz-auth', // unique name for localStorage
    }
  )
);
