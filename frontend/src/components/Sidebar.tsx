import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, Users, Settings, LogOut, LayoutDashboard, 
  Beaker, ShieldAlert, BarChart3, HelpCircle, Info, ChevronRight, Moon, Sun
} from 'lucide-react';
import { useAuthStore, Permission } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { ProtectedElement } from './ProtectedElement';

const bottomNavigation = [
  { name: 'مركز المساعدة', icon: HelpCircle, path: '/app/help' },
  { name: 'عن المنظومة', icon: Info, path: '/app/about' },
];

export const Sidebar = () => {
  const navigation = [
    { name: 'الرئيسية', icon: LayoutDashboard, path: '/app' },
    { name: 'استلام العينات', icon: Beaker, path: '/app/samples', permission: Permission.SampleReceptions },
    { name: 'الشهادات', icon: FileText, path: '/app/certificates', permission: Permission.Certificates },
    { name: 'التقارير', icon: BarChart3, path: '/app/reports', permission: Permission.Reports },
    { name: 'الإجراءات الإدارية', icon: ShieldAlert, path: '/app/procedures', permission: Permission.AdminProcedures },
    { name: 'المستخدمين', icon: Users, path: '/app/users', permission: Permission.Users },
    { name: 'الإعدادات', icon: Settings, path: '/app/settings', permission: Permission.Settings },
  ];

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { isSidebarCollapsed, toggleSidebar, isLocked, isDark, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNavigationBlocked, setShowNavigationBlocked] = useState(false);

  const attemptNavigation = (path: string) => {
    if (isLocked) {
      setShowNavigationBlocked(true);
    } else {
      navigate(path);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        useUIStore.getState().setSidebarCollapsed(true);
      }
    }
  };

  const handleLogout = () => {
    if (isLocked) {
      setShowNavigationBlocked(true);
    } else {
      setShowLogoutConfirm(true);
    }
  }

  const confirmLogout = () => {
    logout();
    navigate('/');
  }

   return (
    <>
    {/* Mobile Backdrop Overlay */}
    {!isSidebarCollapsed && (
      <div 
        className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] transition-opacity duration-300"
        onClick={toggleSidebar}
      />
    )}
    
    <aside 
      className={`fixed md:relative right-0 rounded-[2rem] border shadow-2xl transition-all duration-500 flex flex-col h-[calc(100vh-2rem)] my-4 mr-4 shrink-0 z-[100] md:z-50 ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none -translate-x-12 md:-translate-x-12' : 'w-[260px] md:w-[240px] opacity-100 translate-x-0'}`}
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
        background: isDark 
          ? 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(2,6,23,0.8) 100%)' 
          : 'rgba(255, 255, 255, 0.85)',
        boxShadow: isDark 
          ? '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)' 
          : '0 10px 40px -10px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,1)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)'
      }}
    >
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-[18px] h-16 rounded-l-xl flex items-center justify-center shadow-lg transition-all z-50 border-y border-l hover:-left-5 hover:w-5 group"
        style={{
           background: isDark ? '#0ea5e9' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
           borderColor: isDark ? '#38bdf8' : '#e0f2fe',
           boxShadow: isDark ? '-4px 0 10px rgba(14,165,233,0.3)' : '-4px 0 10px rgba(0,0,0,0.1)'
        }}
        title={isSidebarCollapsed ? "إظهار القائمة" : "إخفاء القائمة"}
      >
        <ChevronRight size={14} className={`text-white transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Logo Area */}
      <div className={`relative flex-1 flex items-center justify-center px-4 py-8 transition-all duration-300 min-h-[140px]`}>
        {!isSidebarCollapsed && (
          <img 
            src="/logo.png" 
            alt="شعار إنجاز" 
            className="w-10/12 h-auto max-h-36 object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>

      {/* Navigation Area */}
      <div className="flex flex-col px-3 pb-4 space-y-1 shrink-0">
        {navigation.map((item) => {
          const isActive = item.path === '/app' 
            ? location.pathname === '/app' 
            : location.pathname.startsWith(item.path);
          return (
             <ProtectedElement key={item.name} permission={item.permission}>
               <button
                onClick={() => attemptNavigation(item.path)}
                className={`w-full flex items-center py-2.5 px-3 rounded-2xl transition-all duration-300 group relative overflow-hidden`}
                style={{ 
                  color: isActive ? (isDark ? '#f8fafc' : '#0369a1') : (isDark ? 'rgba(255,255,255,0.6)' : '#334155'),
                  backgroundColor: isActive ? (isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.08)') : 'transparent',
                  borderColor: isActive ? (isDark ? '#0ea5e9' : 'rgba(14, 165, 233, 0.2)') : 'transparent',
                  borderWidth: '1px',
                  boxShadow: isActive ? (isDark ? '0 0 15px rgba(14, 165, 233, 0.4)' : '0 4px 12px rgba(14, 165, 233, 0.1)') : 'none',
                  fontWeight: isActive ? '700' : '600'
                }}
              >
                {!isActive && <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)' }} />}
                
                <item.icon 
                  className={`h-4 w-4 transition-transform ml-3 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} 
                  style={{ 
                    color: isActive ? (isDark ? '#38bdf8' : '#0ea5e9') : 'currentColor',
                    filter: isActive && isDark ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))' : 'none'
                  }} 
                />
                <span className={`relative z-10 text-[13px] transition-all duration-300 ${isActive ? '' : 'opacity-80'}`}>{item.name}</span>
              </button>
            </ProtectedElement>
          );
        })}

        <div className="h-px w-3/4 mx-auto my-1.5 opacity-40" style={{ background: isDark ? 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 100%)' : 'radial-gradient(circle, rgba(0,0,0,0.15) 0%, transparent 100%)' }}></div>
        
        {bottomNavigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
             <button
               key={item.name}
               onClick={() => attemptNavigation(item.path)}
               className={`w-full flex items-center py-2 px-3 rounded-xl transition-all duration-300 group relative overflow-hidden`}
               style={{ 
                 color: isActive ? (isDark ? '#f8fafc' : '#0c4a6e') : 'var(--text-main)',
                 backgroundColor: isActive ? (isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.9)') : 'transparent',
                 borderColor: isActive ? (isDark ? '#0ea5e9' : 'rgba(255,255,255,1)') : 'transparent',
                 borderWidth: '1px',
                 boxShadow: isActive ? (isDark ? '0 0 15px rgba(14, 165, 233, 0.4)' : '0 4px 15px rgba(0,0,0,0.05)') : 'none',
                 fontWeight: isActive ? '700' : '500'
               }}
            >
              {!isActive && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)' }} />}
              <item.icon className={`h-4 w-4 transition-transform ml-3 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} style={{ color: isActive ? (isDark ? '#38bdf8' : '#0ea5e9') : 'currentColor' }} />
              <span className={`relative z-10 text-[13px] transition-all duration-300 ${isActive ? '' : 'opacity-80'}`}>{item.name}</span>
            </button>
          );
        })}

        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-300 group"
          style={{ color: 'var(--text-main)' }}
        >
          <div className="flex items-center">
            {isDark ? (
              <Sun className="h-4 w-4 transition-transform ml-3 opacity-90 group-hover:scale-110 group-hover:rotate-45" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' }} />
            ) : (
              <Moon className="h-4 w-4 transition-transform ml-3 opacity-90 group-hover:scale-110 group-hover:-rotate-12" style={{ color: '#4f46e5' }} />
            )}
            <span className="relative z-10 text-[13px] font-bold transition-all duration-300 opacity-90">
              {isDark ? 'الوضع المضيء' : 'الوضع المظلم'}
            </span>
          </div>
          <div className="w-8 h-4 rounded-full relative p-0.5 transition-colors border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }}>
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-transform duration-300 ${isDark ? '-translate-x-3.5 bg-white' : 'translate-x-[1px] bg-slate-800'}`} />
          </div>
        </button>

        <button 
          onClick={handleLogout}
          className={`w-full flex items-center py-2 px-3 rounded-xl border border-transparent transition-all duration-300 group`}
          style={{ color: '#ef4444', backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}
        >
          <LogOut className={`h-4 w-4 transition-transform opacity-90 group-hover:opacity-100 ml-3 group-hover:-translate-x-1`} />
          <span className="text-[13px] font-bold opacity-90 group-hover:opacity-100">تسجيل الخروج</span>
        </button>
      </div>
    </aside>

    {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white/95 dark:bg-slate-900/95 max-w-sm w-full p-8 rounded-[2.5rem] border-2 border-slate-300 dark:border-cyan-500/30 shadow-2xl text-center scale-in-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogOut className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">تسجيل الخروج</h3>
          <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
            هل أنت متأكد من رغبتك في مغادرة المنظومة؟
          </p>
          <div className="flex gap-4">
            <button
              onClick={confirmLogout}
              className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
            >
              نعم، خروج
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              data-esc-close="true"
              className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl font-bold transition-all active:scale-95"
            >
              إلغاء
            </button>
          </div>
        </div>
       </div>
    )}

    {/* Navigation Blocked Warning Modal */}
    {showNavigationBlocked && (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white/95 dark:bg-slate-900/95 max-w-sm w-full p-8 rounded-[2.5rem] border-2 border-slate-300 dark:border-amber-500/30 shadow-2xl text-center scale-in-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">تنبيه: نافذة نشطة</h3>
          <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
            يجب إنهاء الإجراء الحالي أو إغلاق النافذة المفتوحة قبل الانتقال إلى قسم آخر.
          </p>
          <button
            onClick={() => setShowNavigationBlocked(false)}
            data-esc-close="true"
            className="w-full py-4 bg-slate-800 hover:bg-slate-900 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-white dark:text-amber-500 rounded-2xl font-bold transition-all shadow-xl active:scale-95"
          >
            فهمت، سأنهي العمل أولاً
          </button>
        </div>
      </div>
    )}
    </>
  );
};

