import { useAuthStore, hasPermission, Permission } from '../store/useAuthStore';

interface ProtectedProps {
  /** الصلاحية المطلوبة (bitmask value) */
  permission?: number;
  /** الأدوار المسموحة */
  roles?: ('Admin' | 'User' | 'Viewer')[];
  /** هل يتطلب صلاحية التعديل (Editor) */
  requireEditor?: boolean;
  /** المحتوى المعروض عند عدم الصلاحية (اختياري) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * مكون حماية عناصر UI حسب الدور والصلاحيات
 * 
 * @example
 * <ProtectedElement permission={Permission.Users}>
 *   <button>إدارة المستخدمين</button>
 * </ProtectedElement>
 * 
 * <ProtectedElement roles={['Admin']}>
 *   <button>إعدادات النظام</button>
 * </ProtectedElement>
 */
export const ProtectedElement = ({ permission, roles, requireEditor, fallback = null, children }: ProtectedProps) => {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  // Admin always has access
  if (user.role === 'Admin') return <>{children}</>;

  // Check role restriction
  if (roles && !roles.includes(user.role)) return <>{fallback}</>;

  // Check permission bitmask
  if (permission !== undefined && !hasPermission(user.permissions, permission)) return <>{fallback}</>;

  // Check editor requirement
  if (requireEditor && !user.isEditor) return <>{fallback}</>;

  return <>{children}</>;
};
