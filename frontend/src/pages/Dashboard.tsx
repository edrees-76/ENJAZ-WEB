import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Menu, Clock, CalendarDays } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { Outlet, useLocation } from 'react-router-dom';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useSettingsStore } from '../store/useSettingsStore';

const DateTimeWidget = ({ username }: { username: string }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('ar-LY', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center gap-6 px-6 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-2xl shadow-sm h-16">
      {/* User Info */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold">
           {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
           <span className="text-xs opacity-70" style={{ color: 'var(--text-main)' }}>مرحباً بك</span>
           <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{username}</span>
        </div>
      </div>
      
      <div className="w-px h-8 bg-slate-300 dark:bg-slate-700 opacity-50"></div>

      {/* Date */}
      <div className="flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
         <CalendarDays className="text-blue-500" size={18} />
         <span className="text-sm font-medium">{dateString}</span>
      </div>

      <div className="w-px h-8 bg-slate-300 dark:bg-slate-700 opacity-50"></div>

      {/* Time */}
      <div className="flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
         <Clock className="text-emerald-500" size={18} />
         <span className="text-sm font-bold tracking-wider" dir="ltr">{timeString}</span>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const isSidebarCollapsed = useUIStore(state => state.isSidebarCollapsed);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('showWelcome') === 'true') {
      setShowWelcomeMessage(true);
      sessionStorage.removeItem('showWelcome');
    }
  }, []);

  useEffect(() => {
    if (showWelcomeMessage) {
      const timer = setTimeout(() => setShowWelcomeMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeMessage]);

  // Session timeout — auto-logout after 10 minutes of inactivity
  useSessionTimeout();

  // Font Size Activation
  const fetchUserSettings = useSettingsStore(state => state.fetchUserSettings);
  const fontSizeScale = useSettingsStore(state => state.userSettings?.fontSizeScale ?? 1.0);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontSizeScale}px`;
  }, [fontSizeScale]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find the top-most modal close button or a general cancel button
        const closeButton = document.querySelector('[data-esc-close="true"]') as HTMLButtonElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="flex bg-transparent h-screen relative overflow-hidden transition-colors duration-500">
      {/* 3D Floating Spheres Background */}
      <div className="float-sphere w-[500px] h-[500px] bg-sky-400/20 top-[-10%] left-[-10%]" style={{ zIndex: 0 }}></div>
      <div className="float-sphere w-96 h-96 bg-indigo-500/10 bottom-[-5%] right-[10%]" style={{ animationDelay: '-7s', zIndex: 0 }}></div>

      <Sidebar />
      
      <main className={`flex-1 flex flex-col relative z-10 transition-all duration-500 h-full overflow-hidden`}>
        {/* Global Dashboard Header (Prevents Collisions) */}
        <header className="w-full flex justify-between items-center py-6 px-6 shrink-0">
          <div className="flex-1 flex justify-start">
             {/* Conditionally reveal a static toggle button here if sidebar is collapsed */}
             {isSidebarCollapsed && (
               <button 
                 onClick={toggleSidebar}
                 className="flex items-center justify-center w-16 h-16 glass-card rounded-2xl text-sky-500 shadow-lg hover:scale-105 transition-all border border-sky-500/30 group"
                 title="إظهار القائمة الجانبية"
               >
                 <Menu size={24} className="group-hover:scale-110 transition-transform" />
               </button>
             )}
          </div>
          {isHomePage && (
            <div className="flex-1 flex justify-end">
               <DateTimeWidget username={user?.username || 'مدير النظام'} />
            </div>
          )}
        </header>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-20">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Professional Welcome Overlay */}
      {showWelcomeMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-500"
             style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="flex flex-col items-center justify-center gap-5 p-12 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] animate-in zoom-in-95 duration-500 border border-white/20 bg-white/95 dark:bg-slate-900/95"
               style={{ 
                 backdropFilter: 'blur(25px)'
               }}>
            <div className="w-24 h-24 flex items-center justify-center mb-2">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--text-main)' }}>مرحباً بك مجدداً</h2>
              <p className="text-xl font-bold opacity-80" style={{ color: 'var(--text-main)' }}>
                 {user?.username}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
