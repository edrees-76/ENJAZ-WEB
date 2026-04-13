import { create } from 'zustand';
import apiClient from '../services/apiClient';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export enum ReportColumn {
  CertificateNumber = 0,
  CertificateType = 1,
  AnalysisType = 2,
  Sender = 3,
  Supplier = 4,
  Origin = 5,
  NotificationNumber = 6,
  DeclarationNumber = 7,
  FinancialReceiptNumber = 8,
  SampleCount = 9,
  EnvSampleCount = 10,
  ConsSampleCount = 11,
  CreatedByName = 12,
  IssueDate = 13
}

export const COLUMN_LABELS: Record<ReportColumn, string> = {
  [ReportColumn.CertificateNumber]: 'رقم الشهادة',
  [ReportColumn.CertificateType]: 'نوع الشهادة',
  [ReportColumn.AnalysisType]: 'نوع التحليل',
  [ReportColumn.Sender]: 'الجهة المرسلة',
  [ReportColumn.Supplier]: 'المورد',
  [ReportColumn.Origin]: 'بلد المنشأ',
  [ReportColumn.NotificationNumber]: 'رقم الإخطار',
  [ReportColumn.DeclarationNumber]: 'الإقرار الجمركي',
  [ReportColumn.FinancialReceiptNumber]: 'الإيصال المالي',
  [ReportColumn.SampleCount]: 'عدد العينات',
  [ReportColumn.EnvSampleCount]: 'عينات بيئية',
  [ReportColumn.ConsSampleCount]: 'عينات استهلاكية',
  [ReportColumn.CreatedByName]: 'المُنشئ',
  [ReportColumn.IssueDate]: 'تاريخ الإصدار',
};

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
}

export interface ReportSummary {
  totalCertificates: number;
  totalSamples: number;
  environmentalCertificates: number;
  consumableCertificates: number;
  environmentalSamples: number;
  consumableSamples: number;
  timeline: ChartDataPoint[];
  certDistribution: ChartDataPoint[];
  topSuppliers: ChartDataPoint[];
  topSenders: ChartDataPoint[];
  topOrigins: ChartDataPoint[];
  monthlyPerformance: ChartDataPoint[];
  sampleTypeComparison: ChartDataPoint[];
  topAnalysisTypes: ChartDataPoint[];
}

export interface CertificateReportRow {
  certificateNumber: string;
  certificateType: string;
  analysisType?: string;
  sender?: string;
  supplier?: string;
  origin?: string;
  notificationNumber?: string;
  declarationNumber?: string;
  financialReceiptNumber?: string;
  sampleCount: number;
  envSampleCount: number;
  consSampleCount: number;
  createdByName?: string;
  issueDate: string;
}

export interface PagedResult<T> {
  data: T[];
  totalCount: number;
}

// ═══════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════

interface ReportState {
  // الفلاتر
  reportType: 'general' | 'sender';
  startDate: string;
  endDate: string;
  selectedSender: string | null;
  selectedColumns: ReportColumn[];
  currentPage: number;
  pageSize: number;

  // البيانات
  summary: ReportSummary | null;
  sendersList: string[];
  tableData: CertificateReportRow[];
  tableTotalCount: number;

  // حالات التحميل
  summaryLoading: boolean;
  tableLoading: boolean;
  exporting: boolean;
  error: string | null;

  // هل تم تحميل البيانات أم لا
  hasFetched: boolean;
  showTable: boolean;

  // الإجراءات
  setReportType: (type: 'general' | 'sender') => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setSender: (sender: string | null) => void;
  toggleColumn: (column: ReportColumn) => void;
  setPage: (page: number) => void;
  setShowTable: (show: boolean) => void;

  fetchSummary: () => Promise<void>;
  fetchTable: () => Promise<void>;
  fetchSenders: () => Promise<void>;
  exportExcel: () => Promise<void>;
  exportPdf: () => Promise<void>;
  resetFilters: () => void;
}

// API_BASE is no longer needed — apiClient.baseURL handles this

// الأعمدة الافتراضية
const DEFAULT_COLUMNS: ReportColumn[] = [
  ReportColumn.CertificateNumber,
  ReportColumn.CertificateType,
  ReportColumn.Sender,
  ReportColumn.Supplier,
  ReportColumn.Origin,
  ReportColumn.SampleCount,
  ReportColumn.IssueDate,
];

// تواريخ افتراضية: أول السنة — اليوم
const today = new Date();
const yearStart = new Date(today.getFullYear(), 0, 1);

export const useReportStore = create<ReportState>((set, get) => ({
  // الحالة الأولية
  reportType: 'general',
  startDate: yearStart.toISOString().split('T')[0],
  endDate: today.toISOString().split('T')[0],
  selectedSender: null,
  selectedColumns: [...DEFAULT_COLUMNS],
  currentPage: 1,
  pageSize: 50,

  summary: null,
  sendersList: [],
  tableData: [],
  tableTotalCount: 0,

  summaryLoading: false,
  tableLoading: false,
  exporting: false,
  error: null,
  hasFetched: false,
  showTable: false,

  // === Setters ===
  setReportType: (type) => set({ reportType: type }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setSender: (sender) => set({ selectedSender: sender }),
  setPage: (page) => set({ currentPage: page }),
  setShowTable: (show) => set({ showTable: show }),

  toggleColumn: (column) => {
    const current = get().selectedColumns;
    if (current.includes(column)) {
      if (current.length <= 1) return; // لا تسمح بإزالة كل الأعمدة
      set({ selectedColumns: current.filter(c => c !== column) });
    } else {
      set({ selectedColumns: [...current, column] });
    }
  },

  resetFilters: () => set({
    reportType: 'general',
    startDate: yearStart.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    selectedSender: null,
    selectedColumns: [...DEFAULT_COLUMNS],
    currentPage: 1,
    summary: null,
    tableData: [],
    tableTotalCount: 0,
    hasFetched: false,
    showTable: false,
    error: null,
  }),

  // === API Calls ===

  fetchSummary: async () => {
    const { startDate, endDate, selectedSender } = get();
    set({ summaryLoading: true, error: null });

    try {
      const { data } = await apiClient.post('/reports/summary', {
          reportType: get().reportType,
          senderName: get().selectedSender,
          startDate,
          endDate,
          sender: selectedSender || undefined,
      });

      set({ summary: data, hasFetched: true, summaryLoading: false });
    } catch (err: any) {
      set({ error: err.message, summaryLoading: false });
    }
  },

  fetchTable: async () => {
    const { startDate, endDate, selectedSender, currentPage, pageSize, selectedColumns } = get();
    set({ tableLoading: true, error: null });

    try {
      const { data } = await apiClient.post('/reports/table', {
          reportType: get().reportType,
          senderName: get().selectedSender,
          startDate,
          endDate,
          sender: selectedSender || undefined,
          page: currentPage,
          pageSize,
          columns: selectedColumns,
      });

      set({ tableData: data.data, tableTotalCount: data.totalCount, tableLoading: false, showTable: true });
    } catch (err: any) {
      set({ error: err.message, tableLoading: false });
    }
  },

  fetchSenders: async () => {
    try {
      const { data } = await apiClient.get('/reports/senders');
      set({ sendersList: data });
    } catch {
      // لا نعرض خطأ — القائمة ستكون فارغة فقط
    }
  },

  exportExcel: async () => {
    const { startDate, endDate, selectedSender, selectedColumns } = get();
    set({ exporting: true });

    try {
      const { data } = await apiClient.post('/reports/export/excel', {
          reportType: get().reportType,
          senderName: get().selectedSender,
          startDate,
          endDate,
          sender: selectedSender || undefined,
          columns: selectedColumns,
      }, { responseType: 'blob' });

      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const timestamp = `${now.toLocaleDateString('en-CA')}_${now.getHours().toString().padStart(2,'0')}-${now.getMinutes().toString().padStart(2,'0')}`;
      const fileName = get().reportType === 'sender'
        ? `${get().selectedSender}_${timestamp}.xlsx`
        : `التقرير_العام_${timestamp}.xlsx`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ exporting: false });
    }
  },

  exportPdf: async () => {
    const { startDate, endDate, selectedSender, selectedColumns } = get();
    set({ exporting: true });

    try {
      const { data } = await apiClient.post('/reports/export/pdf', {
          reportType: get().reportType,
          senderName: get().selectedSender,
          startDate,
          endDate,
          sender: selectedSender || undefined,
          columns: selectedColumns,
      }, { responseType: 'blob' });

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const timestamp = `${now.toLocaleDateString('en-CA')}_${now.getHours().toString().padStart(2,'0')}-${now.getMinutes().toString().padStart(2,'0')}`;
      const fileName = get().reportType === 'sender'
        ? `${get().selectedSender}_${timestamp}.pdf`
        : `التقرير_العام_${timestamp}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ exporting: false });
    }
  },
}));
