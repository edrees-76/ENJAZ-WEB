import { useEffect, useState, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import {
  Settings as SettingsIcon, Bell, Database, Shield, RotateCcw,
  Download, Upload, Archive, AlertTriangle, Check, X, Loader2,
  Sun, Moon, Type, Eye, ChevronDown, Clock, FileWarning, Trash2, Lock,
  Plus, Minus
} from 'lucide-react';
import { useSettingsStore, type BackupValidationResult } from '../store/useSettingsStore';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';

// ═══════════════════════════════════════════════
// Tab Navigation
// ═══════════════════════════════════════════════

type SettingsTab = 'general' | 'backup' | 'admin';

const TABS: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'general', label: 'عام', icon: SettingsIcon },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
  { id: 'admin', label: 'الإدارة', icon: Shield },
];

// ═══════════════════════════════════════════════
// Toast Component
// ═══════════════════════════════════════════════

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[500] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 border ${
      type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/30' : 'bg-red-500/90 text-white border-red-400/30'
    }`} style={{ backdropFilter: 'blur(12px)' }}>
      {type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════
// Setting Row Component
// ═══════════════════════════════════════════════

const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-200/50 dark:border-white/10 last:border-b-0">
    <div className="flex-1 ml-4">
      <p className="font-bold text-[14px] text-slate-800 dark:text-white">{label}</p>
      {description && <p className="text-[12px] mt-0.5 font-medium text-slate-500 dark:text-blue-100/70">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

// ═══════════════════════════════════════════════
// Toggle Switch
// ═══════════════════════════════════════════════

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    style={{ backgroundColor: checked ? '#0ea5e9' : 'rgba(128,128,128,0.3)' }}
  >
    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'left-0.5' : 'left-[22px]'}`} />
  </button>
);

// ═══════════════════════════════════════════════
// Main Settings Page
// ═══════════════════════════════════════════════

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { isDark, toggleTheme } = useUIStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'Admin';

  const {
    systemSettings, userSettings, alerts, validationResult,
    loading, saving, exporting, restoring, archiving, resetting,
    error, successMessage,
    fetchSystemSettings, updateSystemSettings,
    fetchUserSettings, updateUserSettings,
    fetchAlerts, exportBackup, validateBackup, restoreBackup,
    archiveLogs, softReset, hardReset, clearMessages
  } = useSettingsStore();

  useEffect(() => {
    fetchSystemSettings();
    fetchUserSettings();
    fetchAlerts();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Messages */}
      {successMessage && <Toast message={successMessage} type="success" onClose={clearMessages} />}
      {error && <Toast message={error} type="error" onClose={clearMessages} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">الإعدادات</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-blue-100/70">إدارة إعدادات المنظومة والنسخ الاحتياطي</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm w-fit">
        {TABS.map(tab => {
          if (tab.id === 'admin' && !isAdmin) return null;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-600 dark:text-blue-100 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <GeneralTab isDark={isDark} toggleTheme={toggleTheme} />}
      {activeTab === 'backup' && <BackupTab isDark={isDark} />}
      {activeTab === 'admin' && isAdmin && <AdminTab isDark={isDark} />}
    </div>
  );
};

// ═══════════════════════════════════════════════
// General Tab
// ═══════════════════════════════════════════════

const GeneralTab = ({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) => {
  const { systemSettings, userSettings, alerts, saving, updateSystemSettings, updateUserSettings } = useSettingsStore();
  const [fontScale, setFontScale] = useState(userSettings?.fontSizeScale ?? 1.0);

  useEffect(() => {
    if (userSettings) setFontScale(userSettings.fontSizeScale);
  }, [userSettings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Appearance */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            {isDark ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-white" />}
          </div>
          <h3 className="font-black text-base text-slate-800 dark:text-white">المظهر</h3>
        </div>
        <SettingRow label="الوضع الداكن" description="تفعيل المظهر الداكن للواجهة">
          <Toggle checked={isDark} onChange={() => {
            toggleTheme();
            updateUserSettings({ isDarkMode: !isDark });
          }} />
        </SettingRow>
        <SettingRow label="حجم الخط" description="تعديل قياس النصوص في المنظومة">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/5">
            <button
              onClick={() => {
                const v = Math.max(0.5, fontScale - 0.01);
                setFontScale(v);
                updateUserSettings({ fontSizeScale: v });
              }}
              disabled={fontScale <= 0.5}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/10 hover:shadow-sm disabled:opacity-30 transition-all text-slate-700 dark:text-slate-300"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-16 text-center flex flex-col items-center justify-center">
              <span className="font-bold text-sm text-sky-600 dark:text-sky-400" dir="ltr">
                {Math.round((fontScale - 1) * 100) === 0 ? '0%' : (Math.round((fontScale - 1) * 100) > 0 ? `+${Math.round((fontScale - 1) * 100)}%` : `${Math.round((fontScale - 1) * 100)}%`)}
              </span>
            </div>
            <button
              onClick={() => {
                const v = Math.min(2.0, fontScale + 0.01);
                setFontScale(v);
                updateUserSettings({ fontSizeScale: v });
              }}
              disabled={fontScale >= 2.0}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/10 hover:shadow-sm disabled:opacity-30 transition-all text-slate-700 dark:text-slate-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </SettingRow>
      </GlassCard>

      {/* Alerts */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
            <Bell className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-base text-slate-800 dark:text-white">التنبيهات</h3>
        </div>
        <SettingRow label="تفعيل التنبيهات" description="تنبيه عند مرور أيام على عينات بدون شهادة">
          <Toggle
            checked={systemSettings?.enableAlerts ?? true}
            onChange={v => updateSystemSettings({ enableAlerts: v })}
          />
        </SettingRow>
        <SettingRow label="عدد الأيام" description="المدة قبل إطلاق التنبيه">
          <select
            value={systemSettings?.alertThresholdDays ?? 7}
            onChange={e => updateSystemSettings({ alertThresholdDays: parseInt(e.target.value) })}
            className="px-3 py-1.5 rounded-xl text-sm font-bold border"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: 'var(--text-main)',
            }}
          >
            {[3, 5, 7, 10, 14, 30].map(d => <option key={d} value={d}>{d} أيام</option>)}
          </select>
        </SettingRow>

        {/* Alert Badge */}
        {useSettingsStore.getState().alerts.length > 0 && (
          <div className="mt-3 p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-500">{useSettingsStore.getState().alerts.length} عينة معلقة</p>
              <p className="text-xs font-medium text-slate-500 dark:text-blue-100/70">مر عليها أكثر من {systemSettings?.alertThresholdDays ?? 7} أيام بدون شهادة</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Auto Backup */}
      <GlassCard className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Clock className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-base text-slate-800 dark:text-white">النسخ التلقائي</h3>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-sky-500" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6">
          <SettingRow label="تفعيل النسخ التلقائي" description="نسخة احتياطية تلقائية حسب الجدول">
            <Toggle
              checked={systemSettings?.autoBackupEnabled ?? false}
              onChange={v => updateSystemSettings({ autoBackupEnabled: v })}
            />
          </SettingRow>
          <SettingRow label="التكرار" description="دورة النسخ الاحتياطي">
            <select
              value={systemSettings?.backupFrequency ?? 'daily'}
              onChange={e => updateSystemSettings({ backupFrequency: e.target.value })}
              disabled={!systemSettings?.autoBackupEnabled}
              className="px-3 py-1.5 rounded-xl text-sm font-bold border disabled:opacity-40"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: 'var(--text-main)',
              }}
            >
              <option value="daily">يومياً</option>
              <option value="weekly">أسبوعياً</option>
              <option value="monthly">شهرياً</option>
            </select>
          </SettingRow>
          <SettingRow label="آخر نسخة" description="وقت آخر نسخة احتياطية">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {systemSettings?.lastBackupDate
                ? new Date(systemSettings.lastBackupDate).toLocaleDateString('ar-LY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'لم يتم بعد'}
            </span>
          </SettingRow>
        </div>
      </GlassCard>
    </div>
  );
};

// ═══════════════════════════════════════════════
// Backup Tab
// ═══════════════════════════════════════════════

const BackupTab = ({ isDark }: { isDark: boolean }) => {
  const { exporting, restoring, validationResult, exportBackup, validateBackup, restoreBackup } = useSettingsStore();
  const [exportPassword, setExportPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreStep, setRestoreStep] = useState<'upload' | 'validate' | 'confirm'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!exportPassword) return;
    await exportBackup(exportPassword);
    setExportPassword('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الملف يتجاوز الحد المسموح (50MB)');
        return;
      }
      setRestoreFile(file);
      setRestoreStep('validate');
    }
  };

  const handleValidate = async () => {
    if (!restoreFile || !restorePassword) return;
    const result = await validateBackup(restoreFile, restorePassword);
    if (result?.isValid) setRestoreStep('confirm');
  };

  const handleRestore = async () => {
    if (!restoreFile || !restorePassword) return;
    const ok = await restoreBackup(restoreFile, restorePassword);
    if (ok) {
      setRestoreFile(null);
      setRestoreStep('upload');
      setRestorePassword('');
    }
  };

  const resetRestoreFlow = () => {
    setRestoreFile(null);
    setRestoreStep('upload');
    setRestorePassword('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Export */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
            <Download className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-base text-slate-800 dark:text-white">تصدير نسخة احتياطية</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-blue-100/70 mb-4">
          تصدير جميع بيانات المنظومة كملف مشفر (AES-256). ستحتاج كلمة المرور لاحقاً عند الاستعادة.
        </p>
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3 rounded-xl mb-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
            في حال نسيانك لكلمة المرور، لا يمكن بأي شكل من الأشكال فك تشفير أو استعادة هذه النسخة! الرجاء الاحتفاظ بها في مكان آمن.
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="كلمة المرور للتشفير"
            value={exportPassword}
            onChange={e => setExportPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm font-bold border"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: 'var(--text-main)',
            }}
          />
          <button
            onClick={handleExport}
            disabled={!exportPassword || exporting}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'جاري التصدير...' : 'تصدير النسخة'}
          </button>
        </div>
      </GlassCard>

      {/* Restore */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Upload className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-base text-slate-800 dark:text-white">استعادة نسخة احتياطية</h3>
        </div>

        {/* Step 1: Upload */}
        {restoreStep === 'upload' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-blue-100/70">
              رفع ملف النسخة الاحتياطية (.bak) للتحقق والاستعادة
            </p>
            <input ref={fileRef} type="file" accept=".bak" onChange={handleFileSelect} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all hover:scale-[1.01]"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
              <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">اضغط لاختيار ملف</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">الحد الأقصى: 50MB</span>
            </button>
          </div>
        )}

        {/* Step 2: Validate */}
        {restoreStep === 'validate' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--border-glass)' }}>
              <Database className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{restoreFile?.name}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-blue-100/70">{((restoreFile?.size ?? 0) / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={resetRestoreFlow} className="p-1 rounded-lg hover:bg-red-500/10"><X className="w-4 h-4 text-red-500" /></button>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="كلمة مرور فك التشفير"
                value={restorePassword}
                onChange={e => setRestorePassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold border"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: 'var(--text-main)' }}
              />
              <div className="flex justify-start">
                <button
                  onClick={() => setRestorePassword('__auto_backup_key__')}
                  className="text-xs font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 opacity-80 hover:opacity-100 transition-opacity bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded"
                >
                  هل هذه نسخة تلقائية من الخادم؟ (إدراج المفتاح)
                </button>
              </div>
            </div>
            <button
              onClick={handleValidate}
              disabled={!restorePassword}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Eye className="w-4 h-4" />
              تحقق من الملف (Dry-run)
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {restoreStep === 'confirm' && validationResult?.isValid && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-500">الملف متوافق</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: 'var(--text-main)' }}>
                <span className="opacity-60">إصدار المخطط:</span>
                <span className="font-bold">{validationResult.schemaVersion}</span>
                <span className="opacity-60">تاريخ التصدير:</span>
                <span className="font-bold">{validationResult.exportDate ? new Date(validationResult.exportDate).toLocaleDateString('ar-LY') : '-'}</span>
                {Object.entries(validationResult.recordCounts).map(([key, count]) => (
                  <span key={key} className="contents">
                    <span className="opacity-60">{key}:</span>
                    <span className="font-bold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs text-red-500 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                تحذير: ستُستبدل جميع البيانات الحالية!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {restoring ? 'جاري الاستعادة...' : 'تأكيد الاستعادة'}
              </button>
              <button
                onClick={resetRestoreFlow}
                className="px-5 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: 'var(--text-main)' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// ═══════════════════════════════════════════════
// Admin Tab
// ═══════════════════════════════════════════════

const AdminTab = ({ isDark }: { isDark: boolean }) => {
  const { archiving, resetting, archiveLogs, softReset, hardReset } = useSettingsStore();
  const [archiveMonths, setArchiveMonths] = useState(6);
  const [hardResetStep, setHardResetStep] = useState(0); // 0=idle, 1=confirm, 2=phrase, 3=password
  const [resetPhrase, setResetPhrase] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  const handleHardReset = async () => {
    const ok = await hardReset(resetPassword, resetPhrase);
    if (ok) {
      setHardResetStep(0);
      setResetPhrase('');
      setResetPassword('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Archive Logs */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Archive className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-base text-slate-800 dark:text-white">أرشفة السجلات</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-blue-100/70 mb-4">
          أرشفة سجلات النشاط القديمة (Soft Archive — لا حذف) لتحسين أداء النظام.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={archiveMonths}
            onChange={e => setArchiveMonths(parseInt(e.target.value))}
            className="px-3 py-2.5 rounded-xl text-sm font-bold border flex-1"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: 'var(--text-main)' }}
          >
            <option value={3}>أقدم من 3 أشهر</option>
            <option value={6}>أقدم من 6 أشهر</option>
            <option value={12}>أقدم من سنة</option>
          </select>
          <button
            onClick={() => archiveLogs(archiveMonths)}
            disabled={archiving}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
          >
            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            أرشفة
          </button>
        </div>
      </GlassCard>

      {/* Soft Reset */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <RotateCcw className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-base text-slate-800 dark:text-white">إعادة ضبط الإعدادات</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-blue-100/70 mb-4">
          إرجاع جميع الإعدادات إلى قيمها الافتراضية دون مسح أي بيانات.
        </p>
        <button
          onClick={softReset}
          disabled={resetting}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          إعادة ضبط الإعدادات
        </button>
      </GlassCard>

      {/* Hard Reset — Full Width */}
      <GlassCard className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <Trash2 className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-black text-base text-red-500">إعادة ضبط المنظومة (تصفير كامل)</h3>
        </div>

        {hardResetStep === 0 && (
          <>
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-sm font-bold text-red-500 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" /> تحذير: عملية لا يمكن التراجع عنها!
              </p>
              <p className="text-xs opacity-60" style={{ color: 'var(--text-main)' }}>
                سيتم مسح كافة البيانات (الشهادات، العينات، خطابات الإحالة، السجلات) مع الاحتفاظ بحسابك فقط. يتم حفظ نسخة احتياطية تلقائياً قبل التنفيذ.
              </p>
            </div>
            <button
              onClick={() => setHardResetStep(1)}
              className="py-3 px-6 rounded-xl font-bold text-sm text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-all"
            >
              أريد المتابعة
            </button>
          </>
        )}

        {hardResetStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
              الخطوة 1/2: اكتب الجملة التالية للتأكيد:
            </p>
            <p className="text-base font-black text-red-500 text-center py-2" style={{ direction: 'rtl' }}>
              "اريد ذلك بالضبط"
            </p>
            <input
              type="text"
              placeholder="اكتب جملة التأكيد هنا..."
              value={resetPhrase}
              onChange={e => setResetPhrase(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold border text-center"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                borderColor: resetPhrase === 'اريد ذلك بالضبط' ? '#10b981' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                color: 'var(--text-main)',
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setHardResetStep(2)}
                disabled={resetPhrase !== 'اريد ذلك بالضبط'}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                التالي
              </button>
              <button onClick={() => { setHardResetStep(0); setResetPhrase(''); }}
                className="px-5 py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: 'var(--text-main)' }}>
                إلغاء
              </button>
            </div>
          </div>
        )}

        {hardResetStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
              الخطوة 2/2: أدخل كلمة المرور الخاصة بك:
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-red-500" />
              <span className="text-xs opacity-60" style={{ color: 'var(--text-main)' }}>التحقق من هويتك قبل التنفيذ</span>
            </div>
            <input
              type="password"
              placeholder="كلمة المرور"
              value={resetPassword}
              onChange={e => setResetPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold border"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: 'var(--text-main)' }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleHardReset}
                disabled={!resetPassword || resetting}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-30 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {resetting ? 'جاري التنفيذ...' : 'تنفيذ التصفير الكامل'}
              </button>
              <button onClick={() => { setHardResetStep(0); setResetPhrase(''); setResetPassword(''); }}
                className="px-5 py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: 'var(--text-main)' }}>
                إلغاء
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
