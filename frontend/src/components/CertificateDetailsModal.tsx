import React from 'react';
import { X, FileText, Share2, Building2, Globe2, ListChecks, Hash, ShieldCheck, Beaker, Printer, Package, ClipboardCheck } from 'lucide-react';
import type { Certificate } from '../store/useCertificateStore';
import { useUIStore } from '../store/useUIStore';

interface CertificateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate;
}

const CertificateDetailsModal: React.FC<CertificateDetailsModalProps> = ({ isOpen, onClose, certificate }) => {
  const setLocked = useUIStore((state) => state.setLocked);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setLocked(true);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setLocked(false);
    };
  }, [isOpen, onClose, setLocked]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 md:pr-[280px]">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative glass-card bg-white/95 dark:bg-slate-900/90 rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20 dark:border-white/10">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

          {/* Header */}
          <div className="relative px-10 py-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner shadow-indigo-500/20">
                <ShieldCheck className="w-10 h-10 drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                  تفاصيل الشهادة <span className="text-indigo-600 dark:text-indigo-400 font-mono">#{certificate.certificateNumber}</span>
                </h2>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-8 py-3 rounded-full text-lg font-black tracking-wide shadow-lg text-white ${
                    certificate.certificateType === 'استهلاكية' 
                      ? 'bg-gradient-to-l from-indigo-600 to-blue-500 shadow-indigo-500/30' 
                      : 'bg-gradient-to-l from-emerald-600 to-teal-500 shadow-emerald-500/30'
                  }`}>
                    {certificate.certificateType === 'بيئية' ? 'شهادة عينات بيئية' : 'شهادة عينات استهلاكية'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm font-bold bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                    <Hash className="w-4 h-4" />
                    <span>تاريخ الإصدار: {new Date(certificate.issueDate).toLocaleDateString('ar-LY')}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-3 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all duration-300 transform active:scale-90"
            >
              <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Content */}
          <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar relative">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
              {/* 1. Source Data */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <Package className="w-6 h-6 text-indigo-500" />
                  بيانات المصدر والمنشأ
                </h3>
                <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-5 bg-white/40 dark:bg-white/[0.02]">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">الجهة المُرسلة</label>
                    <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                      <Share2 className="w-5 h-5 text-indigo-500" />
                      {certificate.sender}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">المورد</label>
                      <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        {certificate.supplier}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">بلد المنشأ</label>
                      <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                        <Globe2 className="w-5 h-5 text-indigo-500" />
                        {certificate.origin}
                      </div>
                    </div>
                  </div>

                  {(certificate.certificateType === 'بيئية' || certificate.certificateType === 'عينات بيئية') && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">نوع التحليل</label>
                      <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 shadow-inner">
                        <Beaker className="w-5 h-5" />
                        تحليل مبدئى ( دون الوصول لحالة الاتزان )
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Customs Data */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <ClipboardCheck className="w-6 h-6 text-cyan-500" />
                  البيانات الجمركية والمالية
                </h3>
                <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-5 bg-white/40 dark:bg-white/[0.02]">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم طلب التحليل</label>
                    <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-cyan-500/20 shadow-inner font-mono">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      {certificate.sampleReception?.analysisRequestNumber || '---'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم الإقرار الجمركي</label>
                      <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner font-mono">
                        <FileText className="w-5 h-5 text-cyan-500" />
                        {certificate.declarationNumber || '---'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم الإخطار</label>
                      <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner font-mono">
                        <Hash className="w-5 h-5 text-cyan-500" />
                        {certificate.notificationNumber || '---'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم بوليصة الشحن</label>
                      <div className="flex items-center gap-3 text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner font-mono">
                        <ListChecks className="w-5 h-5 text-cyan-500" />
                        {certificate.policyNumber || '---'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم الإيصال المالي</label>
                      <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 shadow-inner font-mono">
                        <Hash className="w-5 h-5" />
                        {certificate.financialReceiptNumber || '---'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Table Section */}
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <Beaker className="w-6 h-6 text-emerald-500" />
                  العينات ونتائج التحليل المخبري
                </h3>
                <span className="bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full text-slate-500 dark:text-gray-400 text-sm font-black border border-slate-200 dark:border-white/10">
                  {certificate.samples.length} عينات
                </span>
              </div>
              
              <div className="glass-card rounded-[2rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl bg-white/30 dark:bg-white/[0.01]">
                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[max-content] border-collapse relative">
                    <thead className="bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-white/10">
                      <tr className="text-slate-900 dark:text-gray-300 text-xs font-black uppercase tracking-widest">
                        <th className="p-5 text-center w-16">م</th>
                        <th className="p-5 text-center">رقم العينة</th>
                        <th className="p-5 text-right w-1/3">وصف البيان الجمركي</th>
                        <th className="p-5 text-center">تاريخ القياس</th>
                        
                        {certificate.certificateType === 'استهلاكية' ? (
                          <th className="p-5 text-center bg-indigo-500/5">النتيجة (Bq/kg-l)</th>
                        ) : (
                          <>
                            <th className="p-5 text-center bg-indigo-500/5 normal-case">K<sub>40</sub></th>
                            <th className="p-5 text-center bg-indigo-500/5 normal-case">Ra<sub>226</sub></th>
                            <th className="p-5 text-center bg-indigo-500/5 normal-case">Th<sub>232</sub></th>
                            <th className="p-5 text-center bg-indigo-500/5 font-black text-indigo-600 dark:text-indigo-400 normal-case">R<sub>aeq</sub></th>
                            <th className="p-5 text-center bg-indigo-500/5 normal-case">Cs<sub>137</sub></th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {certificate.samples.map((sample, idx) => (
                        <tr key={sample.id} className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-200 group border-b border-slate-200 dark:border-white/5 last:border-0">
                          <td className="p-5 text-center">
                            <span className="text-sm font-mono p-2.5 rounded-lg bg-slate-200 text-slate-950 dark:bg-white/5 dark:text-white font-bold">{idx + 1}</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono">{sample.sampleNumber}</span>
                          </td>
                          <td className="p-5 text-right text-slate-700 dark:text-gray-300 font-medium">{sample.description}</td>
                          <td className="p-5 text-center text-slate-500 dark:text-gray-500 font-mono text-sm">
                            {sample.measurementDate ? new Date(sample.measurementDate).toLocaleDateString('en-US') : '---'}
                          </td>
                          
                          {certificate.certificateType === 'استهلاكية' ? (
                            <td className="p-5 text-center font-black text-slate-900 dark:text-white text-lg bg-indigo-500/[0.02]">{sample.result || '---'}</td>
                          ) : (
                            <>
                              <td className="p-5 text-center font-bold text-slate-700 dark:text-gray-400 bg-indigo-500/[0.02]">{sample.isotopeK40 || '-'}</td>
                              <td className="p-5 text-center font-bold text-slate-700 dark:text-gray-400 bg-indigo-500/[0.02]">{sample.isotopeRa226 || '-'}</td>
                              <td className="p-5 text-center font-bold text-slate-700 dark:text-gray-400 bg-indigo-500/[0.02]">{sample.isotopeTh232 || '-'}</td>
                              <td className="p-5 text-center font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/[0.05] text-lg">{sample.isotopeRa || '-'}</td>
                              <td className="p-5 text-center font-bold text-slate-700 dark:text-gray-400 bg-indigo-500/[0.02]">{sample.isotopeCs137 || '-'}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. Signatures Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <span>✍️</span> المراجعة والاعتماد الفني
              </h3>
              <div className="glass-card p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div className="glass-card-subtle p-6 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-inner group">
                    <p className="text-xs font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-3">أخصائي التحليل</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white">{certificate.specialistName || '---'}</p>
                    <div className="h-0.5 w-0 group-hover:w-full bg-indigo-500 mt-4 transition-all duration-500 mx-auto opacity-30"></div>
                  </div>
                  <div className="glass-card-subtle p-6 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-inner group">
                    <p className="text-xs font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-3">رئيس القسم</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white">{certificate.sectionHeadName || '---'}</p>
                    <div className="h-0.5 w-0 group-hover:w-full bg-indigo-500 mt-4 transition-all duration-500 mx-auto opacity-30"></div>
                  </div>
                  <div className="glass-card-subtle p-6 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-inner group">
                    <p className="text-xs font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-3">مدير إدارة القياسات</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white">{certificate.managerName || '---'}</p>
                    <div className="h-0.5 w-0 group-hover:w-full bg-indigo-500 mt-4 transition-all duration-500 mx-auto opacity-30"></div>
                  </div>
                </div>

                {certificate.notes && (
                  <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-white/5">
                    <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <FileText className="w-4 h-4" />
                       ملاحظات إضافية مرئية على الشهادة
                    </label>
                    <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-slate-700 dark:text-amber-200/70 font-medium italic leading-relaxed backdrop-blur-sm shadow-inner">
                      {certificate.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. System Tracking Section */}
            <div className="space-y-6 mt-10">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Globe2 className="w-6 h-6 text-indigo-500" /> مسؤولي النظام
              </h3>
              <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Receiver Info */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">مسؤول استلام العينة (والتاريخ)</label>
                    <div className="flex flex-col justify-center text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                      <span className="text-indigo-600 dark:text-indigo-400 font-black mb-1">{certificate.sampleReception?.createdByName || 'غير متوفر'}</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                        {certificate.sampleReception?.date ? new Date(certificate.sampleReception.date).toLocaleString('ar-LY') : '---'}
                      </span>
                    </div>
                  </div>
                  {/* Issuer Info */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">مسؤول إصدار الشهادة (والتاريخ)</label>
                    <div className="flex flex-col justify-center text-slate-800 dark:text-white font-bold bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                      <span className="text-emerald-600 dark:text-emerald-400 font-black mb-1">{certificate.createdByName || 'المنظومة'}</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                        {certificate.issueDate ? new Date(certificate.issueDate).toLocaleString('ar-LY') : '---'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Footer Actions */}
          <div className="relative px-10 py-8 border-t border-slate-200 dark:border-white/10 flex justify-end gap-5 bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl">
            <button
              onClick={onClose}
              className="px-8 py-3.5 glass-card bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl transition-all duration-300 font-black shadow-sm active:scale-95"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetailsModal;
