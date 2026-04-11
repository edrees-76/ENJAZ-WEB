import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

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

const API_BASE = 'http://localhost:5144/api';

// ═══════════════════════════════════════════════
// Axios Configuration
// ═══════════════════════════════════════════════

// Add JWT to all requests
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => axios(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const success = await useAuthStore.getState().refreshToken();
        if (success) {
          processQueue(null);
          return axios(originalRequest);
        } else {
          processQueue(error);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════
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
          await axios.post(`${API_BASE}/auth/logout`);
        } catch {
          // Ignore errors during logout
        }
        set({ token: null, user: null, isAuthenticated: false });
      },

      refreshToken: async () => {
        try {
          const response = await axios.post(`${API_BASE}/auth/refresh`, {}, {
            withCredentials: true
          });
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
