import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCertificateStore } from '../store/useCertificateStore';
import type { Certificate } from '../store/useCertificateStore';
import { Search, Plus, Eye, Edit2, Printer, FileText, RotateCcw, ChevronLeft, ChevronRight, ShieldCheck, Activity, Leaf, Beaker } from 'lucide-react';
import CertificateDetailsModal from '../components/CertificateDetailsModal';
import CertificateFormModal from '../components/CertificateFormModal';
import ReceptionSearchModal from '../components/ReceptionSearchModal';
import CertificatePrintTemplate from '../components/CertificatePrintTemplate';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { DensityToggle, useDensity } from '../components/ui/DensityToggle';
import { useTableKeyboardNav } from '../hooks/useTableKeyboardNav';

const Certificates = () => {
  const [searchParams] = useSearchParams();
  const { certificates, totalCount, fetchCertificates, isLoading } = useCertificateStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState('الكل');

  // Selection & Modals
  const [selectedCertId, setSelectedCertId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [linkedReceptionId, setLinkedReceptionId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const { density, setDensity, classes: dc } = useDensity();

  useEffect(() => {
    fetchCertificates(currentPage, itemsPerPage);
  }, [fetchCertificates, currentPage]);

  // Handle URL action parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add' && !isSearchModalOpen && viewMode === 'list') {
      setIsSearchModalOpen(true);
    }
  }, [searchParams]);

  // Filter logic
  const filteredCertificates = certificates.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    switch (searchCriteria) {
      case 'رقم الشهادة': return (c.certificateNumber || '').toLowerCase().includes(term);
      case 'الجهة المرسلة': return (c.sender || '').toLowerCase().includes(term);
      case 'المورد': return (c.supplier || '').toLowerCase().includes(term);
      case 'رقم الاخطار': return (c.notificationNumber || '').toLowerCase().includes(term);
      case 'رقم الاقرار الجمركى': return (c.declarationNumber || '').toLowerCase().includes(term);
      case 'رقم الايصال المالى': return (c.financialReceiptNumber || '').toLowerCase().includes(term);
      case 'رقم البوليصة': return (c.policyNumber || '').toLowerCase().includes(term);
      case 'رقم العينة': return c.samples?.some(s => (s.sampleNumber || '').toLowerCase().includes(term));
      case 'اسم المستخدم': return (c.specialistName || '').toLowerCase().includes(term);
      case 'التاريخ': return (c.issueDate || '').toLowerCase().includes(term);
      case 'الكل':
      default:
        return (
          (c.certificateNumber || '').toLowerCase().includes(term) ||
          (c.sender || '').toLowerCase().includes(term) ||
          (c.supplier || '').toLowerCase().includes(term) ||
          (c.notificationNumber || '').toLowerCase().includes(term) ||
          (c.declarationNumber || '').toLowerCase().includes(term) ||
          (c.financialReceiptNumber || '').toLowerCase().includes(term) ||
          (c.policyNumber || '').toLowerCase().includes(term) ||
          c.samples?.some(s => (s.sampleNumber || '').toLowerCase().includes(term))
        );
    }
  });

  // Pagination (Server-side controls)
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  // The API already slices the data, so we just use the filtered results directly
  const paginatedCerts = filteredCertificates;

  // Stats for the current view
  const consumableCount = certificates.filter(c => c.certificateType === 'استهلاكية').length;
  const environmentalCount = certificates.filter(c => c.certificateType === 'بيئية').length;

  // Get selected certificate object
  const getSelectedCert = (): Certificate | null => {
    return certificates.find(c => c.id === selectedCertId) || null;
  };

  const { selectedIndex, setSelectedIndex } = useTableKeyboardNav({
    itemCount: paginatedCerts.length,
    onSelect: (idx) => {
      setSelectedCertId(paginatedCerts[idx].id);
      setIsDetailsOpen(true);
    },
    enabled: !isDetailsOpen && !isFormModalOpen && !isSearchModalOpen && viewMode === 'list'
  });

  // Sync selectedIndex with selectedCertId when manually clicked
  useEffect(() => {
    if (selectedCertId === null) {
      setSelectedIndex(null);
    } else {
      const idx = paginatedCerts.findIndex(c => c.id === selectedCertId);
      if (idx !== -1) setSelectedIndex(idx);
    }
  }, [selectedCertId, paginatedCerts, setSelectedIndex]);

  const handlePrint = (cert: Certificate) => {
    window.open(`/print/certificate/${cert.id}`, '_blank');
  };

  const handleExportPdf = (cert: Certificate) => {
    window.open(`/print/certificate/${cert.id}?pdf=true`, '_blank');
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSearchCriteria('الكل');
    setCurrentPage(1);
  };

  if (viewMode === 'form') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <CertificateFormModal
          isOpen={true}
          isFullScreen={true}
          onClose={() => {
            setViewMode('list');
            setLinkedReceptionId(null);
            setSelectedCertificate(null);
            fetchCertificates();
          }}
          certificate={selectedCertificate}
          linkedReceptionId={linkedReceptionId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <ReceptionSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={(receptionId) => {
          setIsSearchModalOpen(false);
          setLinkedReceptionId(receptionId);
          setSelectedCertificate(null); // Ensure we are creating new
          setViewMode('form');
        }}
      />

      {/* ═══════════════════════════ HEADER ═══════════════════════════ */}
      <div className="flex justify-between items-center bg-white/40 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-3 glass-card rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-white/10">
              <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </span>
            الشهادات
          </h1>
        </div>

        <button
          onClick={() => {
            setLinkedReceptionId(null);
            setSelectedCertificate(null);
            setIsSearchModalOpen(true);
          }}
          className="group px-8 py-4 bg-gradient-to-br from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600 text-white rounded-2xl transition-all duration-500 flex items-center gap-3 border border-sky-400/50 shadow-xl shadow-sky-500/20 hover:-translate-y-1"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-wide">إصدار شهادة جديدة</span>
        </button>
      </div>

      {/* ═══════════════════════════ SEARCH BAR & STATS ═══════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6">

        {/* Statistics Cards */}
        <div className="flex gap-6 items-center">
          <div className="glass-card-subtle bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-transparent px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-500 dark:text-gray-400 tracking-wide mb-1 whitespace-nowrap">إجمالي الشهادات</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{totalCount}</span>
            </div>
          </div>

          <div className="glass-card-subtle bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-transparent px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner shrink-0">
              <Leaf className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-500 dark:text-gray-400 tracking-wide mb-1 whitespace-nowrap">شهادات بيئية</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{environmentalCount}</span>
            </div>
          </div>

          <div className="glass-card-subtle bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-transparent px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner shrink-0">
              <Beaker className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-500 dark:text-gray-400 tracking-wide mb-1 whitespace-nowrap">شهادات استهلاكية</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{consumableCount}</span>
            </div>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="flex items-center gap-3 justify-end bg-white/40 dark:bg-white/[0.02] p-2 rounded-2xl border border-slate-200/50 dark:border-white/5">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            تعيين
          </button>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold transition-all shadow-md active:scale-95"
          >
            <Search className="w-4 h-4" />
            بحث
          </button>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="اكتب للبحث..."
              className="w-56 pr-4 pl-4 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600 font-bold shadow-sm text-center"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              dir="rtl"
            />
          </div>

          {/* Search Criteria Dropdown */}
          <div className="relative min-w-[160px]">
            <select
              value={searchCriteria}
              onChange={(e) => setSearchCriteria(e.target.value)}
              className="w-full px-5 py-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none cursor-pointer shadow-sm text-center"
            >
              <option value="الكل">الكل</option>
              <option value="رقم العينة">رقم العينة</option>
              <option value="رقم الشهادة">رقم الشهادة</option>
              <option value="رقم الاخطار">رقم الاخطار</option>
              <option value="رقم الاقرار الجمركى">رقم الاقرار الجمركى</option>
              <option value="الجهة المرسلة">الجهة المرسلة</option>
              <option value="المورد">المورد</option>
              <option value="رقم الايصال المالى">رقم الايصال المالى</option>
              <option value="التاريخ">التاريخ</option>
              <option value="رقم البوليصة">رقم البوليصة</option>
              <option value="اسم المستخدم">اسم المستخدم</option>
            </select>
            <div className="absolute top-0 right-0 h-full flex items-center px-2 pointer-events-none">
              <span className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest -mt-10 mr-1 bg-white dark:bg-slate-900 px-2 rounded-full border border-slate-200 dark:border-white/10">معيار البحث</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════ MAIN TABLE ═══════════════════════════ */}
      <div className="glass-card rounded-[2.5rem] border border-slate-300/50 dark:border-white/10 overflow-hidden shadow-2xl backdrop-blur-3xl">

        {/* Density Toggle */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
          <span className="text-xs font-bold text-slate-400 dark:text-gray-500">عرض {paginatedCerts.length} من {totalCount} سجل</span>
          <DensityToggle value={density} onChange={setDensity} />
        </div>

        {/* Table Container with Fixed Height and Scroll */}
        <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 rounded-b-2xl table-responsive">
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            <table className="w-full text-right min-w-[900px] border-collapse">
              <thead className="sticky top-0 z-10 bg-gradient-to-br from-sky-500 to-sky-700 dark:from-blue-900/40 dark:to-blue-900/40 backdrop-blur-sm border-b-2 border-sky-600/50 dark:border-white/10">
                <tr className={`text-white dark:text-blue-200 ${dc.text} font-extrabold uppercase tracking-widest`}>
                  <th className={`${dc.cell} text-center w-12`}>ت</th>
                  <th className={`${dc.cell} w-44 whitespace-nowrap`}>رقم الشهادة</th>
                  <th className={`${dc.cell} min-w-[200px]`}>الجهة المرسلة</th>
                  <th className={`${dc.cell} text-center w-24`}>العينات</th>
                  <th className={`${dc.cell} min-w-[180px]`}>المورد</th>
                  <th className={`${dc.cell} w-36 text-center`}>رقم الإخطار</th>
                  <th className={`${dc.cell} w-36 text-center`}>رقم الإيصال</th>
                  <th className={`${dc.cell} text-center w-44 font-extrabold`}>تاريخ الإصدار</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCerts.map((cert, idx) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isSelected = selectedCertId === cert.id || selectedIndex === idx;
                  return (
                    <tr
                      key={cert.id}
                      ref={selectedIndex === idx ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) : null}
                      onClick={() => setSelectedCertId(cert.id)}
                      className={`cursor-pointer transition-all duration-200 group hover:bg-slate-50 dark:hover:bg-white/[0.03] ${dc.row} ${isSelected ? 'bg-emerald-100/50 dark:bg-emerald-500/10 shadow-sm border-y border-emerald-500/30' : 'border-b border-slate-100 dark:border-white/5 last:border-0'}`}
                    >
                      <td className={`${dc.cell} text-center`}>
                        <span className={`text-sm font-mono p-2 rounded-lg transition-all inline-block ${isSelected ? 'bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-200 font-bold shadow-lg scale-110' : 'bg-slate-200 text-slate-950 dark:bg-white/5 dark:text-white font-medium'}`}>
                          {globalIndex}
                        </span>
                      </td>
                      <td className={`${dc.cell} whitespace-nowrap`}>
                        <span className={`px-2 py-0.5 rounded-lg font-black ${dc.text} tracking-wide border border-emerald-500/10 ${cert.certificateType === 'بيئية'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                          {cert.certificateNumber}
                        </span>
                      </td>
                      <td className={`${dc.cell} text-slate-900 dark:text-white font-bold ${dc.text} tracking-tight whitespace-nowrap`}>{cert.sender}</td>
                      <td className={`${dc.cell} text-center whitespace-nowrap`}>
                        <span className={`bg-slate-200/50 dark:bg-white/10 text-slate-900 dark:text-white px-2 py-0.5 rounded-lg font-black ${dc.text}`}>
                          {cert.sampleCount || cert.samples?.length || 0}
                        </span>
                      </td>
                      <td className={`${dc.cell} text-slate-900 dark:text-white ${dc.text} font-bold whitespace-nowrap`}>{cert.supplier || '-'}</td>
                      <td className={`${dc.cell} text-center text-slate-900 dark:text-white ${dc.text} font-mono tracking-tighter whitespace-nowrap`}>{cert.notificationNumber || '-'}</td>
                      <td className={`${dc.cell} text-center text-slate-900 dark:text-white ${dc.text} font-mono tracking-tighter whitespace-nowrap`}>{cert.financialReceiptNumber || '-'}</td>
                      <td className={`${dc.cell} text-center whitespace-nowrap`}>
                        <div className="flex items-center justify-center gap-1.5">
                          {cert.issueDate ? (
                            <>
                              <span className={`font-bold text-slate-900 dark:text-white ${dc.text}`}>
                                {new Date(cert.issueDate).toLocaleDateString('ar-LY', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                              </span>
                              {density !== 'compact' && (
                                <span className="text-[10px] font-black text-slate-700 dark:text-gray-400 opacity-90 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md" dir="ltr">
                                  {new Date(cert.issueDate).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-900 dark:text-white opacity-50 font-bold">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedCerts.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={<ShieldCheck className="w-9 h-9 text-slate-400 dark:text-gray-500" />}
                        title="لا توجد شهادات مطابقة"
                        description={searchTerm ? `لم يتم العثور على نتائج لـ "${searchTerm}"` : 'لم يتم إصدار أي شهادات بعد.'}
                        actionLabel={searchTerm ? 'إعادة تعيين البحث' : undefined}
                        onAction={searchTerm ? handleReset : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ═══════════════════════════ BOTTOM BAR & PAGINATION ═══════════════════════════ */}
        <div className="border-t-2 border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">

          {/* Pagination Controls */}
          <div className="flex items-center gap-3">
             <button 
               disabled={currentPage === 1 || isLoading} 
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
               className="p-2 glass-card rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-gray-300 transition-all disabled:opacity-30 border border-slate-200 dark:border-white/10 shadow-sm"
             >
               <ChevronRight className="w-5 h-5"/>
             </button>
             <button 
               disabled={currentPage === totalPages || isLoading} 
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
               className="p-2 glass-card rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-gray-300 transition-all disabled:opacity-30 border border-slate-200 dark:border-white/10 shadow-sm"
             >
               <ChevronLeft className="w-5 h-5"/>
             </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const cert = getSelectedCert();
                if (cert) handlePrint(cert);
              }}
              disabled={!selectedCertId}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 text-sm"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button
              onClick={() => {
                const cert = getSelectedCert();
                if (cert) handleExportPdf(cert);
              }}
              disabled={!selectedCertId}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 text-sm"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => {
                const cert = getSelectedCert();
                if (cert) { 
                   setSelectedCertificate(cert); 
                   setLinkedReceptionId(null);
                   setViewMode('form'); 
                }
              }}
              disabled={!selectedCertId}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              تعديل
            </button>
            <button
              onClick={() => {
                const cert = getSelectedCert();
                if (cert) { setSelectedCertificate(cert); setIsDetailsOpen(true); }
              }}
              disabled={!selectedCertId}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 text-sm"
            >
              <Eye className="w-4 h-4" />
              عرض تفاصيل الشهادة
            </button>
          </div>


        </div>
      </div>

      {/* ═══════════════════════════ MODALS ═══════════════════════════ */}
      {isDetailsOpen && selectedCertificate && (
        <CertificateDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          certificate={selectedCertificate}
        />
      )}

    </div>
  );
};

export default Certificates;
