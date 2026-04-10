import { useState, useEffect } from 'react';
import { X, CheckSquare, Hash, FileSearch } from 'lucide-react';
import { useSampleStore } from '../store/useSampleStore';
import { useUIStore } from '../store/useUIStore';

interface ReceptionSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (receptionId: number) => void;
}

export default function ReceptionSearchModal({ isOpen, onClose, onSelect }: ReceptionSearchModalProps) {
  const [searchCriteria, setSearchCriteria] = useState('الكل');
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const receptions = useSampleStore((state) => state.receptions);
  const fetchReceptions = useSampleStore((state) => state.fetchReceptions);
  const setLocked = useUIStore((state) => state.setLocked);

  // Effect for Keyboard bindings and UI Locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && selectedId) onSelect(selectedId);
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setLocked(true); // Lock sidebar navigation
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setLocked(false); // Unlock sidebar navigation
    };
  }, [isOpen, selectedId, onClose, onSelect, setLocked]);

  // Effect strictly for initializing modal state when it OPENS
  useEffect(() => {
    if (isOpen) {
      fetchReceptions();
      setSearchText('الكل'); // Reset to default filter
      setSelectedId(null); // Clear previous selection
    }
  }, [isOpen, fetchReceptions]);
  const pendingReceptions = receptions.filter(r => 
    r.status === 'قيد التحليل' || 
    r.status === 'لم يتم إصدار شهادة' || 
    !r.status
  );

  const filteredReceptions = pendingReceptions.filter(r => {
    if (!searchText) return false; // Hide results by default
    const term = searchText.toLowerCase();
    
    switch (searchCriteria) {
      case 'رقم العينة':
        return r.samples.some(s => s.sampleNumber.toLowerCase().includes(term));
      case 'رقم الإخطار':
        return r.notificationNumber?.toLowerCase().includes(term);
      case 'رقم الإقرار':
        return r.declarationNumber?.toLowerCase().includes(term);
      case 'الجهة المرسلة':
        return r.sender.toLowerCase().includes(term);
      case 'المورد':
        return r.supplier?.toLowerCase().includes(term);
      case 'الكل':
      default:
        return (
          r.sender.toLowerCase().includes(term) ||
          r.supplier?.toLowerCase().includes(term) ||
          r.notificationNumber?.toLowerCase().includes(term) ||
          r.declarationNumber?.toLowerCase().includes(term) ||
          r.samples.some(s => s.sampleNumber.toLowerCase().includes(term))
        );
    }
  });

  // Removed handleSearch as logic is now live

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:pr-[280px]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative glass-card bg-white/95 dark:bg-slate-900/90 rounded-[2.5rem] shadow-2xl w-full max-w-7xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20 dark:border-white/10 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="relative px-8 py-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner">
              <FileSearch className="w-8 h-8 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">البحث عن سجل استلام</h2>
              <p className="text-sm text-slate-500 dark:text-gray-500 font-bold">جلب بيانات الإحالة لإصدار الشهادة</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="group p-2.5 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-300 transform active:scale-90"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Search Context */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          
          <div className="glass-card-subtle p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              
              {/* Criteria Selector */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  معيار البحث
                </label>
                <select 
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all appearance-none shadow-sm cursor-pointer"
                  value={searchCriteria}
                  onChange={(e) => setSearchCriteria(e.target.value)}
                >
                  <option value="الكل" className="bg-white dark:bg-slate-900">الكل</option>
                  <option value="رقم العينة" className="bg-white dark:bg-slate-900">رقم العينة</option>
                  <option value="رقم الإخطار" className="bg-white dark:bg-slate-900">رقم الإخطار</option>
                  <option value="رقم الإقرار" className="bg-white dark:bg-slate-900">رقم الإقرار</option>
                  <option value="الجهة المرسلة" className="bg-white dark:bg-slate-900">الجهة المرسلة</option>
                  <option value="المورد" className="bg-white dark:bg-slate-900">المورد</option>
                </select>
              </div>

              {/* Value Input */}
              <div className="md:col-span-9 space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-500" />
                  قيمة المعيار البحثي
                </label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600 shadow-sm"
                  placeholder="ابدأ الكتابة للبحث الفوري..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setSelectedId(null);
                  }}
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl bg-white/40 dark:bg-white/[0.01]">
            <div className="overflow-x-auto">
              <table className="w-full text-right min-w-[max-content] border-collapse relative">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-white/10">
                  <tr className="text-slate-900 dark:text-gray-300 text-xs font-black uppercase tracking-widest">
                    <th className="p-4 text-right">الجهة المرسلة</th>
                    <th className="p-4 text-right">المورد المورد</th>
                    <th className="p-4 text-center">رقم الإخطار</th>
                    <th className="p-4 text-center">النوع</th>
                    <th className="p-4 text-center">العينات</th>
                    <th className="p-4 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {filteredReceptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <FileSearch className="w-16 h-16 text-slate-800 dark:text-white" />
                          <p className="text-xl text-slate-800 dark:text-white font-black italic">
                            {!searchText 
                              ? "ابدأ الكتابة للبحث عن سجلات الاستلام..." 
                              : `لا توجد نتائج تطابق "${searchText}"...`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReceptions.map((reception) => (
                      <tr 
                        key={reception.id} 
                        onClick={() => reception.id && setSelectedId(reception.id)}
                        className={`transition-all duration-300 cursor-pointer border-b border-slate-200 dark:border-white/5 last:border-0 group ${selectedId === reception.id ? 'bg-emerald-500/10 dark:bg-emerald-500/20 ring-2 ring-emerald-500/50' : 'hover:bg-slate-100 dark:hover:bg-white/[0.03]'}`}
                      >
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white">{reception.sender}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-gray-400">{reception.supplier || '-'}</td>
                        <td className="p-4 text-center text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{reception.notificationNumber || '-'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${
                            reception.certificateType === 'استهلاكية' 
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30' 
                              : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                          }`}>
                            {reception.certificateType}
                          </span>
                        </td>
                        <td className="p-4 text-center text-sm font-black text-slate-800 dark:text-white">
                           <span className="bg-slate-200 dark:bg-white/10 px-3 py-1 rounded-lg">{reception.samples.length}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-3 py-1.5 rounded-xl font-black text-sm tracking-widest border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 whitespace-nowrap inline-block shadow-sm">
                            {reception.status || 'قيد المعالجة'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative px-8 py-6 border-t border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 glass-card bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl transition-all duration-300 font-black shadow-sm active:scale-95"
          >
            تراجع
          </button>
          
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('>>> CONFIRM BUTTON CLICKED. selectedId:', selectedId);
              if (selectedId) onSelect(selectedId);
            }}
            disabled={!selectedId}
            className={`flex items-center gap-3 px-10 py-3.5 text-white rounded-2xl font-extrabold transition-all duration-300 shadow-xl
              ${selectedId 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 scale-100 hover:scale-[1.02]' 
                : 'bg-slate-300 dark:bg-gray-800 text-slate-500 cursor-not-allowed opacity-50'}`}
          >
            <CheckSquare className="w-6 h-6" />
            <span>تأكيد الاختيار</span>
          </button>
        </div>
      </div>
    </div>
  );
}
