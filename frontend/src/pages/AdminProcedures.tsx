import React, { useEffect } from 'react';
import { useAdminProceduresStore, ReferralColumnFlags } from '../store/useAdminProceduresStore';
import {
  FileText, History, FileOutput, Loader2, Search, Printer,
  Eye, Trash2, ChevronRight, ChevronLeft, Check, AlertCircle, FileCheck
} from 'lucide-react';

export const AdminProcedures = () => {
  const store = useAdminProceduresStore();

  useEffect(() => {
    store.fetchSenders();
    store.fetchHistory();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in RTL">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">الإجراءات الإدارية</h1>
          <p className="text-slate-600 dark:text-blue-100/80">إدارة رسائل الإحالة الرسمية وإصدار المراسلات</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-white/60 dark:bg-white/10 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm">
          <button
            onClick={() => store.setActiveTab('wizard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              store.activeTab === 'wizard' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-600 dark:text-blue-100 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium">إنشاء رسالة إحالة</span>
          </button>
          <button
            onClick={() => store.setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              store.activeTab === 'history' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-600 dark:text-blue-100 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="font-medium">سجل المراسلات</span>
          </button>
        </div>
      </div>

      {/* ═══ Global Messages ═══ */}
      {store.error && (
        <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-100 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            <p>{store.error}</p>
          </div>
          <button onClick={store.clearMessages} className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-white">✕</button>
        </div>
      )}
      {store.successMessage && (
        <div className="bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/50 text-green-700 dark:text-green-100 px-4 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500 dark:text-green-400" />
            <p>{store.successMessage}</p>
          </div>
          <button onClick={store.clearMessages} className="text-green-400 hover:text-green-600 dark:text-green-300 dark:hover:text-white">✕</button>
        </div>
      )}

      {/* ═══ Wizard Tab ═══ */}
      {store.activeTab === 'wizard' && (
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-xl">
          
          {/* Progress Bar */}
          <div className="bg-white/50 dark:bg-black/20 p-6 border-b border-slate-200/50 dark:border-white/10">
            <div className="flex items-center justify-center max-w-2xl mx-auto">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={`step-${step}`}>
                  <div className={`flex flex-col items-center gap-2 relative z-10 w-24`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                      store.currentStep === step ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                      store.currentStep > step ? 'bg-green-500 border-green-400 text-white' :
                      'bg-slate-200 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                    }`}>
                      {store.currentStep > step ? <Check className="w-5 h-5" /> : step}
                    </div>
                    <span className={`text-xs font-medium ${store.currentStep >= step ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {step === 1 ? '1. النطاق' : step === 2 ? '2. التخصيص' : '3. المراجعة'}
                    </span>
                  </div>
                  {step < 3 && (
                    <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700/50 -mx-4 z-0 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${
                        store.currentStep > step ? 'bg-green-500 w-full' : 'w-0'
                      }`} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="p-6 min-h-[400px]">
            
            {/* ═══ Step 1: Scope ═══ */}
            {store.currentStep === 1 && (
              <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">تحديد نطاق الإحالة</h2>
                  <p className="text-slate-500 dark:text-blue-200/70">حدد الفترة الزمنية والجهة التي سيتم إصدار رسالة الإحالة لها.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-blue-200">من تاريخ</label>
                    <input
                      type="date"
                      lang="en-GB"
                      value={store.startDate}
                      onChange={(e) => store.setStartDate(e.target.value)}
                      className="w-full bg-white/60 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-right font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-blue-200">إلى تاريخ</label>
                    <input
                      type="date"
                      lang="en-GB"
                      value={store.endDate}
                      onChange={(e) => store.setEndDate(e.target.value)}
                      className="w-full bg-white/60 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-right font-mono"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-blue-200">الجهة المرسلة <span className="text-red-500 dark:text-red-400">*</span></label>
                    <select
                      value={store.selectedSender || ''}
                      onChange={(e) => store.setSelectedSender(e.target.value || null)}
                      className="w-full bg-white/60 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      dir="rtl"
                    >
                      <option value="" className="bg-white dark:bg-slate-900">-- اختر الجهة المستهدفة --</option>
                      {store.sendersList.map(s => (
                        <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-8">
                  <button
                    onClick={store.nextStep}
                    disabled={!store.selectedSender}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══ Step 2: Customization ═══ */}
            {store.currentStep === 2 && (
              <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">تخصيص أعمدة التقرير</h2>
                  <p className="text-slate-500 dark:text-blue-200/70">اختر البيانات التي ترغب بظهورها في الجدول المرفق برسالة الإحالة.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'certNum', label: 'رقم الشهادة', checked: store.includeCertNum },
                    { id: 'supplier', label: 'المورد', checked: store.includeSupplier },
                    { id: 'samples', label: 'أرقام العينات', checked: store.includeSamples },
                    { id: 'notification', label: 'رقم الإخطار', checked: store.includeNotification },
                  ].map(option => (
                    <label 
                      key={option.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        option.checked 
                          ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-blue-400 dark:border-opacity-50 shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                          : 'bg-white/60 dark:bg-black/20 border-slate-200/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${
                        option.checked ? 'bg-blue-500 border-blue-400' : 'bg-white dark:bg-transparent border-slate-300 dark:border-slate-500'
                      }`}>
                        {option.checked && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`font-medium ${option.checked ? 'text-blue-700 dark:text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>
                        {option.label}
                      </span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={option.checked}
                        onChange={() => store.toggleColumn(option.id as any)}
                      />
                    </label>
                  ))}
                </div>

                <div className="flex justify-between pt-8">
                  <button
                    onClick={store.prevStep}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-medium transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                    <span>السابق</span>
                  </button>
                  <button
                    onClick={() => {
                      store.previewCertificates();
                      store.nextStep();
                    }}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    <span>التالي: المراجعة</span>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══ Step 3: Review & Generate ═══ */}
            {store.currentStep === 3 && (
              <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">المراجعة النهائية وإصدار الإحالة</h2>
                </div>

                {store.isPreviewing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                     <Loader2 className="w-12 h-12 text-blue-500 dark:text-blue-400 animate-spin mb-4" />
                     <p className="text-slate-600 dark:text-white text-lg">جاري البحث عن الشهادات...</p>
                  </div>
                ) : store.previewCount === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-2xl p-8 text-center shadow-inner">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">لا توجد شهادات</h3>
                    <p className="text-yellow-700 dark:text-yellow-200/80 mb-6">لم يتم العثور على أي شهادات للجهة "{store.selectedSender}" في هذه الفترة.</p>
                    <button
                      onClick={store.prevStep}
                      className="bg-yellow-100 dark:bg-yellow-500/20 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 text-yellow-800 dark:text-yellow-100 px-6 py-2 rounded-xl transition-all border border-yellow-300 dark:border-yellow-500/30 font-medium"
                    >
                      تغيير معايير البحث
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4 text-center">
                         <div className="text-sm text-blue-600 dark:text-blue-200 mb-1">عدد الشهادات</div>
                         <div className="text-3xl font-bold text-blue-800 dark:text-white">{store.previewCount}</div>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 text-center">
                         <div className="text-sm text-indigo-600 dark:text-indigo-200 mb-1">إجمالي العينات</div>
                         <div className="text-3xl font-bold text-indigo-800 dark:text-white">{store.previewSampleCount}</div>
                      </div>
                      <div className="bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl p-4 text-center col-span-2 flex flex-col justify-center">
                         <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">الجهة المرسلة</div>
                         <div className="text-lg font-bold text-slate-800 dark:text-white truncate px-2">{store.selectedSender}</div>
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-black/30 rounded-xl border border-slate-200/50 dark:border-white/5 overflow-hidden shadow-sm">
                      <div className="p-3 bg-slate-50 dark:bg-black/40 border-b border-slate-200/50 dark:border-white/5 font-medium text-slate-600 dark:text-slate-300">
                        معاينة سريعة للبيانات (أول {store.previewItems.length} سجل)
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                          <thead className="bg-gradient-to-br from-sky-500 to-sky-700 dark:from-blue-900/40 dark:to-blue-900/40 text-white dark:text-blue-200 border-b-2 border-sky-600/50 dark:border-transparent">
                            <tr>
                              <th className="p-3">رقم الشهادة</th>
                              {store.includeSupplier && <th className="p-3">المورد</th>}
                              {store.includeSamples && <th className="p-3">أرقام العينات</th>}
                              {store.includeNotification && <th className="p-3">رقم الإخطار</th>}
                              <th className="p-3">العدد</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {store.previewItems.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                <td className="p-3 font-medium text-slate-800 dark:text-white">{item.certificateNumber}</td>
                                {store.includeSupplier && <td className="p-3 text-slate-600 dark:text-slate-300">{item.supplier || '-'}</td>}
                                {store.includeSamples && <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{item.sampleNumbers}</td>}
                                {store.includeNotification && <td className="p-3 text-slate-600 dark:text-slate-300">{item.notificationNumber || '-'}</td>}
                                <td className="p-3 text-blue-600 dark:text-blue-300 font-bold">{item.sampleCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-between pt-8">
                      <button
                        onClick={store.prevStep}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-medium transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                        <span>رجوع</span>
                      </button>
                      <button
                        onClick={store.generateLetter}
                        disabled={store.isGenerating}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                      >
                        {store.isGenerating ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد وإصدار PDF...</>
                        ) : (
                          <><FileCheck className="w-5 h-5" /> إصدار رسالة الإحالة وتحميل PDF</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ History Tab ═══ */}
      {store.activeTab === 'history' && (
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-xl animate-fade-in flex flex-col min-h-[600px]">
          
          <div className="p-6 border-b border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-4">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
               سجل المراسلات الصادرة
             </h2>
             
             <div className="flex items-center gap-3 w-full sm:w-auto">
               <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">تصفية الجهة المرسلة:</span>
               <div className="relative w-full sm:w-auto">
                 <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                 <select
                    value={store.selectedFilterSender || ''}
                    onChange={(e) => store.setFilterSender(e.target.value || null)}
                    className="w-full sm:w-80 bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pr-10 pl-4 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none text-sm font-medium"
                    dir="rtl"
                  >
                    <option value="" className="bg-white dark:bg-slate-900">جميع الجهات المستهدفة</option>
                    {store.sendersList.map(s => (
                      <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>
                    ))}
                 </select>
               </div>
               <button 
                 onClick={() => { store.setFilterSender(null); store.fetchHistory(); }}
                 className="p-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-slate-700 dark:text-white transition-colors border border-slate-200 dark:border-transparent"
                 title="تحديث وإلغاء الفلتر"
               >
                 <History className="w-5 h-5" />
               </button>
             </div>
          </div>

          <div className="flex-1 p-6 relative">
             {store.isLoadingHistory ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/20 z-10 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-blue-500 dark:text-blue-400 animate-spin" />
                </div>
             ) : store.history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 py-20">
                  <FileText className="w-16 h-16 mb-4 opacity-20 text-slate-400" />
                  <p className="text-lg">لا يوجد سجل رسائل إحالة متوفر.</p>
                </div>
             ) : (
               <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-transparent">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-gradient-to-br from-sky-500 to-sky-700 dark:from-blue-900/40 dark:to-blue-900/40 text-white dark:text-blue-200 border-b-2 border-sky-600/50 dark:border-transparent">
                      <tr>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-transparent w-16 text-center">م</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-transparent">المرجع</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-transparent">تاريخ الإصدار</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-transparent">الجهة المرسلة</th>
                        <th className="p-4 font-semibold border-b border-slate-200 dark:border-transparent">عدد الشهادات</th>
                        <th className="p-4 font-semibold text-center border-b border-slate-200 dark:border-transparent">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {store.history.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                          <td className="p-4 text-center align-middle font-medium text-slate-500 dark:text-slate-400">
                            {(store.historyPage - 1) * store.historyPageSize + index + 1}
                          </td>
                          <td className="p-4 align-middle">
                            <span className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-slate-800 dark:text-white font-mono text-xs border border-slate-200 dark:border-transparent">{item.referenceNumber}</span>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 align-middle" dir="ltr" style={{ textAlign: 'right' }}>
                            {new Date(item.generatedAt).toLocaleString('ar-LY', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>
                          <td className="p-4 font-medium text-slate-800 dark:text-white align-middle">
                            {item.senderName}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <span className="text-blue-600 dark:text-blue-300 font-bold">{item.certificateCount} شهادة</span>
                              <span className="text-slate-500 dark:text-slate-400 text-xs">({item.sampleCount} عينة)</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => store.downloadPdf(item.id, item.referenceNumber)}
                                className="p-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500 hover:text-white rounded-lg transition-all border border-blue-100 dark:border-transparent"
                                title="تحميل PDF"
                              >
                                <FileOutput className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟ ستبقى للإغراض الرقابية ولكن ستختفي من هذه القائمة.')) {
                                    store.deleteLetter(item.id);
                                  }
                                }}
                                className="p-2 bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-red-100 dark:border-transparent"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             )}
          </div>
          
          {/* History Pagination */}
          {!store.isLoadingHistory && store.historyTotalCount > store.historyPageSize && (
            <div className="p-4 border-t border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-black/20 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
               <span>
                 إجمالي: <span className="text-slate-800 dark:text-white font-bold">{store.historyTotalCount}</span> سجل
               </span>
               <div className="flex gap-2">
                 <button
                   onClick={() => { store.setHistoryPage(store.historyPage - 1); store.fetchHistory(); }}
                   disabled={store.historyPage === 1}
                   className="px-3 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-30 rounded transition-colors text-slate-700 dark:text-white"
                 >
                   السابق
                 </button>
                 <span className="px-3 py-1 bg-white dark:bg-white/5 rounded text-slate-700 dark:text-white border border-slate-200 dark:border-transparent">صفحة {store.historyPage}</span>
                 <button
                   onClick={() => { store.setHistoryPage(store.historyPage + 1); store.fetchHistory(); }}
                   disabled={store.historyPage * store.historyPageSize >= store.historyTotalCount}
                   className="px-3 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-30 rounded transition-colors text-slate-700 dark:text-white"
                 >
                   التالي
                 </button>
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
