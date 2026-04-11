import { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle, ChevronLeft } from 'lucide-react';
import { useAlerts, type Alert } from '../hooks/useAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale/ar';

export const NotificationBell = () => {
  const { alerts, unreadCount, markAsRead } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSeverityIcon = (severity: number) => {
    switch (severity) {
      case 2: return <AlertCircle className="text-rose-500" size={18} />;
      case 1: return <AlertTriangle className="text-amber-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 2: return 'bg-rose-500/10 border-rose-500/20';
      case 1: return 'bg-amber-500/10 border-amber-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-12 h-12 glass-card rounded-2xl text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all outline-none"
      >
        <Bell size={24} className={unreadCount > 0 ? "animate-bell" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-14 w-80 max-h-[500px] glass-card rounded-3xl shadow-2xl overflow-hidden z-[100] border border-white/40 dark:border-slate-700/50 flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>التنبيهات</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 font-medium">
              {unreadCount} غير مقروءة
            </span>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <CheckCircle className="text-emerald-500" size={24} />
                </div>
                <p className="text-sm opacity-60">لا توجد تنبيهات حالياً</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {alerts.map((alert: Alert) => (
                  <div 
                    key={alert.id}
                    onClick={() => {
                        markAsRead(alert.id);
                        // Deep link logic could go here
                    }}
                    className={`p-4 border-b border-slate-100 dark:border-slate-800 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 flex gap-3 ${!alert.isResolved ? 'opacity-100' : 'opacity-60'}`}
                  >
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${getSeverityColor(alert.severity)}`}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 text-right">
                        <span className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{alert.title}</span>
                      </div>
                      <p className="text-xs opacity-70 leading-relaxed text-right">{alert.message}</p>
                      <span className="text-[10px] opacity-40 mt-1 text-right">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ar })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <button 
             className="p-3 text-center text-xs font-bold text-blue-500 hover:bg-blue-500/10 transition-colors border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
             onClick={() => {/* Navigate to All-Alerts if needed */}}
          >
            عرض كافة التنبيهات
            <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
