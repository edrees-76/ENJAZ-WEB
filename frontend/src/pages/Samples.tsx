import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Beaker,
  Plus,
  Trash2,
  ChevronRight,
  FileText,
  AlertCircle,
  Truck,
  Globe,
  Tag,
  Hash,
  Activity,
  Leaf,
  Lock,
  Save
} from 'lucide-react';
import { useSampleStore } from '../store/useSampleStore';
import { useNavigationLock } from '../hooks/useNavigationLock';
import { EditReceptionModal } from '../components/EditReceptionModal';
import { ReceptionDetailsModal } from '../components/ReceptionDetailsModal';

const toLocalDateString = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

export const Samples = () => {
  const { fetchReceptions, addReception, receptions, loading: isStoreLoading, updateReception } = useSampleStore();
  const { lock, unlock } = useNavigationLock();
  const [searchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedReceptionIndex, setSelectedReceptionIndex] = useState<number | null>(null);
  const [isManualSender, setIsManualSender] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sampleToDeleteIndex, setSampleToDeleteIndex] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'none' | 'done'>('all');

  // Main Reception Data
  const [formData, setFormData] = useState({
    analysisRequestNumber: '',
    notificationNumber: '',
    declarationNumber: '',
    supplier: '',
    sender: '',
    origin: '',
    policyNumber: '',
    financialReceiptNumber: '',
    certificateType: '',
    date: toLocalDateString(),
  });

  const senderOptions = [
    "مركز الرقابة على الأغذية والأدوية - بنغازي",
    "مركز الرقابة على الأغذية والأدوية - البطنان",
    "مركز الرقابة على الأغذية والأدوية - مصراتة",
    "مركز الرقابة على الأغذية والأدوية - الخمس",
    "مركز الرقابة على الأغذية والأدوية - طرابلس",
    "مركز الرقابة على الأغذية والأدوية - زوارة"
  ];

  // Individual Samples in the Grid
  const [currentSamples, setCurrentSamples] = useState<{ sampleNumber: string, description: string, root: string }[]>([]);
  const [newSample, setNewSample] = useState({ sampleNumber: '', description: '', root: '' });

  const isFormDirty = 
    formData.analysisRequestNumber !== '' ||
    formData.notificationNumber !== '' ||
    formData.declarationNumber !== '' ||
    formData.supplier !== '' ||
    formData.sender !== '' ||
    formData.origin !== '' ||
    formData.policyNumber !== '' ||
    formData.financialReceiptNumber !== '' ||
    formData.certificateType !== '' ||
    currentSamples.length > 0;



  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchReceptions();
      } catch (err) {
        console.error('Failed to fetch receptions:', err);
      }
    };
    
    loadData();
    
    // Auto-open form if requested via URL
    if (searchParams.get('action') === 'add') {
      setShowAddForm(true);
    }
    
    // Load draft if exists
    import('../lib/db').then(({ getDraft }) => {
      getDraft('draft-reception-new').then(draft => {
        if (draft && draft.data) {
          setFormData(draft.data.formData || {
            analysisRequestNumber: '',
            notificationNumber: '',
            declarationNumber: '',
            supplier: '',
            sender: '',
            origin: '',
            policyNumber: '',
            financialReceiptNumber: '',
            certificateType: '',
            date: toLocalDateString(),
          });
          setCurrentSamples(draft.data.currentSamples || []);
          setShowAddForm(true); // Open form if there's a draft
        }
      });
    });
  }, []);

  // Auto-save Debounce Effect
  useEffect(() => {
    if (!showAddForm || !isFormDirty) return;
    
    const timeoutId = setTimeout(() => {
      import('../lib/db').then(({ saveDraft }) => {
        saveDraft('draft-reception-new', { formData, currentSamples });
      });
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [formData, currentSamples, isFormDirty, showAddForm]);

  // Smart Navigation Lock: Only lock if form has data
  useEffect(() => {
    if (showAddForm && isFormDirty) {
      lock();
    } else {
      unlock();
    }
  }, [isFormDirty, showAddForm, lock, unlock]);

  const handleAddSample = () => {
    if (newSample.sampleNumber && newSample.description) {
      setCurrentSamples([...currentSamples, newSample]);
      setNewSample({ sampleNumber: '', description: '', root: '' });
    }
  };

  const handleRemoveSample = (index: number) => {
    setSampleToDeleteIndex(index);
    setShowDeleteConfirm(true);
  };

  const handleCancelProcess = () => {
    setShowAddForm(false);
    setShowCancelConfirm(false);
    unlock();
    setFormData({
      analysisRequestNumber: '',
      notificationNumber: '',
      declarationNumber: '',
      supplier: '',
      sender: '',
      origin: '',
      policyNumber: '',
      financialReceiptNumber: '',
      certificateType: '',
      date: toLocalDateString(),
    });
    setCurrentSamples([]);
    setNewSample({ sampleNumber: '', description: '', root: '' });
    setFormErrors([]);
    setIsManualSender(false);
    setShowCancelConfirm(false);
    // Delete draft on cancel
    import('../lib/db').then(({ deleteDraft }) => deleteDraft('draft-reception-new'));
  };

  const handleConfirmDelete = () => {
    if (sampleToDeleteIndex !== null) {
      setCurrentSamples(currentSamples.filter((_, i) => i !== sampleToDeleteIndex));
      setSampleToDeleteIndex(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const missingFields: string[] = [];
    if (!formData.analysisRequestNumber) missingFields.push("رقم طلب التحليل");
    if (!formData.notificationNumber) missingFields.push("رقم الإخطار");
    if (!formData.certificateType) missingFields.push("نوع العينات");
    if (!formData.sender) missingFields.push("الجهة المرسلة");
    if (!formData.supplier) missingFields.push("الجهة الموردة");
    if (!formData.origin) missingFields.push("بلد المنشأ");
    if (!formData.declarationNumber) missingFields.push("رقم الإقرار الجمركي");
    if (!formData.policyNumber) missingFields.push("رقم بوليصة الشحن");


    if (missingFields.length > 0) {
      setFormErrors(missingFields);
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const success = await addReception({
      ...formData,
      samples: currentSamples,
    });

    if (success) {
      if (success === 'queued') {
         alert('الإنترنت غير متصل حالياً. تم حفظ بيانات الاستلام محلياً في جهازك وسيتم مزامنتها مع الخادم تلقائياً فور عودة الاتصال.');
      }
      
      // Remove draft upon successful queue or save
      import('../lib/db').then(({ deleteDraft }) => deleteDraft('draft-reception-new'));

      setIsManualSender(false);
      setFormErrors([]);
      setFormData({
        analysisRequestNumber: '',
        notificationNumber: '',
        declarationNumber: '',
        supplier: '',
        sender: '',
        origin: '',
        policyNumber: '',
        financialReceiptNumber: '',
        certificateType: '',
        date: toLocalDateString(),
      });
        setCurrentSamples([]);
      fetchReceptions();
      setShowAddForm(false);
      unlock();
    } else {
      setFormErrors(['فشل في حفظ البيانات. تأكد من تشغيل الخادم وإعادة المحاولة.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-3 glass-card rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-white/10">
              <Beaker className="w-10 h-10 text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            </span>
            قسم استلام العينات
          </h1>

        </div>

         {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="group px-8 py-4 bg-gradient-to-br from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 text-white rounded-2xl transition-all duration-500 flex items-center gap-3 border border-sky-400/50 shadow-xl shadow-sky-500/20 hover:-translate-y-1"
          >
            <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide">تسجيل استلام جديد</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (isFormDirty) {
                setShowCancelConfirm(true);
              } else {
                handleCancelProcess();
              }
            }}
            data-esc-close="true"
            className="px-8 py-4 glass-card bg-slate-200 hover:bg-slate-300 dark:bg-gray-500/10 dark:hover:bg-gray-500/20 text-slate-700 dark:text-gray-300 rounded-2xl transition-all duration-300 flex items-center gap-3 border border-slate-300 dark:border-white/5 shadow-inner"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="text-lg font-bold tracking-wide">إلغاء العملية</span>
          </button>
        )}
      </div>

      {showAddForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden backdrop-blur-3xl border border-slate-300/50 dark:border-white/10 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                البيانات الرئيسية
              </h2>

              {/* Validation Modal */}
              {formErrors.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                  <div className="glass-card p-8 rounded-3xl w-full max-w-md border-2 border-slate-300 dark:border-red-500/30 shadow-2xl shadow-red-500/10 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-6 pb-4 border-b border-red-500/20">
                      <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-2xl">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">تنبيه: بيانات ناقصة</h3>
                        <p className="text-sm opacity-80">يرجى مراجعة الحقول التالية:</p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {formErrors.map((err, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-300 dark:border-white/5">
                          <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                          <span className="font-medium">{err}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => setFormErrors([])}
                      data-esc-close="true"
                      className="w-full py-4 bg-slate-800 hover:bg-slate-900 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-white dark:text-red-400 rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                      فهمت، سأقوم بالتصحيح
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel Confirmation remains global as it affects the whole process */}
              {showCancelConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                  <div className="bg-white/95 dark:bg-slate-900/90 max-w-md w-full p-8 rounded-[2.5rem] border-2 border-slate-300 dark:border-cyan-500/30 shadow-2xl text-center scale-in-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">تأكيد إلغاء العملية</h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
                      هل أنت متأكد من رغبتك في إلغاء تسجيل هذه الإحالة؟ <br/> <span className="text-red-500 font-bold">سيتم حذف كافة البيانات التي أدخلتها.</span>
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={handleCancelProcess}
                        className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                      >
                        نعم، إلغاء
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        data-esc-close="true"
                        className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl font-bold transition-all active:scale-95"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Row 1 */}
                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      رقم طلب التحليل
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.analysisRequestNumber}
                      onChange={(e) => setFormData({ ...formData, analysisRequestNumber: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                      placeholder="AD-XXXX-2026"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      رقم الإخطار
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.notificationNumber}
                      onChange={(e) => setFormData({ ...formData, notificationNumber: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      نوع العينات
                    </label>
                    <select
                      required
                      value={formData.certificateType}
                      onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
                      className="w-full bg-cyan-100 dark:bg-cyan-900/40 border-2 border-cyan-500 dark:border-cyan-400 rounded-xl px-4 py-3.5 text-cyan-900 dark:text-cyan-100 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition-all font-bold tracking-wide shadow-md"
                    >
                      <option value="" disabled hidden>اختر نوع العينات...</option>
                      <option value="عينات بيئية" className="text-slate-800 dark:text-white bg-white dark:bg-slate-800">عينات بيئية</option>
                      <option value="عينات استهلاكية" className="text-slate-800 dark:text-white bg-white dark:bg-slate-800">عينات استهلاكية</option>
                    </select>
                  </div>

                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center justify-between gap-2">

                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                        الجهة المرسلة
                      </div>
                      <span className="text-red-500 text-lg font-bold leading-none">*</span>
                    </label>
                    <div className="space-y-3">
                      <select
                        required
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
                        className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all invalid:text-slate-400 dark:invalid:text-gray-500 text-sm"
                      >
                        <option value="" disabled hidden>اختر الجهة المرسلة...</option>
                        {senderOptions.map((opt) => (
                          <option key={opt} value={opt} className="text-slate-800 dark:text-white bg-white dark:bg-slate-800 py-2">
                            {opt}
                          </option>
                        ))}
                        <option value="manual" className="text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-800 font-bold border-t">
                          + إدخال جهة أخرى يدوياً...
                        </option>
                      </select>

                      {isManualSender && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <input
                            type="text"
                            required
                            autoFocus
                            value={formData.sender}
                            onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                            placeholder="اكتب اسم الجهة المرسلة هنا..."
                            className="w-full bg-cyan-50/50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-500/20 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      الجهة الموردة
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      بلد المنشأ
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                      placeholder="أدخل بلد المنشأ"
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      رقم الإقرار الجمركي
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.declarationNumber}
                      onChange={(e) => setFormData({ ...formData, declarationNumber: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      رقم بوليصة الشحن
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.policyNumber}
                      onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 dark:text-gray-400 text-sm font-medium mr-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
                      رقم الإيصال المالي
                      <Lock className="w-3 h-3 opacity-50" title="يتم تعبئته تلقائياً" />
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.financialReceiptNumber}
                      className="w-full bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-500 dark:text-gray-400 cursor-not-allowed focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500 font-mono"
                      placeholder="يتم التعبئة تلقائياً"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-300 dark:border-white/10">
                  <button
                    type="submit"
                    hidden
                    id="submit-form"
                  ></button>
                </div>
              </form>
            </div>

            {/* Samples DataGrid Section */}
            <div className="glass-card p-8 rounded-3xl border border-slate-300/50 dark:border-white/10 shadow-2xl relative overflow-hidden">
              
              {/* Internal Delete Confirmation - Scoped to this card only */}
              {showDeleteConfirm && (
                <div className="absolute inset-0 z-[50] flex items-center justify-center p-6 bg-slate-100/40 dark:bg-slate-950/60 backdrop-blur-lg animate-in fade-in duration-500 rounded-3xl">
                  <div className="bg-white/95 dark:bg-slate-900/95 max-w-sm w-full p-8 rounded-[2rem] border-2 border-slate-300 dark:border-cyan-500/30 shadow-2xl text-center animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">حذف العينة؟</h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                      هل أنت متأكد من حذف هذه العينة؟ <br/> <span className="opacity-70 text-xs">(لا يمكن التراجع عن الحذف)</span>
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirmDelete}
                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                      >
                        حذف
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setSampleToDeleteIndex(null);
                        }}
                        data-esc-close="true"
                        className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                      >
                        تراجع
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  <Beaker className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  قائمة العينات المشمولة
                </h2>
                <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-4 py-1 rounded-full text-sm font-bold border border-emerald-200 dark:border-emerald-500/20">
                  {currentSamples.length} عينات
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-end gap-16 mb-12">
                <div className="flex-[1] space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-gray-400 block mr-1">رقم العينة</label>
                  <div className="glass-card-subtle p-1 rounded-2xl border border-slate-300 dark:border-white/10 shadow-sm">
                    <input
                      type="text"
                      value={newSample.sampleNumber}
                      onChange={(e) => setNewSample({ ...newSample, sampleNumber: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSample()}
                      className="w-full bg-slate-50/50 dark:bg-white/5 rounded-xl px-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-center font-mono text-lg"
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="flex-[3] space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-gray-400 block mr-1">الوصف / بيان العينة</label>
                  <div className="glass-card-subtle p-1 rounded-2xl border border-slate-300 dark:border-white/10 shadow-sm">
                    <input
                      type="text"
                      value={newSample.description}
                      onChange={(e) => setNewSample({ ...newSample, description: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSample()}
                      className="w-full bg-slate-50/50 dark:bg-white/5 rounded-xl px-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-lg"
                      placeholder=""
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddSample}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  <Plus className="w-4 h-4" />
                  إضافة عينة
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-white/5">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4 text-center w-20">م</th>
                      <th className="px-6 py-4 text-center">رقم العينة</th>
                      <th className="px-6 py-4 text-right">وصف العينة</th>
                      <th className="px-6 py-4 text-center w-28">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {currentSamples.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-500 dark:text-gray-600 italic">
                          لا توجد عينات مدخلة في القائمة حالياً
                        </td>
                      </tr>
                    ) : (
                      currentSamples.map((sample, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200 group border-b border-slate-200 dark:border-white/5 last:border-0 text-sm">
                          <td className="px-6 py-4 text-center text-cyan-600 dark:text-cyan-500 font-bold font-mono">{index + 1}</td>
                          <td className="px-6 py-4 text-center text-slate-800 dark:text-white font-mono">{sample.sampleNumber}</td>
                          <td className="px-6 py-4 text-right text-slate-600 dark:text-gray-300">{sample.description}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center">
                              <button
                                onClick={() => handleRemoveSample(index)}
                                className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all duration-300 opacity-40 group-hover:opacity-100 transform group-hover:scale-110"
                                title="حذف العينة"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar Info / Actions */}
          <div className="space-y-6">
            <div className="glass-card p-8 rounded-3xl border border-slate-300/50 dark:border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-emerald-400 to-cyan-500"></div>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">حفظ إحالة</h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-gray-400">إجمالي العينات</span>
                  <span className="text-slate-800 dark:text-white font-bold">{currentSamples.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-gray-400">تاريخ الاستلام</span>
                  <span className="text-slate-800 dark:text-white font-bold">{formData.date}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-gray-400">المستخدم</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">Admin User</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => document.getElementById('submit-form')?.click()}
                  disabled={currentSamples.length === 0}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-extrabold transition-all duration-500 shadow-xl
                    ${currentSamples.length > 0
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 scale-100 hover:scale-[1.02]'
                      : 'bg-slate-200 dark:bg-gray-800 text-slate-400 dark:text-gray-500 cursor-not-allowed border border-slate-300 dark:border-none'}`}
                >
                  <Save className="w-5 h-5" />
                  حفظ في قاعدة البيانات
                </button>
              </div>
            </div>

            <div className="mt-8 p-6 bg-amber-100 dark:bg-amber-500/5 rounded-3xl border-2 border-amber-300 dark:border-white/10 shadow-xl ring-1 ring-amber-500/10">
              <div className="flex gap-4">
                <div className="h-12 w-12 glass-card bg-white dark:bg-amber-500/20 rounded-2xl flex shrink-0 items-center justify-center shadow-sm">
                  <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-amber-900 dark:text-amber-400 font-extrabold text-lg">تنبيه هام جداً</h4>
                  <p className="text-amber-800 dark:text-amber-200/60 text-sm font-medium leading-relaxed">
                    يرجى من المستخدم الكريم التأكد من مطابقة أرقام العينات المدخلة في الجدول أعلاه مع واقع العينات المتسلمة فعلياً لضمان سلامة البيانات وحفظها بشكل صحيح.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* List of Previous Receptions (The Dashboard of Samples) */}
          
          {/* Pagination Logic */}
          {(() => {
            let validReceptions = Array.isArray(receptions) ? receptions.filter(r => r != null) : [];
            
            if (statusFilter === 'done') {
              validReceptions = validReceptions.filter(r => r.status === 'تم إصدار شهادة');
            } else if (statusFilter === 'none') {
              validReceptions = validReceptions.filter(r => r.status !== 'تم إصدار شهادة');
            }
            
            const totalPages = Math.max(1, Math.ceil(validReceptions.length / itemsPerPage));
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            const currentReceptions = validReceptions.slice(indexOfFirstItem, indexOfLastItem);
            
            return (
              <div className="glass-card rounded-[2.5rem] border border-slate-300/50 dark:border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl">
                <div className="p-6 border-b border-slate-300 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/[0.02]">
                  
                  {/* Statistics Cards */}
                  <div className="flex gap-6 items-center">
                    <div className="glass-card-subtle bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-transparent px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner shrink-0">
                        <Activity className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-slate-500 dark:text-gray-400 tracking-wide mb-1 whitespace-nowrap">إجمالي العينات</span>
                        <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{validReceptions.length}</span>
                      </div>
                    </div>

                    <div className="glass-card-subtle bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-transparent px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner shrink-0">
                        <Leaf className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-slate-500 dark:text-gray-400 tracking-wide mb-1 whitespace-nowrap">عينات بيئية</span>
                        <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                          {validReceptions.filter(r => r.certificateType === 'عينات بيئية').length}
                        </span>
                      </div>
                    </div>

                    <div className="glass-card-subtle bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-transparent px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner shrink-0">
                        <Beaker className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-slate-500 dark:text-gray-400 tracking-wide mb-1 whitespace-nowrap">عينات استهلاكية</span>
                        <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                          {validReceptions.filter(r => r.certificateType === 'عينات استهلاكية').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-bold text-slate-600 dark:text-gray-400">متابعة استلام العينات:</label>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-64 transition-all appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">الكل</option>
                        <option value="none" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">لم يتم إصدار شهادة</option>
                        <option value="done" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">تم إصدار شهادة</option>
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 rounded-2xl border border-slate-300/50 dark:border-white/10">
                  <table className="w-full text-right border-collapse relative">
                    <thead className="sticky top-0 z-10 bg-gradient-to-br from-sky-500 to-sky-700 dark:from-blue-900/40 dark:to-blue-900/40 border-b-2 border-sky-600/50 dark:border-white/10">
                      <tr className="text-white dark:text-blue-200 text-sm font-extrabold uppercase tracking-widest text-right">
                        <th className="p-5 font-extrabold whitespace-nowrap text-center">التسلسل</th>
                        <th className="p-5 font-extrabold min-w-[200px]">الجهة المرسلة</th>
                        <th className="p-5 font-extrabold min-w-[150px]">المورد</th>
                        <th className="p-5 font-extrabold whitespace-nowrap">الإيصال المالي</th>
                        <th className="p-5 font-extrabold whitespace-nowrap">رقم الإخطار</th>
                        <th className="p-5 font-extrabold whitespace-nowrap text-center">تاريخ الاستلام</th>
                        <th className="p-5 font-extrabold whitespace-nowrap text-center">النوع</th>
                        <th className="p-5 font-extrabold whitespace-nowrap text-center">الحالة</th>
                        <th className="p-5 font-extrabold whitespace-nowrap text-center">عدد العينات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {isStoreLoading ? (
                        <tr>
                          <td colSpan={9} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                              <p className="text-lg text-slate-600 dark:text-gray-400 font-bold">جاري تحميل البيانات...</p>
                            </div>
                          </td>
                        </tr>
                      ) : validReceptions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                              <AlertCircle className="w-12 h-12 text-slate-800 dark:text-white" />
                              <p className="text-lg text-slate-800 dark:text-white">لم يتم العثور على أي معاملات مسجلة</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentReceptions.map((item, idx) => {
                          if (!item) return null;
                          const globalIdx = indexOfFirstItem + idx;
                          return (
                            <tr
                              key={globalIdx}
                              onClick={() => setSelectedReceptionIndex(globalIdx)}
                              className={`cursor-pointer transition-all duration-300 group hover:bg-slate-50 dark:hover:bg-white/[0.03] ${selectedReceptionIndex === globalIdx ? 'bg-cyan-100 dark:bg-cyan-500/20 shadow-sm border-y border-cyan-500/30' : ''}`}
                            >
                              <td className="p-5 text-center">
                                <span className={`text-sm font-mono p-2.5 rounded-lg transition-all ${selectedReceptionIndex === globalIdx ? 'bg-cyan-600 text-white dark:bg-cyan-500/20 dark:text-cyan-200 font-bold shadow-lg scale-110' : 'bg-slate-200 text-slate-950 dark:bg-white/5 dark:text-white font-medium'}`}>{globalIdx + 1}</span>
                              </td>
                              <td className="p-5 text-slate-900 dark:text-white text-xs font-bold whitespace-nowrap">{item.sender}</td>
                              <td className="p-5 text-slate-900 dark:text-white text-base">{item.supplier || '-'}</td>
                              <td className="p-5 text-slate-900 dark:text-white text-base font-mono text-center">
                                {item.financialReceiptNumber ? (
                                  <span className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                                    {item.financialReceiptNumber}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">---</span>
                                )}
                              </td>
                              <td className="p-5 text-slate-900 dark:text-white text-base font-mono whitespace-nowrap">{item.notificationNumber || '-'}</td>
                              <td className="p-5 text-slate-900 dark:text-white text-base font-mono whitespace-nowrap text-center">
                                {(() => {
                                  try {
                                    const dateVal = item.createdAt || item.date;
                                    if (!dateVal) return '-';
                                    const d = new Date(dateVal);
                                    if (isNaN(d.getTime())) return '-';
                                    return d.toLocaleString('ar-LY', { 
                                      year: 'numeric', 
                                      month: '2-digit', 
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });
                                  } catch (e) {
                                    return '-';
                                  }
                                })()}
                              </td>
                              <td className="p-5 text-center">
                                <span className={`px-4 py-2 rounded-full text-xs font-bold border whitespace-nowrap ${item.certificateType === 'عينات بيئية'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                    : 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                                  }`}>
                                  {item.certificateType}
                                </span>
                              </td>
                              <td className="p-5 text-center">
                                <span className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${
                                  item.status === 'تم إصدار شهادة'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                    : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                }`}>
                                  {item.status || 'لم يتم إصدار شهادة'}
                                </span>
                              </td>
                              <td className="p-5 text-center">
                                <span className="font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/10 px-4 py-1.5 rounded-xl text-lg">
                                  {item.samples?.length || 0}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-8 py-4 border-t border-slate-200 dark:border-white/5 flex justify-center items-center gap-6 bg-white/20 dark:bg-black/5">
                    <button
                      onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                        setSelectedReceptionIndex(null);
                      }}
                      disabled={currentPage === 1}
                      className="p-2 glass-card-subtle bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-gray-400"
                      title="الصفحة السابقة"
                    >
                      <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-500 dark:text-gray-400">صفحة</span>
                       <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-lg font-mono font-bold text-lg">{currentPage}</span>
                       <span className="text-sm font-bold text-slate-500 dark:text-gray-400">من</span>
                       <span className="text-slate-800 dark:text-white font-bold">{totalPages}</span>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPage(p => Math.min(totalPages, p + 1));
                        setSelectedReceptionIndex(null);
                      }}
                      disabled={currentPage === totalPages}
                      className="p-2 glass-card-subtle bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-gray-400"
                      title="الصفحة التالية"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {/* Action Buttons Below Table */}
                <div className="p-6 border-t border-slate-200 dark:border-white/5 flex justify-end items-center bg-slate-50/50 dark:bg-black/10">
                  <div className="flex gap-4">
                    <button
                      disabled={selectedReceptionIndex === null}
                      onClick={() => setShowDetailsModal(true)}
                      className={`py-2 px-6 rounded-xl font-bold flex items-center gap-2 transition-all duration-300
                        ${selectedReceptionIndex !== null
                          ? 'bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10'
                          : 'bg-slate-100 text-slate-400 dark:bg-black/20 dark:text-gray-600 cursor-not-allowed border border-transparent'}`}
                    >
                      <FileText className="w-4 h-4" />
                      عرض التفاصيل
                    </button>

                    <button
                      disabled={selectedReceptionIndex === null}
                      onClick={() => setShowEditModal(true)}
                      className={`py-3 px-8 rounded-2xl font-bold flex items-center gap-2 transition-all duration-300 shadow-lg
                        ${selectedReceptionIndex !== null
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 hover:scale-105 active:scale-95'
                          : 'bg-slate-100 text-slate-400 dark:bg-black/20 dark:text-gray-600 cursor-not-allowed border border-transparent shadow-none'}`}
                    >
                      <Beaker className="w-5 h-5" />
                      تعديل العينات
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Edit Modal Component */}
      <EditReceptionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        reception={selectedReceptionIndex !== null && Array.isArray(receptions) && selectedReceptionIndex < receptions.length ? receptions[selectedReceptionIndex] : null}
        onSave={async (updated) => {
          if (updated.id) {
            const success = await updateReception(updated.id, updated);
            if (success) {
              setShowEditModal(false);
              setSelectedReceptionIndex(null);
              return true;
            }
          }
          return false;
        }}
      />

      <ReceptionDetailsModal 
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        reception={selectedReceptionIndex !== null && Array.isArray(receptions) && selectedReceptionIndex < receptions.length ? receptions[selectedReceptionIndex] : null}
      />
    </div>
  );
};
