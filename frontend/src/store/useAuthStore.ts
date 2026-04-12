import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

// ═══════════════════════════════════════════════
// Permission Bitmask Constants
// ═══════════════════════════════════════════════

export const Permission = {
  SampleReceptions: 1,
  Certificates: 2,
  Reports: 4,
  Settings: 8,
  AdminProcedures: 16,
  Users: 32,
  All: 63,
} as const;

export const hasPermission = (userPerms: number, perm: number): boolean =>
  (userPerms & perm) !== 0;

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: 'Admin' | 'User' | 'Viewer';
  roleDisplayName: string;
  permissions: number;
  isEditor: boolean;
  isActive: boolean;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface LoginError {
  message: string;
  remainingAttempts?: number | null;
  retryAfterSeconds?: number | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (response: LoginResponse) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (user: AuthUser) => void;

  // Computed helpers
  isAdmin: () => boolean;
  hasPermission: (perm: number) => boolean;
  canEdit: () => boolean;
}


// Store
// ═══════════════════════════════════════════════

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (response: LoginResponse) => {
        set({
          token: response.accessToken,
          user: response.user,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch {
          // Ignore errors during logout
        }
        set({ token: null, user: null, isAuthenticated: false });
      },

      refreshToken: async () => {
        try {
          const response = await apiClient.post('/auth/refresh');
          const data = response.data as LoginResponse;
          set({
            token: data.accessToken,
            user: data.user,
          });
          return true;
        } catch {
          // Refresh failed — force logout
          set({ token: null, user: null, isAuthenticated: false });
          return false;
        }
      },

      updateUser: (user: AuthUser) => {
        set({ user });
      },

      // Computed helpers
      isAdmin: () => get().user?.role === 'Admin',
      hasPermission: (perm: number) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'Admin') return true;
        return hasPermission(user.permissions, perm);
      },
      canEdit: () => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'Admin') return true;
        return user.isEditor;
      },
    }),
    {
      name: 'enjaz-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export type { LoginResponse, LoginError };
