import { create } from 'zustand';
import axios from 'axios';

const API_BASE = 'http://localhost:5144/api';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface UserDto {
  id: number;
  fullName: string;
  username: string;
  role: 'Admin' | 'User' | 'Viewer';
  roleDisplayName: string;
  isActive: boolean;
  isEditor: boolean;
  permissions: number;
  createdAt: string;
  specialization?: string;
  statusDisplayName: string;
}

export interface CreateUserDto {
  fullName: string;
  username: string;
  password: string;
  role: number; // 0=Viewer, 1=User, 2=Admin
  isEditor: boolean;
  permissions: number;
  specialization?: string;
}

export interface UpdateUserDto {
  fullName: string;
  username: string;
  password?: string;
  role: number;
  isEditor: boolean;
  permissions: number;
  specialization?: string;
}

export interface UserStats {
  totalCount: number;
  activeCount: number;
  adminCount: number;
}

export interface AuditLogDto {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  details?: string;
  timestamp: string;
  referenceId?: number;
}

export interface AuditLogStats {
  activitiesToday: number;
  modificationsToday: number;
  mostActiveUser?: string;
}

// ═══════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════

interface UsersState {
  users: UserDto[];
  stats: UserStats;
  auditLogs: AuditLogDto[];
  auditStats: AuditLogStats;
  isLoading: boolean;
  searchQuery: string;
  auditFilters: {
    userId?: number;
    startDate?: string;
    endDate?: string;
  };

  // Actions
  setSearchQuery: (query: string) => void;
  setAuditFilters: (filters: Partial<UsersState['auditFilters']>) => void;
  fetchUsers: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createUser: (dto: CreateUserDto) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: number, dto: UpdateUserDto) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (id: number) => Promise<{ success: boolean; error?: string }>;
  checkUsername: (username: string, excludeId?: number) => Promise<boolean>;
  fetchAuditLogs: () => Promise<void>;
  fetchAuditStats: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  stats: { totalCount: 0, activeCount: 0, adminCount: 0 },
  auditLogs: [],
  auditStats: { activitiesToday: 0, modificationsToday: 0 },
  isLoading: false,
  searchQuery: '',
  auditFilters: {},

  setSearchQuery: (query) => set({ searchQuery: query }),

  setAuditFilters: (filters) => set((state) => ({
    auditFilters: { ...state.auditFilters, ...filters }
  })),

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axios.get(`${API_BASE}/users`);
      set({ users: data });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/users/stats`);
      set({ stats: data });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  },

  createUser: async (dto) => {
    try {
      await axios.post(`${API_BASE}/users`, dto);
      await get().fetchUsers();
      await get().fetchStats();
      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || 'حدث خطأ أثناء إنشاء المستخدم';
      return { success: false, error: message };
    }
  },

  updateUser: async (id, dto) => {
    try {
      await axios.put(`${API_BASE}/users/${id}`, dto);
      await get().fetchUsers();
      await get().fetchStats();
      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || 'حدث خطأ أثناء تحديث المستخدم';
      return { success: false, error: message };
    }
  },

  toggleUserStatus: async (id) => {
    try {
      await axios.patch(`${API_BASE}/users/${id}/toggle`);
      await get().fetchUsers();
      await get().fetchStats();
      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || 'حدث خطأ أثناء تحديث حالة المستخدم';
      return { success: false, error: message };
    }
  },

  checkUsername: async (username, excludeId) => {
    try {
      const params: any = { username };
      if (excludeId) params.excludeId = excludeId;
      const { data } = await axios.get(`${API_BASE}/users/check-username`, { params });
      return data.isUnique;
    } catch {
      return false;
    }
  },

  fetchAuditLogs: async () => {
    set({ isLoading: true });
    try {
      const filters = get().auditFilters;
      const params: any = { limit: 200 };
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await axios.get(`${API_BASE}/audit-logs`, { params });
      set({ auditLogs: data });
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAuditStats: async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/audit-logs/stats`);
      set({ auditStats: data });
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  },
}));
