import { useState, useEffect, useCallback } from 'react';
import { X, User, Shield, Key, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUsersStore, type UserDto, type CreateUserDto, type UpdateUserDto } from '../store/useUsersStore';
import { Permission } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useToastStore } from '../store/useToastStore';
import { useNavigationLock } from '../hooks/useNavigationLock';

interface Props {
  user: UserDto | null; // null = إضافة جديد
  onClose: () => void;
}

const roles = [
  { value: 0, label: 'مشاهد', desc: 'عرض وطباعة فقط' },
  { value: 1, label: 'مستخدم', desc: 'إصدار وتعديل حسب الصلاحيات' },
  { value: 2, label: 'مدير النظام', desc: 'تحكم كامل بجميع الأقسام' },
];

const permissionsList = [
  { key: 'SampleReceptions', value: Permission.SampleReceptions, label: 'استلام العينات', icon: '🧪' },
  { key: 'Certificates', value: Permission.Certificates, label: 'الشهادات', icon: '📜' },
  { key: 'Reports', value: Permission.Reports, label: 'التقارير', icon: '📊' },
  { key: 'Settings', value: Permission.Settings, label: 'الإعدادات', icon: '⚙️' },
  { key: 'AdminProcedures', value: Permission.AdminProcedures, label: 'الإجراءات الإدارية', icon: '🛡️' },
  { key: 'Users', value: Permission.Users, label: 'المستخدمين', icon: '👥' },
];

export const UserFormModal = ({ user, onClose }: Props) => {
  const { createUser, updateUser, checkUsername } = useUsersStore();
  const { isDark } = useUIStore();
  const { lock, unlock } = useNavigationLock();
  const { addToast } = useToastStore();
  const isEditing = !!user;

  // Lock navigation only depends on component lifecycle
  useEffect(() => {
    lock();
    return () => unlock();
  }, [lock, unlock]);

  // Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<number>(user ? (['Viewer', 'User', 'Admin'].indexOf(user.role)) : 1);
  const [isEditor, setIsEditor] = useState(user?.isEditor ?? true);
  const [permissions, setPermissions] = useState<number>(user?.permissions || 0);
  const [specialization, setSpecialization] = useState(user?.specialization || '');

  // Validation state
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Username uniqueness check (debounced)
  const checkUsernameAvailability = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setIsChecking(true);
      const isUnique = await checkUsername(value, user?.id);
      setUsernameAvailable(isUnique);
      setIsChecking(false);
    }, 500),
    [user?.id]
  );

  useEffect(() => {
    if (username !== user?.username) {
      checkUsernameAvailability(username);
    } else {
      setUsernameAvailable(null); // Same as original — skip check
    }
  }, [username]);

  // Permission toggle
  const togglePermission = (perm: number) => {
    setPermissions((prev) => prev ^ perm); // XOR toggle
  };

  // Admin gets all permissions automatically
  const isAdmin = role === 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!fullName.trim()) return setError('الاسم الكامل مطلوب');
    if (!username.trim() || username.length < 3) return setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    if (!isEditing && (!password || password.length < 6)) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    if (isEditing && password && password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    if (usernameAvailable === false) return setError('اسم المستخدم موجود بالفعل');

    setIsSubmitting(true);

    if (isEditing) {
      const dto: UpdateUserDto = {
        fullName: fullName.trim(),
        username: username.trim(),
        password: password || undefined,
        role,
        isEditor,
        permissions: isAdmin ? Permission.All : permissions,
        specialization: specialization.trim() || undefined,
      };
      const result = await updateUser(user!.id, dto);
      if (!result.success) {
        // error is handled by interceptor, but keep local state just in case
        setError(result.error || 'حدث خطأ');
        setIsSubmitting(false);
        return;
      }
    } else {
      const dto: CreateUserDto = {
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        role,
        isEditor,
        permissions: isAdmin ? Permission.All : permissions,
        specialization: specialization.trim() || undefined,
      };
      const result = await createUser(dto);
      if (!result.success) {
        setError(result.error || 'حدث خطأ');
        setIsSubmitting(false);
        return;
      }
    }

    addToast({
      type: 'success',
      message: isEditing ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح'
    });
    setSuccess(true);
    setTimeout(onClose, 800);
  };

  const inputStyle = {
    background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    backdropFilter: 'blur(10px)',
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300/80 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-slate-400/80 dark:hover:scrollbar-thumb-white/20 p-8 rounded-[2.5rem] border-2 shadow-2xl"
        style={{
          background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.15)',
          backdropFilter: 'blur(20px)',
        }}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold flex items-center gap-3 text-slate-800 dark:text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            {isEditing ? `تعديل: ${user?.fullName}` : 'مستخدم جديد'}
          </h2>
          <button
            onClick={onClose}
            data-esc-close="true"
            className="p-2 rounded-xl hover:scale-110 transition-all text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
          {/* Section: بيانات الحساب */}
          <div className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-gray-400 mb-2">
            <User size={16} />
            بيانات الحساب
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-gray-300">الاسم الكامل</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full py-3 px-4 rounded-xl outline-none text-slate-800 dark:text-white text-sm font-bold transition-all focus:ring-2 focus:ring-sky-500/30 placeholder:text-slate-400 dark:placeholder:text-gray-500"
              style={inputStyle}
              placeholder="مثال: أحمد محمد"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-gray-300">اسم المستخدم</label>
            <div className="relative">
              <input
                type="text"
                autoComplete="new-password"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                className="w-full py-3 px-4 pl-10 rounded-xl outline-none text-slate-800 dark:text-white text-sm font-bold transition-all focus:ring-2 focus:ring-sky-500/30 placeholder:text-slate-400 dark:placeholder:text-gray-500"
                style={inputStyle}
                placeholder="مثال: ahmed"
                dir="ltr"
                required
                minLength={3}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {isChecking ? (
                  <Loader2 size={16} className="animate-spin text-sky-500" />
                ) : usernameAvailable === true ? (
                  <CheckCircle size={16} className="text-emerald-500" />
                ) : usernameAvailable === false ? (
                  <AlertCircle size={16} className="text-red-500" />
                ) : null}
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-xs text-red-500 mt-1 font-bold">اسم المستخدم موجود بالفعل</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-gray-300">
              {isEditing ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور'}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 px-4 rounded-xl outline-none text-slate-800 dark:text-white text-sm font-bold transition-all focus:ring-2 focus:ring-sky-500/30 placeholder:text-slate-400 dark:placeholder:text-gray-500"
              style={inputStyle}
              placeholder={isEditing ? 'اتركها فارغة لعدم التغيير' : '6 أحرف على الأقل'}
              dir="ltr"
              required={!isEditing}
              minLength={isEditing ? 0 : 6}
            />
          </div>

          {/* Section: الدور والصلاحيات */}
          <div className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-gray-400 mt-6 mb-2">
            <Shield size={16} />
            الدور والصلاحيات
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-gray-300">الدور</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className="p-3 rounded-xl text-center transition-all"
                  style={{
                    background: role === r.value
                      ? (isDark ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.08)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    border: `1.5px solid ${role === r.value ? '#0ea5e9' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')}`,
                    color: role === r.value ? '#0ea5e9' : (isDark ? '#e2e8f0' : '#475569'),
                  }}
                >
                  <p className="text-sm font-bold">{r.label}</p>
                  <p className={`text-[10px] mt-0.5 font-bold ${role === r.value ? 'text-sky-600 dark:text-sky-500' : 'text-slate-500 dark:text-gray-500'}`}>{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          {!isAdmin ? (
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-gray-300">الصلاحيات</label>
              <div className="grid grid-cols-2 gap-2">
                {permissionsList.map((perm) => {
                  const isOn = (permissions & perm.value) !== 0;
                  return (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() => togglePermission(perm.value)}
                      className="flex items-center gap-2 p-2.5 rounded-xl transition-all text-right"
                      style={{
                        background: isOn
                          ? (isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)')
                          : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                        border: `1px solid ${isOn ? 'rgba(16,185,129,0.3)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')}`,
                        color: isOn ? '#10b981' : (isDark ? '#cbd5e1' : '#475569'),
                      }}
                    >
                      <span className="text-base">{perm.icon}</span>
                      <span className="text-sm font-bold">{perm.label}</span>
                      <div className="mr-auto">
                        <div
                          className="w-8 h-4 rounded-full relative"
                          style={{
                            background: isOn ? '#10b981' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                            transition: 'background 0.2s'
                          }}
                        >
                          <div
                            className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                            style={{ right: isOn ? '3px' : 'auto', left: isOn ? 'auto' : '3px' }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className="p-4 rounded-xl text-center text-sm font-bold"
              style={{
                background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)'}`,
                color: isDark ? '#f87171' : '#ef4444'
              }}
            >
              👑 المدير يمتلك جميع الصلاحيات تلقائياً
            </div>
          )}

          {/* Editor Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
          }}>
            <div className="flex items-center gap-2">
              <Key size={14} className="text-slate-500 dark:text-gray-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-gray-300">صلاحية التعديل</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditor(!isEditor)}
              className="w-10 h-5 rounded-full relative transition-all"
              style={{
                background: isEditor ? '#10b981' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all shadow-sm"
                style={{ right: isEditor ? '4px' : 'auto', left: isEditor ? 'auto' : '4px' }}
              />
            </button>
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-gray-300">التخصص (اختياري)</label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full py-3 px-4 rounded-xl outline-none text-slate-800 dark:text-white text-sm font-bold transition-all focus:ring-2 focus:ring-sky-500/30 placeholder:text-slate-400 dark:placeholder:text-gray-500"
              style={inputStyle}
              placeholder="مثال: مهندس كيميائي"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
              boxShadow: '0 12px 30px rgba(14,165,233,0.3)'
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save size={18} />
                {isEditing ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// Debounce Utility
// ═══════════════════════════════════════
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as any;
}
