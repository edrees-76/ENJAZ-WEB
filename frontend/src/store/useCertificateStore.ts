import { create } from 'zustand';
import apiClient from '../services/apiClient';

export type CertificateType = 'بيئية' | 'استهلاكية';

export interface CertificateSample {
  id: number;
  root: number; // التسلسل (م)
  sampleNumber: string; // رقم العينة
  description: string; // الوصف
  measurementDate: string | null; // تاريخ القياس
  // Consumable specific
  result?: string; // النتيجة للبيكريل
  // Environmental specific
  isotopeK40?: string;
  isotopeRa226?: string;
  isotopeTh232?: string;
  isotopeRa?: string;
  isotopeCs137?: string;
}

export interface Certificate {
  id: number;
  certificateNumber: string; // رقم الشهادة
  certificateType: CertificateType; // نوع الشهادة
  sender: string; // الجهة المرسلة
  supplier: string; // المورد
  origin: string; // بلد المنشأ
  analysisType: string; // نوع التحليل
  sampleCount: number; // عدد العينات
  
  // Custom/Financial Data
  declarationNumber: string; // رقم الاقرار
  notificationNumber: string; // رقم الاخطار
  policyNumber: string; // رقم الوثيقة / البوليصة
  financialReceiptNumber: string; // رقم الإيصال المالي
  
  // Logistics
  issueDate: string; // تاريخ الإصدار
  
  // Signatures & Notes
  specialistName: string;
  sectionHeadName: string;
  managerName: string;
  notes: string;

  // System Tracking
  createdByName?: string;
  createdAt?: string;
  sampleReceptionId?: number;
  sampleReception?: {
    createdByName?: string;
    createdAt?: string;
    date?: string;
    analysisRequestNumber?: string;
  };

  samples: CertificateSample[];
}

interface CertificateState {
  certificates: Certificate[];
  selectedCertificate: Certificate | null;
  totalCount: number;
  
  // API Flags
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCertificates: (page?: number, pageSize?: number) => Promise<void>;
  clearCertificates: () => void;
  fetchCertificateById: (id: number) => Promise<Certificate | null>;
  setSelectedCertificate: (cert: Certificate | null) => void;
  createCertificate: (cert: Omit<Certificate, 'id' | 'certificateNumber'>) => Promise<Certificate | false>;
  updateCertificate: (id: number, certData: Partial<Certificate>) => Promise<boolean>;
  deleteCertificate: (id: number) => Promise<void>;
}

export const useCertificateStore = create<CertificateState>((set) => ({
  certificates: [],
  selectedCertificate: null,
  totalCount: 0,
  isLoading: false,
  error: null,

  fetchCertificates: async (page = 1, pageSize = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/certificates?page=${page}&pageSize=${pageSize}`);
      // Handle the case where the backend might still return the old array format during hot reload,
      // or the new { totalCount, items } format.
      if (Array.isArray(response.data)) {
         set({ certificates: response.data, totalCount: response.data.length, isLoading: false });
      } else {
         set({ certificates: response.data.items || [], totalCount: response.data.totalCount || 0, isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      set({ certificates: [], totalCount: 0 });
    }
  },

  clearCertificates: () => {
    set({ certificates: [] });
  },

  fetchCertificateById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/certificates/${id}`);
      set({ isLoading: false });
      return response.data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  setSelectedCertificate: (cert) => {
    set({ selectedCertificate: cert });
  },

  createCertificate: async (certData) => {
    set({ isLoading: true, error: null });
    try {
      const backendData = {
        certificateType: certData.certificateType,
        sender: certData.sender,
        supplier: certData.supplier,
        origin: certData.origin,
        analysisType: certData.analysisType,
        sampleCount: certData.samples.length,
        declarationNumber: certData.declarationNumber,
        notificationNumber: certData.notificationNumber,
        policyNumber: certData.policyNumber,
        financialReceiptNumber: certData.financialReceiptNumber,
        issueDate: certData.issueDate,
        specialistName: certData.specialistName,
        sectionHeadName: certData.sectionHeadName,
        managerName: certData.managerName,
        notes: certData.notes,
        sampleReceptionId: certData.sampleReceptionId,
        samples: certData.samples.map(s => ({
          root: typeof s.root === 'string' ? parseInt(s.root as unknown as string) || 0 : (s.root || 0),
          sampleNumber: s.sampleNumber || '',
          description: s.description || '',
          measurementDate: s.measurementDate && s.measurementDate.trim() !== '' ? s.measurementDate : null,
          result: s.result || null,
          isotopeK40: s.isotopeK40 || null,
          isotopeRa226: s.isotopeRa226 || null,
          isotopeTh232: s.isotopeTh232 || null,
          isotopeRa: s.isotopeRa || null,
          isotopeCs137: s.isotopeCs137 || null
        }))
      };

      const response = await apiClient.post('/certificates', backendData);
      const newCert = response.data;

      set((state) => ({
        certificates: [newCert, ...state.certificates],
        isLoading: false
      }));
      return newCert;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
      return false;
    }
  },

  updateCertificate: async (id, updatedData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/certificates/${id}`, updatedData);
      const updatedCert = response.data;
      set((state) => ({
        certificates: state.certificates.map(c => c.id === id ? updatedCert : c),
        isLoading: false
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  deleteCertificate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/certificates/${id}`);
      set((state) => ({
        certificates: state.certificates.filter(c => c.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
