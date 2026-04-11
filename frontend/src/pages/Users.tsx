import { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, Activity, UserPlus, Search, RefreshCw, Eye, Pencil, Ban, CheckCircle, Crown, UserCheck, UserX } from 'lucide-react';
import { useUsersStore, type UserDto } from '../store/useUsersStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { UserFormModal } from '../components/UserFormModal';
import { AuditLogPanel } from '../components/AuditLogPanel';

const roleBadgeColors: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
  'Admin': { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.3)', darkBg: 'rgba(239,68,68,0.15)', darkText: '#f87171', darkBorder: 'rgba(239,68,68,0.4)' },
  'User': { bg: 'rgba(14,165,233,0.1)', text: '#0ea5e9', border: 'rgba(14,165,233,0.3)', darkBg: 'rgba(14,165,233,0.15)', darkText: '#38bdf8', darkBorder: 'rgba(14,165,233,0.4)' },
  'Viewer': { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.3)', darkBg: 'rgba(168,85,247,0.15)', darkText: '#c084fc', darkBorder: 'rgba(168,85,247,0.4)' },
};

const roleIcons: Record<string, React.ReactNode> = {
  'Admin': <Crown size={12} />,
  'User': <UserCheck size={12} />,
  'Viewer': <Eye size={12} />,
};

export const Users = () => {
  const { users, stats, isLoading, searchQuery, setSearchQuery, fetchUsers, fetchStats } = useUsersStore();
  const currentUser = useAuthStore((s) => s.user);
  const { isDark } = useUIStore();
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<UserDto | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  const handleEdit = (user: UserDto) => {
    setEditingUser(user);
    setShowFormModal(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setShowFormModal(true);
  };

  const handleToggleConfirm = async () => {
    if (!confirmToggle) return;
    const result = await useUsersStore.getState().toggleUserStatus(confirmToggle.id);
    if (!result.success) {
      setToggleError(result.error || 'حدث خطأ');
    } else {
      setConfirmToggle(null);
      setToggleError(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
      {/* ═══ Header ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
            <span className="p-3 glass-card rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-white/10 bg-white/50 dark:bg-slate-800/50">
              <UsersIcon className="w-10 h-10 text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            </span>
            إدارة المستخدمين
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative group">
            <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالحساب أو الاسم..."
              className="glass-card-subtle bg-white/60 dark:bg-slate-900/40 pr-12 pl-4 py-3.5 rounded-2xl text-sm w-80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={() => { fetchUsers(); fetchStats(); }}
            className="p-3.5 glass-card bg-slate-200 hover:bg-slate-300 dark:bg-gray-500/10 dark:hover:bg-gray-500/20 text-slate-700 dark:text-gray-300 rounded-2xl transition-all duration-300 border border-slate-300 dark:border-white/5 shadow-inner active:scale-95"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add New */}
          <button
            onClick={handleAddNew}
            className="group px-6 py-3.5 bg-gradient-to-br from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 text-white rounded-2xl transition-all duration-500 flex items-center gap-3 border border-cyan-400/50 shadow-xl shadow-cyan-500/20 hover:-translate-y-1"
          >
            <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide">مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* ═══ Stats Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'إجمالي المستخدمين', value: stats.totalCount, icon: <UsersIcon className="w-8 h-8" />, colorClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-100 dark:bg-cyan-500/20' },
          { label: 'مستخدم نشط', value: stats.activeCount, icon: <Shield className="w-8 h-8" />, colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-500/20' },
          { label: 'مدراء النظام', value: stats.adminCount, icon: <Crown className="w-8 h-8" />, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-500/20' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card-subtle bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-transparent px-8 py-6 rounded-3xl border border-slate-200 dark:border-white/5 flex items-center gap-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
            <div className={`w-16 h-16 rounded-2xl ${stat.bgClass} flex items-center justify-center ${stat.colorClass} shadow-inner shrink-0`}>
              {stat.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-500 dark:text-gray-400 tracking-wide mb-1">{stat.label}</span>
              <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Tabs & Content ═══ */}
      <div className="glass-card rounded-[2.5rem] border border-slate-300/50 dark:border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl">
        <div className="p-6 border-b border-slate-300 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/[0.02]">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/50'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <UsersIcon className="w-5 h-5" />
              حسابات المستخدمين
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/50'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <Activity className="w-5 h-5" />
              سجل النشاطات
            </button>
          </div>
        </div>

        <div className="overflow-auto max-h-[700px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
          {activeTab === 'users' ? (
            <table className="w-full text-right border-collapse relative">
              <thead className="sticky top-0 z-10 bg-gradient-to-br from-sky-500 to-sky-700 dark:from-blue-900/40 dark:to-blue-900/40 backdrop-blur-sm border-b-2 border-sky-600/50 dark:border-white/10">
                <tr className="text-white dark:text-blue-200 text-sm font-extrabold uppercase tracking-widest text-right">
                  {['المستخدم', 'الدور', 'الحالة', 'صلاحية التعديل', 'تاريخ الإنشاء', 'إجراءات'].map((h) => (
                    <th key={h} className="p-5 font-extrabold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5 bg-white/20 dark:bg-black/20">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-bold">جاري التحميل...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <UsersIcon className="w-12 h-12 text-slate-800 dark:text-white" />
                        <p className="text-lg text-slate-800 dark:text-white">
                          {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد مستخدمين'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleColor = roleBadgeColors[user.role] || roleBadgeColors['Viewer'];
                    const isSelf = user.id === currentUser?.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all duration-200 group text-sm">
                        {/* User Info */}
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg"
                              style={{
                                background: user.isActive ? `linear-gradient(135deg, ${roleColor.text}, ${roleColor.text}cc)` : (isDark ? '#374151' : '#9ca3af'),
                                opacity: user.isActive ? 1 : 0.6
                              }}
                            >
                              {user.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-bold text-base ${user.isActive ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-gray-500'}`}>
                                {user.fullName}
                                {isSelf && <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-gray-300 px-2 py-0.5 rounded-full mr-2 font-medium">(أنت)</span>}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-gray-400" dir="ltr">@{user.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-5">
                          <span
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm"
                            style={{
                              background: isDark ? roleColor.darkBg : roleColor.bg,
                              color: isDark ? roleColor.darkText : roleColor.text,
                              border: `1px solid ${isDark ? roleColor.darkBorder : roleColor.border}`
                            }}
                          >
                            {roleIcons[user.role]}
                            {user.roleDisplayName}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-5 font-bold">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle className="w-4 h-4" /> نشط
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/20">
                              <Ban className="w-4 h-4" /> مجمد
                            </span>
                          )}
                        </td>

                        {/* Is Editor */}
                        <td className="p-5 font-bold">
                          {user.isEditor ? (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 py-1 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400">
                              ✅ نعم
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-gray-500">—</span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="p-5 font-mono text-slate-600 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('ar-LY')}
                        </td>

                        {/* Actions */}
                        <td className="p-5">
                          <div className="flex items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-3 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-xl transition-all shadow-sm active:scale-95"
                              title="تعديل"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => { setConfirmToggle(user); setToggleError(null); }}
                                className={`p-3 rounded-xl transition-all shadow-sm active:scale-95 ${
                                  user.isActive
                                    ? 'bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400'
                                    : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                }`}
                                title={user.isActive ? 'تجميد' : 'تنشيط'}
                              >
                                {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-2 sm:p-4">
              <AuditLogPanel />
            </div>
          )}
        </div>
      </div>

      {/* ═══ User Form Modal ═══ */}
      {showFormModal && (
        <UserFormModal
          user={editingUser}
          onClose={() => { setShowFormModal(false); setEditingUser(null); }}
        />
      )}

      {/* ═══ Toggle Confirm Modal ═══ */}
      {confirmToggle && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="bg-white/95 dark:bg-slate-900/90 max-w-sm w-full p-8 rounded-[2.5rem] border-2 shadow-2xl text-center scale-in-center animate-in zoom-in-95 duration-300"
            style={{
              borderColor: confirmToggle.isActive
                ? (isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)')
                : (isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)')
            }}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmToggle.isActive ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              {confirmToggle.isActive ? <UserX className="w-10 h-10 text-red-500" /> : <UserCheck className="w-10 h-10 text-emerald-500" />}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
              {confirmToggle.isActive ? 'تجميد المستخدم' : 'تنشيط المستخدم'}
            </h3>
            <p className="mb-8 leading-relaxed text-slate-600 dark:text-gray-400">
              {confirmToggle.isActive
                ? `هل أنت متأكد من تجميد حساب "${confirmToggle.fullName}"؟ لن يتمكن من تسجيل الدخول.`
                : `هل أنت متأكد من تنشيط حساب "${confirmToggle.fullName}"؟`
              }
            </p>

            {toggleError && (
              <div className="mb-6 p-4 rounded-xl bg-red-100 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold flex items-center justify-center gap-3">
                <span>{toggleError}</span>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleToggleConfirm}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 text-white ${confirmToggle.isActive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
              >
                {confirmToggle.isActive ? 'نعم، تجميد' : 'نعم، تنشيط'}
              </button>
              <button
                onClick={() => { setConfirmToggle(null); setToggleError(null); }}
                data-esc-close="true"
                className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl font-bold transition-all active:scale-95"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
