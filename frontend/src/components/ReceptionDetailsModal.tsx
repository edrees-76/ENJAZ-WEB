import React, { useEffect, useRef } from 'react';
import { 
  X, FileText, Hash, Clock, User,
  Truck, Globe, Tag, Calendar, 
  ShieldCheck, Info 
} from 'lucide-react';
import type { SampleReception } from '../store/useSampleStore';
import { useUIStore } from '../store/useUIStore';

interface ReceptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reception: SampleReception | null;
}

export const ReceptionDetailsModal: React.FC<ReceptionDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  reception 
}) => {
  const setLocked = useUIStore((state) => state.setLocked);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use Escape to close and Enter to close in details view
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setLocked(true);
      // Focus the modal for Tab support
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setLocked(false);
    };
  }, [isOpen, onClose, setLocked]);

  if (!isOpen || !reception) return null;

  const isEnvironmental = reception.certificateType === 'عينات بيئية';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5">
          <div className="flex items-center gap-3 text-right">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-right">تفاصيل استلام العينات</h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-mono text-right">ID: #{reception.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-red-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Metadata Bar (User & Time) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-700 dark:text-gray-500 font-bold uppercase tracking-wider">مستلم العينة</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{reception.createdByName || 'غير معروف'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-700 dark:text-gray-500 font-bold uppercase tracking-wider">تاريخ ووقت الاستلام بالمنظومة</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                  {reception.createdAt ? new Date(reception.createdAt).toLocaleString('ar-LY') : 'غير متوفر'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Info Column */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 px-2 border-r-4 border-blue-500">
                  البيانات الأساسية
                </h3>
                <div className="space-y-3 px-2">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Hash className="w-4 h-4" /> رقم طلب التحليل
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{reception.analysisRequestNumber}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Tag className="w-4 h-4" /> رقم الإخطار
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{reception.notificationNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Calendar className="w-4 h-4" /> تاريخ الاستلام
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                       {reception.date ? new Date(reception.date).toLocaleDateString('ar-LY') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Info className="w-4 h-4" /> نوع العينات
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${
                      isEnvironmental 
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-500/20' 
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-indigo-500/20'
                    }`}>
                      {reception.certificateType}
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 px-2 border-r-4 border-blue-500">
                  بيانات الجهات
                </h3>
                <div className="space-y-3 px-2">
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-[11px] text-slate-700 dark:text-gray-500 font-bold flex items-center gap-1">
                      <Globe className="w-3 h-3" /> الجهة المرسلة
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">{reception.sender}</span>
                  </div>
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-[11px] text-slate-700 dark:text-gray-500 font-bold flex items-center gap-1">
                      <Truck className="w-3 h-3" /> الجهة الموردة
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">{reception.supplier || '-'}</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Secondary Info Column */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 px-2 border-r-4 border-blue-500">
                  البيانات المالية والجمركية
                </h3>
                <div className="space-y-3 px-2">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Tag className="w-4 h-4" /> رقم الإقرار الجمركي
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{reception.declarationNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Tag className="w-4 h-4" /> رقم بوليصة الشحن
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{reception.policyNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Tag className="w-4 h-4" /> الإيصال المالي
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">{reception.financialReceiptNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-700 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Globe className="w-4 h-4" /> بلد المنشأ
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{reception.origin || '-'}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 px-2 border-r-4 border-blue-500">
                  حالة النظام
                </h3>
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-400/60 font-bold uppercase tracking-wider">حالة الشهادة</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{reception.status || 'لم يتم إصدار شهادة'}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Samples List */}
          <section className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-r-4 border-cyan-500 px-2 leading-none">
              قائمة العينات المشمولة
              <span className="text-xs font-bold bg-cyan-500 text-white px-2 py-0.5 rounded-full mr-2">{reception.samples.length}</span>
            </h3>
            
            <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-right bg-white/40 dark:bg-white/[0.02]">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr className="text-slate-700 dark:text-gray-400 text-xs font-bold">
                    <th className="p-4 text-center w-16">م</th>
                    <th className="p-4 text-center w-40">رقم العينة</th>
                    <th className="p-4">وصف العينة / البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {reception.samples.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 text-center text-cyan-600 font-mono font-bold">{i + 1}</td>
                      <td className="p-4 text-center text-slate-800 dark:text-white font-mono font-bold">{s.sampleNumber}</td>
                      <td className="p-4 text-slate-700 dark:text-gray-300 text-sm">{s.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end bg-slate-50/50 dark:bg-black/20">
          <button 
            ref={closeButtonRef}
            onClick={onClose}
            className="px-10 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
