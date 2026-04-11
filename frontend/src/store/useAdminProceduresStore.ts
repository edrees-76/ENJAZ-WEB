import { create } from 'zustand';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ReferralLetterRecord {
  id: number;
  referenceNumber: string;
  generatedAt: string;
  senderName: string;
  certificateCount: number;
  sampleCount: number;
  startDate: string;
  endDate: string;
}

export interface PreviewItem {
  id: number;
  certificateNumber: string;
  supplier: string | null;
  notificationNumber: string | null;
  sampleCount: number;
  sampleNumbers: string;
}

// ═══════════════════════════════════════════════
// Bitmask Flags (must match backend ReferralColumns enum)
// ═══════════════════════════════════════════════
export const ReferralColumnFlags = {
  CertificateNumber: 1,
  Supplier: 2,
  Samples: 4,
  NotificationNumber: 8,
} as const;

// ═══════════════════════════════════════════════
// Store Interface
// ═══════════════════════════════════════════════

interface AdminProceduresState {
  // ═══ Wizard Slice ═══
  currentStep: 1 | 2 | 3;
  startDate: string;
  endDate: string;
  selectedSender: string | null;
  sendersList: string[];
  includeCertNum: boolean;
  includeSupplier: boolean;
  includeSamples: boolean;
  includeNotification: boolean;
  previewCount: number;
  previewSampleCount: number;
  previewItems: PreviewItem[];
  isGenerating: boolean;
  isPreviewing: boolean;

  // ═══ History Slice ═══
  history: ReferralLetterRecord[];
  historyPage: number;
  historyPageSize: number;
  historyTotalCount: number;
  selectedFilterSender: string | null;
  isLoadingHistory: boolean;

  // ═══ General ═══
  activeTab: 'wizard' | 'history';
  error: string | null;
  successMessage: string | null;

  // ═══ Actions ═══
  setActiveTab: (tab: 'wizard' | 'history') => void;
  setStep: (step: 1 | 2 | 3) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSelectedSender: (sender: string | null) => void;
  toggleColumn: (col: 'certNum' | 'supplier' | 'samples' | 'notification') => void;
  setFilterSender: (sender: string | null) => void;
  setHistoryPage: (page: number) => void;
  resetWizard: () => void;
  clearMessages: () => void;

  fetchSenders: () => Promise<void>;
  previewCertificates: () => Promise<void>;
  generateLetter: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  downloadPdf: (id: number, refNumber: string) => Promise<void>;
  deleteLetter: (id: number) => Promise<void>;
}

const API_BASE = 'http://localhost:5144/api/admin-procedures';

const today = new Date();
const yearStart = new Date(today.getFullYear(), 0, 1);

export const useAdminProceduresStore = create<AdminProceduresState>((set, get) => ({
  // ═══ Initial State ═══
  currentStep: 1,
  startDate: yearStart.toISOString().split('T')[0],
  endDate: today.toISOString().split('T')[0],
  selectedSender: null,
  sendersList: [],
  includeCertNum: true,
  includeSupplier: true,
  includeSamples: true,
  includeNotification: true,
  previewCount: 0,
  previewSampleCount: 0,
  previewItems: [],
  isGenerating: false,
  isPreviewing: false,

  history: [],
  historyPage: 1,
  historyPageSize: 10,
  historyTotalCount: 0,
  selectedFilterSender: null,
  isLoadingHistory: false,

  activeTab: 'wizard',
  error: null,
  successMessage: null,

  // ═══ Setters ═══
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => {
    const step = get().currentStep;
    if (step < 3) set({ currentStep: (step + 1) as 1 | 2 | 3 });
  },
  prevStep: () => {
    const step = get().currentStep;
    if (step > 1) set({ currentStep: (step - 1) as 1 | 2 | 3 });
  },
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setSelectedSender: (sender) => set({ selectedSender: sender }),
  setFilterSender: (sender) => set({ selectedFilterSender: sender, historyPage: 1 }),
  setHistoryPage: (page) => set({ historyPage: page }),
  clearMessages: () => set({ error: null, successMessage: null }),

  toggleColumn: (col) => {
    const map = {
      certNum: 'includeCertNum',
      supplier: 'includeSupplier',
      samples: 'includeSamples',
      notification: 'includeNotification',
    } as const;
    const key = map[col];
    const current = get()[key];

    // Don't allow unchecking all columns
    const activeCount = [
      get().includeCertNum, get().includeSupplier,
      get().includeSamples, get().includeNotification
    ].filter(Boolean).length;

    if (current && activeCount <= 1) return;
    set({ [key]: !current } as any);
  },

  resetWizard: () => set({
    currentStep: 1,
    startDate: yearStart.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    selectedSender: null,
    includeCertNum: true,
    includeSupplier: true,
    includeSamples: true,
    includeNotification: true,
    previewCount: 0,
    previewSampleCount: 0,
    previewItems: [],
    error: null,
    successMessage: null,
  }),

  // ═══ API Actions ═══

  fetchSenders: async () => {
    try {
      const res = await fetch(`${API_BASE}/senders`);
      if (!res.ok) return;
      const data: string[] = await res.json();
      set({ sendersList: data });
    } catch {
      // Silent fail — dropdown will be empty
    }
  },

  previewCertificates: async () => {
    const { selectedSender, startDate, endDate } = get();
    if (!selectedSender) return;

    set({ isPreviewing: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName: selectedSender, startDate, endDate }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل تحميل المعاينة');
      }

      const data = await res.json();
      set({
        previewCount: data.totalCertificates,
        previewSampleCount: data.totalSamples,
        previewItems: data.previewItems ?? [],
        isPreviewing: false,
      });
    } catch (err: any) {
      set({ error: err.message, isPreviewing: false });
    }
  },

  generateLetter: async () => {
    const {
      selectedSender, startDate, endDate,
      includeCertNum, includeSupplier, includeSamples, includeNotification
    } = get();

    if (!selectedSender) return;

    // Build bitmask
    let columns = 0;
    if (includeCertNum) columns |= ReferralColumnFlags.CertificateNumber;
    if (includeSupplier) columns |= ReferralColumnFlags.Supplier;
    if (includeSamples) columns |= ReferralColumnFlags.Samples;
    if (includeNotification) columns |= ReferralColumnFlags.NotificationNumber;

    set({ isGenerating: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: selectedSender,
          startDate,
          endDate,
          includedColumns: columns,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'فشل إنشاء رسالة الإحالة');
      }

      // Download the PDF blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      // Open the PDF automatically in a new tab
      window.open(url, '_blank');

      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = res.headers.get('content-disposition');
      a.download = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'referral.pdf'
        : 'referral.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Delay revoking so the new tab can load it
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      set({
        isGenerating: false,
        successMessage: 'تم إنشاء رسالة الإحالة بنجاح وتحميلها!',
      });

      // Refresh history & switch to history tab
      get().resetWizard();
      get().fetchHistory();
      setTimeout(() => set({ activeTab: 'history' }), 1500);

    } catch (err: any) {
      set({ error: err.message, isGenerating: false });
    }
  },

  fetchHistory: async () => {
    const { historyPage, historyPageSize, selectedFilterSender } = get();
    set({ isLoadingHistory: true, error: null });

    try {
      const params = new URLSearchParams({
        page: historyPage.toString(),
        pageSize: historyPageSize.toString(),
      });
      if (selectedFilterSender) params.set('sender', selectedFilterSender);

      const res = await fetch(`${API_BASE}/history?${params}`);
      if (!res.ok) throw new Error('فشل تحميل السجل');

      const data = await res.json();
      set({
        history: data.items,
        historyTotalCount: data.totalCount,
        isLoadingHistory: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoadingHistory: false });
    }
  },

  downloadPdf: async (id, refNumber) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/pdf`);
      if (!res.ok) throw new Error('فشل تحميل الملف');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      // Open the PDF automatically in a new tab
      window.open(url, '_blank');

      const a = document.createElement('a');
      a.href = url;
      a.download = `${refNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Delay revoking so the new tab can load it
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteLetter: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('فشل حذف الرسالة');

      set({ successMessage: 'تم حذف الرسالة بنجاح' });
      get().fetchHistory();
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
