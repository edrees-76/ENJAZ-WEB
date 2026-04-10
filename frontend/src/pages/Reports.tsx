import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { TimelineChart, DonutChart, HorizontalBarChart, MonthlyPerformanceChart } from '../components/ReportCharts';
import {
  useReportStore,
  ReportColumn,
  COLUMN_LABELS,
} from '../store/useReportStore';
import {
  BarChart3, FileSpreadsheet, FileText, Loader2, AlertTriangle,
  RefreshCw, Download, Table, Search, XCircle, Calendar,
  Building2, Filter, ChevronLeft, ChevronRight,
  FileText as CertIcon, Beaker, Leaf, ShieldCheck, Box, Activity
} from 'lucide-react';

export const Reports = () => {
  const store = useReportStore();

  // Load senders once on mount
  useEffect(() => {
    store.fetchSenders();
  }, []);

  // Fetch table data when page changes if table is visible
  useEffect(() => {
    if (store.showTable) {
      store.fetchTable();
    }
  }, [store.currentPage]);

  const handleLoadReport = () => {
    if (store.reportType === 'sender' && !store.selectedSender) {
      // Must select sender for sender report
      alert('الرجاء اختيار الجهة المرسلة أولاً لإصدار تقرير الجهات.');
      return;
    }
    store.fetchSummary();
    store.setShowTable(false);
  };

  const handleShowTable = () => {
    store.setPage(1);
    store.fetchTable();
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleExportExcel = async () => {
    useReportStore.setState({ error: null });
    await store.exportExcel();
    const hasError = useReportStore.getState().error;
    if (!hasError) setTimeout(() => setShowSuccessModal(true), 800);
  };

  const handleExportPdf = async () => {
    useReportStore.setState({ error: null });
    await store.exportPdf();
    const hasError = useReportStore.getState().error;
    if (!hasError) setTimeout(() => setShowSuccessModal(true), 800);
  };

  const handleNewReport = () => {
    setShowSuccessModal(false);
    store.resetFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalTablePages = Math.ceil(store.tableTotalCount / store.pageSize);
  const visibleColumns = store.selectedColumns.sort((a, b) => a - b);

  const getCellValue = (row: any, col: ReportColumn): string => {
    const map: Record<ReportColumn, string> = {
      [ReportColumn.CertificateNumber]: row.certificateNumber ?? '',
      [ReportColumn.CertificateType]: row.certificateType ?? '',
      [ReportColumn.AnalysisType]: row.analysisType ?? '',
      [ReportColumn.Sender]: row.sender ?? '',
      [ReportColumn.Supplier]: row.supplier ?? '',
      [ReportColumn.Origin]: row.origin ?? '',
      [ReportColumn.NotificationNumber]: row.notificationNumber ?? '',
      [ReportColumn.DeclarationNumber]: row.declarationNumber ?? '',
      [ReportColumn.FinancialReceiptNumber]: row.financialReceiptNumber ?? '',
      [ReportColumn.SampleCount]: String(row.sampleCount ?? 0),
      [ReportColumn.EnvSampleCount]: String(row.envSampleCount ?? 0),
      [ReportColumn.ConsSampleCount]: String(row.consSampleCount ?? 0),
      [ReportColumn.CreatedByName]: row.createdByName ?? '',
      [ReportColumn.IssueDate]: row.issueDate ? new Date(row.issueDate).toLocaleDateString('ar-LY') : '',
    };
    return map[col];
  };

  const isGeneral = store.reportType === 'general';

  // Helper to switch tabs and reset irrelevant data
  const handleTabChange = (type: 'general' | 'sender') => {
    if (store.reportType !== type) {
      store.setReportType(type);
      store.resetFilters();
      store.setReportType(type); // Need to reset then set type again because resetFilters sets type to general
      
      // If switching to sender report, default columns are different (based on WPF)
      if (type === 'sender') {
        const senderColumns = [
            ReportColumn.CertificateNumber,
            ReportColumn.CertificateType,
            ReportColumn.Supplier,
            ReportColumn.SampleCount,
            ReportColumn.IssueDate,
        ];
        // Apply immediately
        useReportStore.setState({ selectedColumns: senderColumns });
      } else {
        const generalColumns = [
            ReportColumn.CertificateNumber,
            ReportColumn.CertificateType,
            ReportColumn.Sender,
            ReportColumn.Supplier,
            ReportColumn.Origin,
            ReportColumn.SampleCount,
            ReportColumn.IssueDate,
        ];
        useReportStore.setState({ selectedColumns: generalColumns });
      }
    }
  };

  return (
    <>
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════ */}
      {/* Tabs / Header */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg">
            <BarChart3 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>التقارير الذكية</h1>
            <p className="text-sm opacity-60" style={{ color: 'var(--text-main)' }}>استخراج سريع للإحصائيات وتقارير تفصيلية</p>
          </div>
        </div>
        
        {store.hasFetched && (
          <button
            onClick={() => {
                const currentType = store.reportType;
                store.resetFilters();
                store.setReportType(currentType);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ color: 'var(--text-main)', background: 'rgba(239, 68, 68, 0.1)' }}
          >
            <XCircle size={16} /> إعادة تعيين
          </button>
        )}
      </div>

      {/* Tabs selection */}
      <div className="flex bg-white/60 dark:bg-white/10 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm mb-6 w-fit mx-auto md:mx-0">
        <button
          onClick={() => handleTabChange('general')}
          className={`flex items-center justify-center min-w-[180px] gap-2 px-6 py-2.5 rounded-lg transition-all ${
            isGeneral ? 'bg-blue-500 text-white shadow-md transform scale-105' : 'text-slate-600 dark:text-blue-100 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="font-bold text-sm">التقرير العام</span>
        </button>
        <button
          onClick={() => handleTabChange('sender')}
          className={`flex items-center justify-center min-w-[180px] gap-2 px-6 py-2.5 rounded-lg transition-all ${
            !isGeneral ? 'bg-blue-500 text-white shadow-md transform scale-105' : 'text-slate-600 dark:text-blue-100 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="font-bold text-sm">تقرير الجهات المرسلة</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Filters Toolbar */}
      {/* ═══════════════════════════════════════════════════ */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-indigo-500" />
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>
            {isGeneral ? 'تحديد فترة التقرير' : 'حدد الجهة والفترة الزمنية'}
          </h3>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${!isGeneral ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 items-end`}>
          {!isGeneral && (
            <div>
              <label className="block text-sm font-bold mb-1.5 opacity-70" style={{ color: 'var(--text-main)' }}>
                <Building2 size={14} className="inline ml-1" />الجهة المرسلة
              </label>
              <select
                value={store.selectedSender ?? ''}
                onChange={(e) => store.setSender(e.target.value || null)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all invalid:text-slate-400 dark:invalid:text-gray-500 text-sm font-bold"
              >
                <option value="" disabled hidden className="text-slate-800 dark:text-white bg-white dark:bg-slate-800">اختر الجهة...</option>
                {store.sendersList.map((s) => (
                  <option key={s} value={s} className="text-slate-800 dark:text-white bg-white dark:bg-slate-800 py-2">{s}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold mb-1.5 opacity-70" style={{ color: 'var(--text-main)' }}>
              <Calendar size={14} className="inline ml-1" />من تاريخ
            </label>
            <input
              type="date"
              value={store.startDate}
              onChange={(e) => store.setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/20 text-sm font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              style={{
                background: 'var(--glass-bg, rgba(255,255,255,0.1))',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 opacity-70" style={{ color: 'var(--text-main)' }}>
              <Calendar size={14} className="inline ml-1" />إلى تاريخ
            </label>
            <input
              type="date"
              value={store.endDate}
              onChange={(e) => store.setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/20 text-sm font-bold transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              style={{
                background: 'var(--glass-bg, rgba(255,255,255,0.1))',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <button
            onClick={handleLoadReport}
            disabled={store.summaryLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/20 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {store.summaryLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            {store.summaryLoading ? 'جارٍ التحميل...' : 'تحميل التقرير'}
          </button>
        </div>
      </GlassCard>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Error state */}
      {/* ═══════════════════════════════════════════════════ */}
      {store.error && (
        <GlassCard className="p-6 border-2 border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-500">حدث خطأ</h4>
              <p className="text-sm opacity-80" style={{ color: 'var(--text-main)' }}>{store.error}</p>
            </div>
            <button
              onClick={handleLoadReport}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-xl text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all"
            >
              <RefreshCw size={16} /> إعادة المحاولة
            </button>
          </div>
        </GlassCard>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Skeleton Loading */}
      {/* ═══════════════════════════════════════════════════ */}
      {store.summaryLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <GlassCard key={i} className="h-24">
                <div className="h-4 w-20 mx-auto mt-4 rounded-lg" style={{ background: 'rgba(148,163,184,0.2)' }} />
                <div className="h-8 w-16 mx-auto mt-3 rounded-lg" style={{ background: 'rgba(148,163,184,0.15)' }} />
              </GlassCard>
            ))}
          </div>
          {isGeneral && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2 h-80" />
              <GlassCard className="h-80" />
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Initial state (Before search) */}
      {/* ═══════════════════════════════════════════════════ */}
      {!store.hasFetched && !store.summaryLoading && !store.error && (
        <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
            <BarChart3 size={40} className="text-indigo-500 opacity-60" />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>مرحباً بك في التقارير الذكية</h3>
          <p className="text-sm opacity-60 max-w-md" style={{ color: 'var(--text-main)' }}>
            {isGeneral 
              ? 'حدد الفترة الزمنية المطلوبة واضغط "تحميل التقرير" لاستخراج الإحصائيات والمخططات البيانية' 
              : 'اختر الجهة المستهدفة والفترة الزمنية لعرض ملخص العمليات الخاص بها'}
          </p>
        </GlassCard>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* Results */}
      {/* ═══════════════════════════════════════════════════ */}
      {store.summary && !store.summaryLoading && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={<CertIcon size={22} />} label="إجمالي الشهادات" value={store.summary.totalCertificates} gradient="from-purple-500 to-violet-600" />
            <StatCard icon={<Box size={22} />} label="إجمالي العينات" value={store.summary.totalSamples} gradient="from-indigo-500 to-blue-600" />
            <StatCard icon={<Leaf size={22} />} label="شهادات بيئية" value={store.summary.environmentalCertificates} gradient="from-emerald-400 to-emerald-600" />
            <StatCard icon={<ShieldCheck size={22} />} label="شهادات استهلاكية" value={store.summary.consumableCertificates} gradient="from-blue-400 to-cyan-500" />
            <StatCard icon={<Beaker size={22} />} label="عينات بيئية" value={store.summary.environmentalSamples} gradient="from-green-500 to-teal-600" />
            <StatCard icon={<Activity size={22} />} label="عينات استهلاكية" value={store.summary.consumableSamples} gradient="from-sky-400 to-blue-600" />
          </div>

          {store.summary.totalCertificates === 0 && (
            <GlassCard className="p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="text-amber-500 opacity-60" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-main)' }}>لا توجد بيانات</h3>
              <p className="text-sm opacity-60" style={{ color: 'var(--text-main)' }}>لا توجد شهادات في النطاق الزمني أو الفلاتر المحددة.</p>
            </GlassCard>
          )}

          {store.summary.totalCertificates > 0 && (
            <>
              {/* General Report Charts */}
              {isGeneral && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <GlassCard className="lg:col-span-2 p-4 pt-6" dir="ltr">
                      <h3 className="font-bold text-base mb-2 px-2 text-right" dir="rtl" style={{ color: 'var(--text-main)' }}>
                        📈 اتجاه العينات والشهادات
                      </h3>
                      <TimelineChart data={store.summary.timeline} />
                    </GlassCard>

                    <GlassCard className="p-4 pt-6">
                      <h3 className="font-bold text-base mb-2 px-2 text-right" style={{ color: 'var(--text-main)' }}>
                        🥧 توزيع أنواع الشهادات
                      </h3>
                      <DonutChart data={store.summary.certDistribution} />
                    </GlassCard>

                    <GlassCard className="p-4 pt-6">
                      <h3 className="font-bold text-base mb-2 px-2 text-right" style={{ color: 'var(--text-main)' }}>
                         ⚖️ نسبة أنواع العينات
                      </h3>
                      <DonutChart data={store.summary.sampleTypeComparison} colors={['#10b981', '#3b82f6']} />
                    </GlassCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {store.summary.topSuppliers.length > 0 && (
                      <GlassCard className="p-4 pt-6" dir="ltr">
                        <h3 className="font-bold text-base mb-2 px-2 text-right" dir="rtl" style={{ color: 'var(--text-main)' }}>
                          🏭 أعلى الموردين نشاطاً
                        </h3>
                        <HorizontalBarChart data={store.summary.topSuppliers} color="#8b5cf6" />
                      </GlassCard>
                    )}

                    {store.summary.topSenders.length > 0 && store.reportType !== 'sender' && (
                      <GlassCard className="p-4 pt-6">
                        <h3 className="font-bold text-base mb-2 px-2 text-right" style={{ color: 'var(--text-main)' }}>
                          📮 أبرز الجهات المرسلة
                        </h3>
                        <DonutChart data={store.summary.topSenders} colors={['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6']} />
                      </GlassCard>
                    )}

                    {store.summary.topOrigins.length > 0 && (
                      <GlassCard className="p-4 pt-6" dir="ltr">
                        <h3 className="font-bold text-base mb-2 px-2 text-right" dir="rtl" style={{ color: 'var(--text-main)' }}>
                          🌍 أهم دول المنشأ
                        </h3>
                        <HorizontalBarChart data={store.summary.topOrigins} color="#14b8a6" />
                      </GlassCard>
                    )}
                  </div>

                  {store.summary.monthlyPerformance.length > 0 && (
                    <GlassCard className="p-4 pt-6" dir="ltr">
                      <h3 className="font-bold text-base mb-2 px-2 text-right" dir="rtl" style={{ color: 'var(--text-main)' }}>
                        📊 الأداء الشهري على مدار العام
                      </h3>
                      <MonthlyPerformanceChart data={store.summary.monthlyPerformance} />
                    </GlassCard>
                  )}
                </>
              )}

              {/* Toggle Table Button */}
              {!store.showTable && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleShowTable}
                    disabled={store.tableLoading}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white/10 dark:to-white/5 text-white rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border border-white/10"
                  >
                    {store.tableLoading ? <Loader2 size={20} className="animate-spin" /> : <Table size={20} />}
                    عرض الجدول التفصيلي للبيانات
                  </button>
                </div>
              )}

              {/* Data Table and Export */}
              {store.showTable && (
                <GlassCard className="p-6">
                  {/* Column Customizer */}
                  <div className="mb-4">
                    <h3 className="font-bold text-base mb-3 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                      <Filter size={16} className="text-indigo-500" /> تخصيص الأعمدة
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ReportColumn)
                        .filter((v) => typeof v === 'number' && v !== ReportColumn.AnalysisType && !(store.reportType === 'sender' && v === ReportColumn.Sender))
                        .map((col) => {
                          const colNum = col as ReportColumn;
                          // If it is sender report, hiding the "Sender" column is a good default UX, but we can let them enable it
                          const isSelected = store.selectedColumns.includes(colNum);
                          return (
                            <button
                              key={colNum}
                              onClick={() => store.toggleColumn(colNum)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                                  : 'border-white/20 opacity-50 hover:opacity-80'
                              }`}
                              style={{ color: isSelected ? undefined : 'var(--text-main)' }}
                            >
                              {isSelected ? '✓ ' : ''}{COLUMN_LABELS[colNum]}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Table Grid */}
                  {store.tableLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={32} className="text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                              {visibleColumns.map((col) => (
                                <th key={col} className="px-4 py-3 text-center font-bold whitespace-nowrap text-xs">
                                  {COLUMN_LABELS[col]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {store.tableData.length === 0 ? (
                              <tr>
                                <td colSpan={visibleColumns.length} className="text-center py-8 opacity-60" style={{ color: 'var(--text-main)' }}>
                                  لا توجد بيانات
                                </td>
                              </tr>
                            ) : (
                              store.tableData.map((row, i) => (
                                <tr
                                  key={i}
                                  className="transition-colors hover:bg-indigo-500/5"
                                  style={{ backgroundColor: i % 2 === 1 ? 'rgba(148,163,184,0.04)' : 'transparent' }}
                                >
                                  {visibleColumns.map((col) => (
                                    <td key={col} className="px-4 py-2.5 text-center whitespace-nowrap" style={{ color: 'var(--text-main)' }}>
                                      {getCellValue(row, col)}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Content */}
                      {totalTablePages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-4">
                          <button
                            onClick={() => store.setPage(Math.max(1, store.currentPage - 1))}
                            disabled={store.currentPage <= 1}
                            className="p-2 rounded-xl border border-white/20 transition-all hover:bg-white/10 disabled:opacity-30"
                            style={{ color: 'var(--text-main)' }}
                          >
                            <ChevronRight size={18} />
                          </button>
                          <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                            صفحة {store.currentPage} من {totalTablePages}
                          </span>
                          <button
                            onClick={() => store.setPage(Math.min(totalTablePages, store.currentPage + 1))}
                            disabled={store.currentPage >= totalTablePages}
                            className="p-2 rounded-xl border border-white/20 transition-all hover:bg-white/10 disabled:opacity-30"
                            style={{ color: 'var(--text-main)' }}
                          >
                            <ChevronLeft size={18} />
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Export Options */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={handleExportExcel}
                      disabled={store.exporting || store.tableData.length === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                    >
                      {store.exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                      تصدير إلى Excel
                    </button>

                    <button
                      onClick={handleExportPdf}
                      disabled={store.exporting || store.tableData.length === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                    >
                      {store.exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      تصدير إلى PDF
                    </button>
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </>
      )}
    </div>

      {/* ═══════════════════ نافذة نجاح التصدير ═══════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setShowSuccessModal(false)}>
          <div
            className="mx-4 w-full max-w-md rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 dark:border-white/20"
            style={{ 
              backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.95))',
              color: 'var(--text-main, #1e293b)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-4 animate-bounce">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-2xl font-black mb-2">
                تم التصدير بنجاح!
              </h3>
              <p className="text-sm opacity-80 leading-relaxed font-medium">
                تم فتح التقرير. هل ترغب بإنهاء هذا التقرير والبدء من جديد؟
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleNewReport}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:from-emerald-400 hover:to-teal-500 transition-all hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-2"
              >
                <RefreshCw size={18} />
                بدء تقرير جديد
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-sm border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:-translate-y-1 active:scale-95"
              >
                متابعة التقرير
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════
// Stat Card Template
// ═══════════════════════════════════════════════
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
}

const StatCard = ({ icon, label, value, gradient }: StatCardProps) => (
  <GlassCard className="flex items-center space-x-3 space-x-reverse p-4 transition-transform hover:-translate-y-1 hover:shadow-xl">
    <div className={`p-3 bg-gradient-to-br ${gradient} text-white rounded-xl shadow-lg shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold opacity-60 truncate" style={{ color: 'var(--text-main)' }}>{label}</p>
      <p className="text-2xl font-black mt-0.5" style={{ color: 'var(--text-main)' }}>{value.toLocaleString()}</p>
    </div>
  </GlassCard>
);
