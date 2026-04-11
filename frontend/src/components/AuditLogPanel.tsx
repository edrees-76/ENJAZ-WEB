import { useEffect } from 'react';
import { Calendar, User, Activity, RefreshCw, TrendingUp, Pencil, LogIn, UserPlus, Shield, Ban, CheckCircle, Beaker, FileText, Send, Trash2 } from 'lucide-react';
import { useUsersStore } from '../store/useUsersStore';
import { useUIStore } from '../store/useUIStore';

const actionIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  // Auth
  'تسجيل دخول': { icon: <LogIn size={14} />, color: '#10b981' },
  'تسجيل خروج': { icon: <LogIn size={14} />, color: '#6366f1' },
  'فشل تسجيل الدخول': { icon: <Ban size={14} />, color: '#ef4444' },
  'محاولة دخول لحساب مجمد': { icon: <Shield size={14} />, color: '#f97316' },
  // Users
  'إضافة مستخدم': { icon: <UserPlus size={14} />, color: '#0ea5e9' },
  'تعديل مستخدم': { icon: <Pencil size={14} />, color: '#f59e0b' },
  'تجميد مستخدم': { icon: <Ban size={14} />, color: '#ef4444' },
  'تنشيط مستخدم': { icon: <CheckCircle size={14} />, color: '#10b981' },
  // Samples
  'استلام عينات': { icon: <Beaker size={14} />, color: '#06b6d4' },
  'تعديل بيانات عينة': { icon: <Pencil size={14} />, color: '#f59e0b' },
  'حذف عينة': { icon: <Trash2 size={14} />, color: '#ef4444' },
  // Certificates
  'إصدار شهادة': { icon: <FileText size={14} />, color: '#10b981' },
  'تعديل شهادة': { icon: <Pencil size={14} />, color: '#f59e0b' },
  // Referral Letters
  'إصدار رسالة إحالة': { icon: <Send size={14} />, color: '#8b5cf6' },
  'حذف رسالة إحالة': { icon: <Trash2 size={14} />, color: '#ef4444' },
};

const getActionIcon = (action: string) => {
  for (const [key, val] of Object.entries(actionIcons)) {
    if (action.includes(key)) return val;
  }
  return { icon: <Activity size={14} />, color: '#64748b' };
};

export const AuditLogPanel = () => {
  const { auditLogs, auditStats, auditFilters, isLoading, users, fetchAuditLogs, fetchAuditStats, setAuditFilters } = useUsersStore();
  const { isDark } = useUIStore();

  useEffect(() => {
    fetchAuditLogs();
    fetchAuditStats();
  }, [auditFilters]);

  // Use pure Tailwind classes for the glassmorphism layout, dropping the old inline styles.
  const glassPanelClass = "glass-card bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm";

  return (
    <div className="space-y-6">
      {/* ═══ Stats Row ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'أنشطة اليوم', value: auditStats.activitiesToday, icon: <Activity size={18} />, colorClass: 'text-sky-500', bgClass: 'bg-sky-500/10' },
          { label: 'تعديلات اليوم', value: auditStats.modificationsToday, icon: <TrendingUp size={18} />, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
          { label: 'الأكثر نشاطاً', value: auditStats.mostActiveUser || '—', icon: <User size={18} />, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10', isText: true },
        ].map((stat) => (
          <div key={stat.label} className={`${glassPanelClass} p-5 hover:scale-[1.02] transition-transform`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className={`font-black ${stat.isText ? 'text-lg' : 'text-3xl'} ${stat.colorClass}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgClass} ${stat.colorClass}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Filters + Timeline ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className={`lg:col-span-1 p-6 space-y-5 ${glassPanelClass}`}>
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Calendar size={18} className="text-cyan-500" />
            الفلاتر
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-gray-300 mb-1.5">من تاريخ</label>
              <input
                type="date"
                lang="en-GB"
                value={auditFilters.startDate || ''}
                onChange={(e) => setAuditFilters({ startDate: e.target.value || undefined })}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-right font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-gray-300 mb-1.5">إلى تاريخ</label>
              <input
                type="date"
                lang="en-GB"
                value={auditFilters.endDate || ''}
                onChange={(e) => setAuditFilters({ endDate: e.target.value || undefined })}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-right font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 dark:text-gray-300 mb-1.5">المستخدم</label>
              <select
                value={auditFilters.userId || ''}
                onChange={(e) => setAuditFilters({ userId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-all outline-none"
              >
                <option value="">الكل</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { fetchAuditLogs(); fetchAuditStats(); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-cyan-500 to-cyan-700 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                تحديث
              </button>
              <button
                onClick={() => setAuditFilters({ userId: undefined, startDate: undefined, endDate: undefined })}
                className="flex-[0.6] py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-all"
              >
                مسح
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className={`lg:col-span-3 p-6 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 ${glassPanelClass}`}>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
             <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
               <Activity size={18} className="text-indigo-500" />
               سجل الأنشطة والمراقبة
             </h3>
             <span className="text-sm font-semibold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 px-3 py-1 rounded-full">
               {auditLogs.length} نشاط
             </span>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-cyan-500" />
              <p className="text-base font-bold text-slate-600 dark:text-gray-400">جاري تحميل السجل...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-20">
              <Activity size={48} className="mx-auto mb-4 text-slate-300 dark:text-white/10" />
              <p className="text-base font-bold text-slate-500 dark:text-gray-500">لا توجد نشاطات مسجلة ضمن هذه الفلاتر</p>
            </div>
          ) : (
            <div className="space-y-4 pr-1">
              {auditLogs.map((log) => {
                const { icon, color } = getActionIcon(log.action);
                const time = new Date(log.timestamp);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-all hover:shadow-md group"
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110"
                      style={{ background: `${color}15`, color }}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-extrabold" style={{ color }}>{log.action}</span>
                        {log.userName && (
                          <>
                            <span className="text-slate-400 dark:text-gray-600 font-bold">—</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-gray-300">{log.userName}</span>
                          </>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-sm font-medium text-slate-500 dark:text-gray-400 truncate">
                          {log.details}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-left shrink-0 bg-slate-50 dark:bg-black/20 p-2 rounded-lg border border-slate-100 dark:border-white/5 hidden sm:block">
                      <p className="text-[11px] font-extrabold text-slate-600 dark:text-gray-400 mb-0.5">
                        {time.toLocaleDateString('ar-LY')}
                      </p>
                      <p className="text-[12px] font-bold text-cyan-600 dark:text-cyan-400" dir="ltr">
                        {time.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

