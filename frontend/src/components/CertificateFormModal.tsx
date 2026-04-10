import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ShieldCheck, Beaker, Package, ClipboardCheck, History, Plus, Trash2 } from 'lucide-react';
import { useCertificateStore } from '../store/useCertificateStore';
import { useSampleStore } from '../store/useSampleStore';
import { useUIStore } from '../store/useUIStore';
import type { Certificate, CertificateSample } from '../store/useCertificateStore';

interface CertificateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate?: Certificate | null;
  linkedReceptionId?: number | null;
  isFullScreen?: boolean;
}

const CertificateFormModal: React.FC<CertificateFormModalProps> = ({ isOpen, onClose, certificate, linkedReceptionId, isFullScreen }) => {
  const setLocked = useUIStore((state) => state.setLocked);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSafeClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSafeClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setLocked(true);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setLocked(false);
    };
  }, [isOpen, onClose, setLocked, isDirty]);

  // Reset dirty/confirm state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      setShowConfirmClose(false);
    }
  }, [isOpen]);

  const { createCertificate, updateCertificate, isLoading } = useCertificateStore();
  const { receptions } = useSampleStore();
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Certificate>>({
    certificateType: '',
    sender: '',
    supplier: '',
    origin: '',
    analysisType: '',
    declarationNumber: '',
    notificationNumber: '',
    policyNumber: '',
    financialReceiptNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    specialistName: '',
    sectionHeadName: '',
    managerName: '',
    notes: '',
  });

  const [samples, setSamples] = useState<CertificateSample[]>([]);
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Only initialize when opening or when the certificate/reception changes
    if (!isOpen) {
      hasInitialized.current = false;
      return;
    }

    if (hasInitialized.current) return;

    if (certificate) {
      setFormData(certificate);
      // Ensure samples have unique IDs for React keys
      setSamples((certificate.samples || []).map(s => ({ ...s, id: s.id || Date.now() + Math.random() })));
      hasInitialized.current = true;
    } else if (linkedReceptionId) {
      const reception = (receptions || []).find(r => Number(r.id) === Number(linkedReceptionId));
      if (reception) {
        setFormData({
          certificateType: (reception.certificateType || '').includes('استهلاكية') ? 'استهلاكية' : 'بيئية',
          sender: reception.sender || '',
          supplier: reception.supplier || '',
          origin: reception.origin || '',
          analysisType: (reception.certificateType || '').includes('بيئية') ? 'تحليل مبدئى ( دون الوصول لحالة الاتزان )' : '',
          declarationNumber: reception.declarationNumber || '',
          notificationNumber: reception.notificationNumber || '',
          policyNumber: reception.policyNumber || '',
          financialReceiptNumber: reception.financialReceiptNumber || '',
          issueDate: new Date().toISOString(),
          specialistName: '',
          sectionHeadName: '',
          managerName: '',
          notes: '',
          sampleReceptionId: Number(linkedReceptionId),
        });
        
        // safely map samples
        const receptionSamples = Array.isArray(reception.samples) ? reception.samples : [];
        setSamples(receptionSamples.map((s, index) => ({
          id: Date.now() + index + Math.random(),
          root: typeof s.root === 'string' ? parseInt(s.root) : (s.root || (index + 1)),
          sampleNumber: s.sampleNumber || '',
          description: s.description || '',
          measurementDate: '',
          result: '',
        })));
        hasInitialized.current = true;
      }
    }
  }, [isOpen, certificate, linkedReceptionId, receptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSampleChange = (id: number | undefined, field: keyof CertificateSample, value: string) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    setIsDirty(true);
  };

  const removeSampleRow = (id: number | undefined) => {
    setSamples(prev => prev.filter(s => s.id !== id));
    setIsDirty(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-click
    setValidationError(null);

    // Basic Validation
    const requiredFields = ['certificateType', 'sender', 'supplier'];
    const missing = requiredFields.filter(f => !formData[f as keyof Certificate]);
    
    if (missing.length > 0) {
      setValidationError(`يرجى ملء الحقول الإلزامية: ${missing.join(', ')}`);
      return;
    }

    if (samples.length === 0) {
      setValidationError('يجب إضافة عينة واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);

    const finalData = {
      ...formData,
      samples: samples.map(({ id, ...rest }) => rest), // Remove UI-only IDs
    } as Certificate;

    let success = false;
    if (certificate?.id) {
       success = await updateCertificate(certificate.id, finalData);
    } else {
       success = await createCertificate(finalData);
    }

    setIsSubmitting(false);
    if (success) onClose();
  };

  if (!isOpen) return null;

  const renderHeader = (isModal: boolean) => (
    <div className={`relative px-10 py-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl shrink-0 ${!isModal ? 'rounded-t-[2.5rem]' : ''}`}>
      <div className="flex items-center gap-5">
        <div className="p-4 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
          <ShieldCheck className="w-10 h-10 drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {certificate ? 'تعديل بيانات الشهادة' : 'إصدار شهادة تحليل جديدة'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <p className="text-sm text-slate-500 dark:text-gray-500 font-black uppercase tracking-widest">نموذج بيانات الاعتماد الفني</p>
          </div>
        </div>
      </div>
      <button 
        type="button"
        onClick={handleSafeClose} 
        className={!isModal ? "flex items-center gap-3 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl transition-all duration-300 font-black shadow-sm active:scale-95 border border-slate-200 dark:border-white/10" : "group p-3 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all duration-300 transform active:scale-90"}
      >
        {!isModal ? <><X className="w-6 h-6" /> إلغاء والعودة</> : <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />}
      </button>
    </div>
  );

  const formContent = (
    <>
      {/* Form Body */}
      <div className={`p-10 ${isFullScreen ? '' : 'overflow-y-auto custom-scrollbar'} flex-1 relative`}>
        
        {/* Unsaved Changes Confirmation Modal */}
        {showConfirmClose && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="glass-card p-8 rounded-[2rem] w-full max-w-md border-2 border-slate-300 dark:border-amber-500/30 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">تنبيه: تغييرات غير محفوظة</h3>
              <p className="text-slate-600 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                هل أنت متأكد من رغبتك في إغلاق هذه النافذة؟ <br/>
                <span className="text-red-500 font-bold">سيتم فقدان جميع التعديلات التي أجريتها على الشهادة.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => { setShowConfirmClose(false); onClose(); }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95"
                >
                  نعم، إغلاق وتجاهل
                </button>
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 py-3 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white rounded-xl font-bold transition-all active:scale-95"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div className="glass-card bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] mb-10 animate-in slide-in-from-top-4 duration-300">
            <div className="flex gap-4">
              <div className="p-2 bg-red-500/20 rounded-xl text-red-500 h-fit">
                <AlertCircle className="w-6 h-6"/>
              </div>
              <div>
                <h3 className="text-red-500 font-black text-lg mb-1">تنبيه: بيانات غير مكتملة</h3>
                <pre className="text-sm text-red-400 dark:text-red-300 font-bold whitespace-pre-wrap leading-relaxed">{validationError}</pre>
              </div>
            </div>
          </div>
        )}

        <form id="certificate-form" onSubmit={handleSubmit} className="space-y-12">
          
          {/* Section: Type & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.01]">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">نوع الشهادة التحليلية</label>
              <div className="relative">
                <select 
                  disabled={!!linkedReceptionId || !!certificate}
                  className={`w-full p-4 pr-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-black focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-sm appearance-none ${(!!linkedReceptionId || !!certificate) ? 'opacity-70 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : 'cursor-pointer'}`}
                  value={formData.certificateType}
                  onChange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    setFormData(p => ({ 
                      ...p, 
                      certificateType: val,
                      analysisType: val === 'بيئية' ? 'تحليل مبدئى ( دون الوصول لحالة الاتزان )' : (p.analysisType === 'تحليل مبدئى ( دون الوصول لحالة الاتزان )' ? '' : p.analysisType)
                    }));
                  }}
                >
                  <option value="">-- اختر نوع الشهادة --</option>
                  <option value="استهلاكية">شهادة تحليل عينات استهلاكية</option>
                  <option value="بيئية">شهادة تحليل عينات بيئية</option>
                </select>
                <div className="absolute top-0 right-0 h-full flex items-center px-4 pointer-events-none">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                    {formData.certificateType === 'بيئية' ? <Package className="w-5 h-5 text-emerald-500" /> : <Beaker className="w-5 h-5 text-indigo-500" />}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">تاريخ إصدار الشهادة</label>
              <input 
                type={formData.issueDate ? "date" : "text"}
                name="issueDate" 
                placeholder="يوم / شهر / سنة"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => !e.target.value && (e.target.type = "text")}
                value={formData.issueDate?.split('T')[0]} 
                onChange={handleInputChange} 
                dir="ltr" 
                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-black focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-sm" 
              />
            </div>
          </div>

          {/* Section: Basic Data */}
          <div className="space-y-6">
             <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                <span className="p-2 bg-indigo-500/10 rounded-lg"><ClipboardCheck className="w-6 h-6 text-indigo-500" /></span>
                البيانات التعريفية للإحالة
             </h3>
             <div className="glass-card p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.01] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم الإخطار</label>
                  <input type="text" name="notificationNumber" value={formData.notificationNumber} onChange={handleInputChange} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم الإقرار الجمركي</label>
                  <input type="text" name="declarationNumber" value={formData.declarationNumber} onChange={handleInputChange} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all" />
                </div>
                {formData.certificateType === 'بيئية' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">نوع التحليل</label>
                    <input type="text" name="analysisType" value={formData.analysisType} onChange={handleInputChange} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" placeholder="مثال: تحليل إشعاعي كامل" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">الجهة المرسلة</label>
                  <input type="text" name="sender" value={formData.sender} onChange={handleInputChange} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">الشركة الموردة</label>
                  <input type="text" name="supplier" value={formData.supplier} onChange={handleInputChange} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رقم الإيصال المالي</label>
                  <input type="text" name="financialReceiptNumber" value={formData.financialReceiptNumber} onChange={handleInputChange} className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all" />
                </div>
             </div>
          </div>

          {/* Section: Dynamic Samples */}
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                  <span className="p-2 bg-emerald-500/10 rounded-lg"><Plus className="w-6 h-6 text-emerald-500" /></span>
                  العينات والنتائج الفنية
                </h3>
             </div>
             
             <div className="glass-card rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.01] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                      <tr className="text-slate-900 dark:text-gray-300 text-xs font-black uppercase tracking-widest">
                        <th className="p-5 w-16">ت</th>
                        <th className="p-5">رقم العينة</th>
                        <th className="p-5">البيان</th>
                        <th className="p-5 text-center">تاريخ القياس</th>
                        {formData.certificateType === 'استهلاكية' ? (
                          <th className="p-5 text-center">نتيجة التحليل</th>
                        ) : (
                          <>
                            <th className="p-5 text-center normal-case">K<sub>40</sub></th>
                            <th className="p-5 text-center normal-case">Ra<sub>226</sub></th>
                            <th className="p-5 text-center normal-case">Th<sub>232</sub></th>
                            <th className="p-5 text-center normal-case">R<sub>aeq</sub></th>
                            <th className="p-5 text-center normal-case">Cs<sub>137</sub></th>
                          </>
                        )}
                        <th className="p-5 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {samples.map((sample, index) => (
                        <tr key={sample.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 text-center">
                            <span className="p-2 bg-slate-200 dark:bg-white/5 rounded-lg text-xs font-mono font-bold">{index + 1}</span>
                          </td>
                          <td className="p-4">
                            <input type="text" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20" value={sample.sampleNumber} onChange={(e) => handleSampleChange(sample.id, 'sampleNumber', e.target.value)} />
                          </td>
                          <td className="p-4">
                            <input type="text" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/20" value={sample.description} onChange={(e) => handleSampleChange(sample.id, 'description', e.target.value)} />
                          </td>
                          <td className="p-4">
                            <input 
                              type={sample.measurementDate ? "date" : "text"}
                              placeholder="يوم / شهر / سنة"
                              onFocus={(e) => (e.target.type = "date")}
                              onBlur={(e) => !e.target.value && (e.target.type = "text")}
                              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white font-bold text-center focus:ring-2 focus:ring-emerald-500/20" 
                              dir="ltr"
                              value={sample.measurementDate?.split('T')[0]} 
                              onChange={(e) => handleSampleChange(sample.id, 'measurementDate', e.target.value)} 
                            />
                          </td>
                          
                          {formData.certificateType === 'استهلاكية' ? (
                            <td className="p-3">
                              <input 
                                list="analysis-results-list"
                                type="text" 
                                className="w-full p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-emerald-600 dark:text-emerald-400 font-black text-lg shadow-inner focus:ring-4 focus:ring-emerald-500/20" 
                                value={sample.result || ''} 
                                onChange={(e) => handleSampleChange(sample.id, 'result', e.target.value)} 
                                placeholder="اختر أو اكتب النتيجة..."
                              />
                              <datalist id="analysis-results-list">
                                <option value="خالية من العناصر المشعة المصنعة" />
                              </datalist>
                            </td>
                          ) : (
                            <>
                              <td className="p-2"><input type="text" className="w-20 p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl text-center text-slate-800 dark:text-white font-bold" value={sample.isotopeK40 || ''} onChange={(e) => handleSampleChange(sample.id, 'isotopeK40', e.target.value)} /></td>
                              <td className="p-2"><input type="text" className="w-20 p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl text-center text-slate-800 dark:text-white font-bold" value={sample.isotopeRa226 || ''} onChange={(e) => handleSampleChange(sample.id, 'isotopeRa226', e.target.value)} /></td>
                              <td className="p-2"><input type="text" className="w-20 p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl text-center text-slate-800 dark:text-white font-bold" value={sample.isotopeTh232 || ''} onChange={(e) => handleSampleChange(sample.id, 'isotopeTh232', e.target.value)} /></td>
                              <td className="p-2"><input type="text" className="w-20 p-2.5 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-white/20 rounded-xl text-center text-indigo-600 dark:text-indigo-400 font-black" value={sample.isotopeRa || ''} onChange={(e) => handleSampleChange(sample.id, 'isotopeRa', e.target.value)} /></td>
                              <td className="p-2"><input type="text" className="w-20 p-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl text-center text-slate-800 dark:text-white font-bold" value={sample.isotopeCs137 || ''} onChange={(e) => handleSampleChange(sample.id, 'isotopeCs137', e.target.value)} /></td>
                            </>
                          )}
                          <td className="p-3 text-center">
                             <button type="button" onClick={() => removeSampleRow(sample.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all" title="حذف العينة">
                               <Trash2 className="w-5 h-5" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {samples.length === 0 && (
                    <div className="p-20 text-center text-slate-400 dark:text-gray-600">
                      <div className="flex flex-col items-center gap-4">
                         <History className="w-16 h-16 opacity-10" />
                         <p className="text-xl font-bold italic">لم يتم إضافة أي عينات بعد، ابدأ بإضافة بيانات التحليل</p>
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* Section: Signatures */}
          <div className="space-y-6">
             <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                <span className="p-2 bg-slate-500/10 rounded-lg"><History className="w-6 h-6 text-slate-500" /></span>
                الاعتماد الفني والملاحظات الختامية
             </h3>
             <div className="glass-card p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">أخصائي التحليل</label>
                       <input type="text" list="specialist-list" name="specialistName" value={formData.specialistName} onChange={handleInputChange} placeholder="اختر أو اكتب الاسم" className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all font-sans" />
                       <datalist id="specialist-list">
                          <option value="م. عبد الله سالم" />
                          <option value="ك. فاطمة أحمد" />
                          <option value="م. محمود علي" />
                       </datalist>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">رئيس القسم</label>
                       <input type="text" list="section-head-list" name="sectionHeadName" value={formData.sectionHeadName} onChange={handleInputChange} placeholder="اختر أو اكتب الاسم" className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all font-sans" />
                       <datalist id="section-head-list">
                          <option value="م. سالم الفيتوري" />
                          <option value="د. محمد عبد السلام" />
                       </datalist>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">مدير إدارة القياسات</label>
                       <input type="text" list="manager-list" name="managerName" value={formData.managerName} onChange={handleInputChange} placeholder="اختر أو اكتب الاسم" className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all font-sans" />
                       <datalist id="manager-list">
                          <option value="م. علي عبد الله" />
                          <option value="د. خالد فرج" />
                       </datalist>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mr-1">ملاحظات إضافية مرئية على الشهادة</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none shadow-inner" placeholder="أي تفاصيل فنية إضافية يُراد إظهارها في تقرير التحليل..."></textarea>
                </div>
             </div>
          </div>

        </form>
      </div>

      {/* Footer Actions */}
      <div className="relative px-10 py-8 border-t border-slate-200 dark:border-white/10 flex justify-end gap-5 bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl shrink-0">
        <button
          onClick={handleSafeClose}
          disabled={isLoading}
          className="px-8 py-3.5 glass-card bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl transition-all duration-300 font-black shadow-sm active:scale-95 disabled:opacity-50"
        >
          إلغاء العملية
        </button>
        <button
          type="submit"
          form="certificate-form"
          disabled={isLoading || samples.length === 0}
          className="group px-12 py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl transition-all duration-300 font-extrabold flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
        >
          <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {isLoading ? 'جاري المعالجة...' : certificate ? 'حفظ التغييرات الفنية' : 'إصدار الشهادة النهائية'}
        </button>
      </div>
    </>
  );

  if (isFullScreen) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full bg-white/95 dark:bg-slate-900/90 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 flex flex-col min-h-[800px]" dir="rtl">
        {renderHeader(false)}
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300" 
        onClick={(e) => {
          e.stopPropagation();
          handleSafeClose();
        }}
      />

      {/* Modal Container */}
      <div className="relative glass-card bg-white/95 dark:bg-slate-900/90 rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20 dark:border-white/10 flex flex-col max-h-[92vh]">
        {renderHeader(true)}
        {formContent}
      </div>
    </div>
  );
};

export default CertificateFormModal;
