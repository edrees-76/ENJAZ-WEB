import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5144/api/v1') + '/settings';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface SystemSettings {
  id: number;
  enableAlerts: boolean;
  alertThresholdDays: number;
  autoBackupEnabled: boolean;
  backupFrequency: string;
  lastBackupDate: string | null;
  maintenanceMode: boolean;
  updatedAt: string;
}

export interface UserSettings {
  id: number;
  userId: number;
  isDarkMode: boolean;
  fontSizeScale: number;
  updatedAt: string;
}

export interface BackupValidationResult {
  isValid: boolean;
  error: string | null;
  schemaVersion: string | null;
  appVersion: string | null;
  exportDate: string | null;
  exportedBy: string | null;
  recordCounts: Record<string, number>;
}

export interface AlertItem {
  receptionId: number;
  receptionNumber: string;
  sender: string;
  receivedDate: string;
  daysPending: number;
}

// ═══════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════

interface SettingsState {
  // Data
  systemSettings: SystemSettings | null;
  userSettings: UserSettings | null;
  alerts: AlertItem[];
  validationResult: BackupValidationResult | null;

  // Loading states
  loading: boolean;
  saving: boolean;
  exporting: boolean;
  restoring: boolean;
  archiving: boolean;
  resetting: boolean;
  error: string | null;
  successMessage: string | null;

  // Actions
  fetchSystemSettings: () => Promise<void>;
  updateSystemSettings: (dto: Partial<SystemSettings>) => Promise<void>;
  fetchUserSettings: () => Promise<void>;
  updateUserSettings: (dto: Partial<UserSettings>) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  exportBackup: (password: string) => Promise<void>;
  validateBackup: (file: File, password: string) => Promise<BackupValidationResult | null>;
  restoreBackup: (file: File, password: string) => Promise<boolean>;
  archiveLogs: (months: number) => Promise<number>;
  softReset: () => Promise<boolean>;
  hardReset: (password: string, confirmPhrase: string) => Promise<boolean>;
  clearMessages: () => void;
}

const getHeaders = (): Record<string, string> => {
  const token = useAuthStore.getState().token;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const getAuthHeader = (): Record<string, string> => {
  const token = useAuthStore.getState().token;
  return { 'Authorization': `Bearer ${token}` };
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  systemSettings: null,
  userSettings: null,
  alerts: [],
  validationResult: null,
  loading: false,
  saving: false,
  exporting: false,
  restoring: false,
  archiving: false,
  resetting: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  // ═══════════════════════════════════════════════
  // System Settings
  // ═══════════════════════════════════════════════

  fetchSystemSettings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/system`, { headers: getHeaders() });
      if (!res.ok) throw new Error('فشل تحميل إعدادات النظام');
      const data = await res.json();
      set({ systemSettings: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateSystemSettings: async (dto) => {
    set({ saving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/system`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error('فشل حفظ إعدادات النظام');
      const data = await res.json();
      set({ systemSettings: data, saving: false, successMessage: 'تم حفظ الإعدادات بنجاح' });
    } catch (err: any) {
      set({ error: err.message, saving: false });
    }
  },

  // ═══════════════════════════════════════════════
  // User Settings
  // ═══════════════════════════════════════════════

  fetchUserSettings: async () => {
    try {
      const res = await fetch(`${API_BASE}/user`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ userSettings: data });
    } catch { /* silent */ }
  },

  updateUserSettings: async (dto) => {
    set({ saving: true });
    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dto),
      });
      if (!res.ok) throw new Error('فشل حفظ إعدادات المستخدم');
      const data = await res.json();
      set({ userSettings: data, saving: false, successMessage: 'تم حفظ تفضيلاتك' });
    } catch (err: any) {
      set({ error: err.message, saving: false });
    }
  },

  // ═══════════════════════════════════════════════
  // Alerts
  // ═══════════════════════════════════════════════

  fetchAlerts: async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ alerts: data });
    } catch { /* silent */ }
  },

  // ═══════════════════════════════════════════════
  // Backup Export
  // ═══════════════════════════════════════════════

  exportBackup: async (password: string) => {
    set({ exporting: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/backup/export`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل تصدير النسخة');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enjaz_backup_${new Date().toISOString().split('T')[0]}.bak`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      set({ exporting: false, successMessage: 'تم تصدير النسخة الاحتياطية بنجاح' });
    } catch (err: any) {
      set({ error: err.message, exporting: false });
    }
  },

  // ═══════════════════════════════════════════════
  // Backup Validate (Dry-run)
  // ═══════════════════════════════════════════════

  validateBackup: async (file: File, password: string) => {
    set({ loading: true, error: null, validationResult: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);

      const res = await fetch(`${API_BASE}/backup/validate`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل التحقق من الملف');
      }
      const result: BackupValidationResult = await res.json();
      set({ validationResult: result, loading: false });
      return result;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // ═══════════════════════════════════════════════
  // Backup Restore
  // ═══════════════════════════════════════════════

  restoreBackup: async (file: File, password: string) => {
    set({ restoring: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);

      const res = await fetch(`${API_BASE}/backup/restore`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل استعادة النسخة');
      }
      set({ restoring: false, successMessage: 'تمت استعادة النسخة الاحتياطية بنجاح', validationResult: null });
      return true;
    } catch (err: any) {
      set({ error: err.message, restoring: false });
      return false;
    }
  },

  // ═══════════════════════════════════════════════
  // Archive Logs
  // ═══════════════════════════════════════════════

  archiveLogs: async (months: number) => {
    set({ archiving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/archive-logs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ months }),
      });
      if (!res.ok) throw new Error('فشل أرشفة السجلات');
      const data = await res.json();
      set({ archiving: false, successMessage: data.message });
      return data.count;
    } catch (err: any) {
      set({ error: err.message, archiving: false });
      return 0;
    }
  },

  // ═══════════════════════════════════════════════
  // Soft Reset
  // ═══════════════════════════════════════════════

  softReset: async () => {
    set({ resetting: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/soft-reset`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('فشل إعادة ضبط الإعدادات');
      set({ resetting: false, successMessage: 'تمت إعادة ضبط الإعدادات بنجاح' });
      await get().fetchSystemSettings();
      return true;
    } catch (err: any) {
      set({ error: err.message, resetting: false });
      return false;
    }
  },

  // ═══════════════════════════════════════════════
  // Hard Reset
  // ═══════════════════════════════════════════════

  hardReset: async (password: string, confirmPhrase: string) => {
    set({ resetting: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/hard-reset`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ password, confirmPhrase }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل إعادة الضبط');
      }
      set({ resetting: false, successMessage: 'تمت إعادة ضبط المنظومة بنجاح' });
      return true;
    } catch (err: any) {
      set({ error: err.message, resetting: false });
      return false;
    }
  },
}));
