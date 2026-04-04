import { create } from 'zustand';

interface AuthState {
  user: { username: string; role: string } | null;
  token: string | null;
  login: (token: string, username: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (token, username, role) => set({ token, user: { username, role }, isAuthenticated: true }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}));
