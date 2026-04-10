import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Beaker, FileText, Plus, Trash2 } from 'lucide-react';
import { useNavigationLock } from '../hooks/useNavigationLock';

import type { Sample, SampleReception } from '../store/useSampleStore';

interface EditReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reception: SampleReception | null;
  onSave: (updatedReception: SampleReception) => Promise<boolean>;
}

export const EditReceptionModal: React.FC<EditReceptionModalProps> = ({ 
  isOpen, 
  onClose, 
  reception, 
  onSave 
}) => {
  const { lock, unlock } = useNavigationLock();
  const [formData, setFormData] = useState<SampleReception | null>(null);
  const [currentSamples, setCurrentSamples] = useState<Sample[]>([]);
  const [newSample, setNewSample] = useState<Sample>({ sampleNumber: '', description: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [isManualSender, setIsManualSender] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const senderOptions = [
    "مركز الرقابة على الأغذية والأدوية - بنغازي",
    "مركز الرقابة على الأغذية والأدوية - البطنان",
    "مركز الرقابة على الأغذية والأدوية - مصراتة",
    "مركز الرقابة على الأغذية والأدوية - الخمس",
    "مركز الرقابة على الأغذية والأدوية - طرابلس",
    "مركز الرقابة على الأغذية والأدوية - زوارة"
  ];

  // Check if form has changes
  const isDirty = formData && reception ? (
    formData.analysisRequestNumber !== reception.analysisRequestNumber ||
    (formData.notificationNumber || '') !== (reception.notificationNumber || '') ||
    (formData.declarationNumber || '') !== (reception.declarationNumber || '') ||
    (formData.supplier || '') !== (reception.supplier || '') ||
    formData.sender !== reception.sender ||
    (formData.origin || '') !== (reception.origin || '') ||
    (formData.policyNumber || '') !== (reception.policyNumber || '') ||
    (formData.financialReceiptNumber || '') !== (reception.financialReceiptNumber || '') ||
    formData.certificateType !== reception.certificateType ||
    formData.date !== reception.date ||
    JSON.stringify(currentSamples) !== JSON.stringify(reception.samples || [])
  ) : false;

  useEffect(() => {
    if (reception) {
      setFormData({ ...reception });
      setCurrentSamples(reception.samples ? [...reception.samples] : []);
      
      const isPredefined = senderOptions.includes(reception.sender);
      setIsManualSender(!isPredefined && reception.sender !== '');
      
      // Reset confirmation and error states when opening a new record
      setShowConfirmClose(false);
      setErrors([]);
    }
  }, [reception]);

  // Lock navigation when modal is open
  useEffect(() => {
    if (isOpen) {
      lock();
    } else {
      unlock();
    }
    return () => unlock();
  }, [isOpen, lock, unlock]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && !isSaving && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, formData, currentSamples, isSaving]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmClose(false);
      setErrors([]);
    }
  }, [isOpen]);

  if (!isOpen || !formData) return null;

  const handleCancel = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleAddSample = () => {
    if (newSample.sampleNumber && newSample.description) {
      setCurrentSamples([...currentSamples, newSample]);
      setNewSample({ sampleNumber: '', description: '' });
    }
  };

  const handleRemoveSample = (index: number) => {
    setCurrentSamples(currentSamples.filter((_, i) => i !== index));
  };

  const handleUpdateSample = (index: number, field: keyof Sample, value: string) => {
    const updated = [...currentSamples];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentSamples(updated);
  };

  const validateForm = () => {
    const missing = [];
    if (!formData.analysisRequestNumber) missing.push("رقم طلب التحليل");
    if (!formData.sender) missing.push("الجهة المرسلة");
    if (!formData.certificateType) missing.push("نوع العينات");
    if (currentSamples.length === 0) missing.push("قائمة العينات (يجب إضافة عينة واحدة على الأقل)");
    
    setErrors(missing);
    return missing.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    const success = await onSave({
      ...formData,
      samples: currentSamples
    });
    
    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      setErrors(["حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى."]);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
      <div className="glass-card w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5">
          <div className="flex items-center gap-3 text-right">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <Beaker className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">تعديل بيانات استلام عينة</h2>
          </div>
          <button 
            onClick={handleCancel}
            className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-red-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

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
                <span className="text-red-500 font-bold">سيتم فقدان جميع التعديلات التي أجريتها.</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all"
                >
                  نعم، إغلاق وتجاهل
                </button>
                <button
                  onClick={() => setShowConfirmClose(false)}
                  className="flex-1 py-3 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white rounded-xl font-bold transition-all"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {errors.length > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <ul className="text-red-400 text-sm font-bold">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* Main Data Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-sky-700 dark:text-cyan-400 flex items-center gap-2 border-b border-sky-500/20 dark:border-cyan-500/20 pb-2">
              <FileText className="w-5 h-5" />
              البيانات الأساسية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">رقم طلب التحليل</label>
                <input 
                  type="text"
                  value={formData.analysisRequestNumber}
                  onChange={e => setFormData({...formData, analysisRequestNumber: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">رقم الإخطار</label>
                <input 
                  type="text"
                  value={formData.notificationNumber || ''}
                  onChange={e => setFormData({...formData, notificationNumber: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">تاريخ الاستلام</label>
                <input 
                  type="date"
                  value={formData.date ? formData.date.split('T')[0] : ''}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">الجهة المرسلة</label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={isManualSender ? "manual" : formData.sender}
                    onChange={(e) => {
                      if (e.target.value === "manual") {
                        setIsManualSender(true);
                        setFormData({ ...formData, sender: '' });
                      } else {
                        setIsManualSender(false);
                        setFormData({ ...formData, sender: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                  >
                    {senderOptions.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{opt}</option>)}
                    <option value="manual" className="bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 font-bold">+ إدخال يدوي...</option>
                  </select>
                  {isManualSender && (
                    <input 
                      type="text"
                      value={formData.sender}
                      onChange={e => setFormData({...formData, sender: e.target.value})}
                      placeholder="اسم الجهة المرسلة..."
                      className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">الجهة الموردة</label>
                <input 
                  type="text"
                  value={formData.supplier || ''}
                  onChange={e => setFormData({...formData, supplier: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">بلد المنشأ</label>
                <input 
                  type="text"
                  value={formData.origin || ''}
                  onChange={e => setFormData({...formData, origin: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">نوع العينات</label>
                <select 
                  value={formData.certificateType}
                  onChange={e => setFormData({...formData, certificateType: e.target.value})}
                  className="w-full bg-cyan-100 dark:bg-cyan-900/40 border-2 border-cyan-500 dark:border-cyan-400 rounded-xl px-4 py-3 text-cyan-900 dark:text-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition-all font-bold tracking-wide shadow-md"
                >
                  <option value="عينات بيئية" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">عينات بيئية</option>
                  <option value="عينات استهلاكية" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">عينات استهلاكية</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">رقم الإقرار الجمركي</label>
                <input 
                  type="text"
                  value={formData.declarationNumber || ''}
                  onChange={e => setFormData({...formData, declarationNumber: e.target.value})}
                  placeholder="أدخل رقم الإقرار..."
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">رقم بوليصة الشحن</label>
                <input 
                  type="text"
                  value={formData.policyNumber || ''}
                  onChange={e => setFormData({...formData, policyNumber: e.target.value})}
                  placeholder="أدخل رقم البوليصة..."
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold mr-1">رقم الإيصال المالي</label>
                <input 
                  type="text"
                  value={formData.financialReceiptNumber || ''}
                  onChange={e => setFormData({...formData, financialReceiptNumber: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Beaker className="w-5 h-5" />
                قائمة العينات
              </div>
              <span className="text-xs bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full">{currentSamples.length} عينات</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-100/80 dark:bg-white/5 p-6 rounded-3xl border border-slate-300 dark:border-white/10 shadow-sm">
              <div className="md:col-span-1 space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold">رقم العينة</label>
                <input 
                  type="text"
                  value={newSample.sampleNumber}
                  onChange={e => setNewSample({...newSample, sampleNumber: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleAddSample()}
                  className="w-full bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-center font-mono shadow-inner"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-slate-700 dark:text-gray-400 text-xs font-bold">الوصف / البيان</label>
                <input 
                  type="text"
                  value={newSample.description}
                  onChange={e => setNewSample({...newSample, description: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleAddSample()}
                  className="w-full bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-inner"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleAddSample}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  إضافة
                </button>
              </div>
            </div>

            <div className="border border-slate-300 dark:border-white/10 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto shadow-sm">
              <table className="w-full text-right bg-white dark:bg-white/[0.02]">
                <thead className="sticky top-0 bg-slate-200/80 dark:bg-slate-900 border-b border-slate-300 dark:border-white/10">
                  <tr className="text-slate-700 dark:text-gray-400 text-xs font-bold">
                    <th className="p-4 text-center w-16">م</th>
                    <th className="p-4 text-center w-32">رقم العينة</th>
                    <th className="p-4">وصف العينة</th>
                    <th className="p-4 text-center w-20">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {currentSamples.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 group transition-colors">
                      <td className="p-4 text-center text-cyan-600 dark:text-cyan-400 font-mono font-bold">{i + 1}</td>
                      <td className="p-4 text-center">
                        <input 
                          type="text"
                          value={s.sampleNumber}
                          onChange={e => handleUpdateSample(i, 'sampleNumber', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-cyan-500/50 outline-none text-center font-mono text-slate-900 dark:text-white py-1 transition-all"
                          placeholder="رقم العينة..."
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text"
                          value={s.description}
                          onChange={e => handleUpdateSample(i, 'description', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-emerald-500/50 outline-none text-slate-900 dark:text-white py-1 transition-all"
                          placeholder="وصف العينة..."
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleRemoveSample(i)}
                          className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="حذف العينة"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-200 dark:border-white/10 flex justify-end gap-4 bg-white/50 dark:bg-black/20">
          <button 
            onClick={handleCancel}
            className="px-8 py-3 rounded-2xl font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            إلغاء التغييرات
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
};
