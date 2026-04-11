import { useAlerts, type Alert } from '../hooks/useAlerts';
import { AlertCircle, ChevronLeft, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale/ar';

export const AlertsWidget = () => {
  const { alerts, isLoading } = useAlerts();

  // Filter for critical/warning alerts that aren't resolved
  const urgentAlerts = alerts
    .filter(a => !a.isResolved)
    .slice(0, 3);

  if (isLoading) return null;
  if (urgentAlerts.length === 0) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
          <AlertCircle className="text-rose-500 animate-pulse" size={20} />
          تنبيهات عاجلة تحتاج انتباهك
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {urgentAlerts.map((alert: Alert) => (
          <div 
            key={alert.id}
            className={`glass-panel p-5 rounded-[2rem] border-l-4 transition-all hover:scale-[1.02] cursor-pointer shadow-lg
              ${alert.severity === 2 ? 'border-rose-500 bg-rose-500/5' : 'border-amber-500 bg-amber-500/5'}`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider
                  ${alert.severity === 2 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                  {alert.severity === 2 ? 'حرج' : 'تحذير'}
                </span>
                <span className="text-[10px] opacity-50 flex items-center gap-1">
                  <Clock size={12} />
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: ar })}
                </span>
              </div>
              <h4 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{alert.title}</h4>
              <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">{alert.message}</p>
              
              <button className="flex items-center gap-1 text-[10px] font-bold text-blue-500 mt-2 hover:underline">
                اتخاذ إجراء <ChevronLeft size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
