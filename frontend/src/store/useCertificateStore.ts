import { create } from 'zustand';
import apiClient from '../services/apiClient';
import { v4 as uuidv4 } from 'uuid';
import { addOperationToQueue, setEntityCache, getEntityCache } from '../lib/db';
import { useSyncStore } from './useSyncStore';
import { useSampleStore } from './useSampleStore';

const syncChannel = new BroadcastChannel('sync-status-updates');
syncChannel.onmessage = (event) => {
  if (event.data.type === 'SYNC_DONE' && event.data.entityType === 'certificates') {
    const { tempId, newRecord } = event.data;
    if (tempId && newRecord) {
      const store = useCertificateStore.getState();
      store.reconcileSyncedItem(tempId, newRecord);
    }
  }
};

// Exported for cleanup during HMR or app teardown to prevent memory leaks
export const disposeCertificateSync = () => {
  syncChannel.close();
};

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
  createCertificate: (cert: Omit<Certificate, 'id' | 'certificateNumber'>) => Promise<Certificate | false | 'queued'>;
  updateCertificate: (id: number, certData: Partial<Certificate>) => Promise<boolean | 'queued'>;
  deleteCertificate: (id: number) => Promise<void>;
  reconcileSyncedItem: (tempId: number, realRecord: Certificate) => void;
  clearError: () => void;
}

export const useCertificateStore = create<CertificateState>((set) => ({
  certificates: [],
  selectedCertificate: null,
  totalCount: 0,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCertificates: async (page = 1, pageSize = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/certificates?page=${page}&pageSize=${pageSize}`);
      let data;
      let total;

      if (Array.isArray(response.data)) {
        data = response.data;
        total = response.data.length;
      } else {
        data = response.data.items || [];
        total = response.data.totalCount || 0;
      }

      set({ certificates: data, totalCount: total, isLoading: false });

      // Save to Offline Cache (fire-and-forget — never blocks UI)
      setEntityCache('certificates', { data, total }).catch(e =>
        console.warn('Cache save failed (non-critical):', e)
      );
      return; // Success — exit early
    } catch (err: any) {
      console.error('fetchCertificates: API failed, trying local cache:', err);
    }

    // API failed — try loading from cache
    try {
      const cached = await getEntityCache('certificates');
      if (cached) {
        set({ certificates: cached.data, totalCount: cached.total, isLoading: false, error: null });
      } else {
        set({ error: "لا يمكن الوصول للخادم ولا يوجد بيانات مخزنة محلياً", isLoading: false, certificates: [], totalCount: 0 });
      }
    } catch (cacheError) {
      console.warn('Cache read also failed:', cacheError);
      set({ error: 'تعذر الاتصال بالخادم', isLoading: false, certificates: [], totalCount: 0 });
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

      if (!navigator.onLine) {
        const tempId = -Math.floor(Math.random() * 1000000);
        const relations = [];
        if (typeof certData.sampleReceptionId === 'number' && certData.sampleReceptionId < 0) {
          relations.push({ fieldPath: 'sampleReceptionId', tempId: certData.sampleReceptionId });
        }

        await addOperationToQueue({
          id: uuidv4(),
          method: 'POST',
          url: '/certificates',
          payload: backendData,
          idempotencyKey: uuidv4(),
          tempId: tempId,
          relations
        });
        
        useSyncStore.getState().refreshCounts();
        set({ isLoading: false });
        return 'queued';
      }

      const response = await apiClient.post('/certificates', backendData);
      const newCert = response.data;

      // Update the reception in sample store if it was linked
      if (backendData.sampleReceptionId) {
        useSampleStore.setState((state) => ({
          receptions: state.receptions.map(r => r.id === backendData.sampleReceptionId ? {
            ...r,
            financialReceiptNumber: backendData.financialReceiptNumber,
            policyNumber: backendData.policyNumber,
            declarationNumber: backendData.declarationNumber,
            notificationNumber: backendData.notificationNumber,
            status: 'تم إصدار شهادة'
          } : r)
        }));
      }

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
      if (!navigator.onLine) {
        await addOperationToQueue({
          id: uuidv4(),
          method: 'PUT',
          url: `/certificates/${id}`,
          payload: updatedData,
          idempotencyKey: uuidv4(),
        });
        
        useSyncStore.getState().refreshCounts();
        set({ isLoading: false });
        return 'queued';
      }

      const response = await apiClient.put(`/certificates/${id}`, updatedData);
      const updatedCert = response.data;

      // Update the reception in sample store if it was linked
      if (updatedData.sampleReceptionId || updatedCert.sampleReceptionId) {
        const receptionId = updatedData.sampleReceptionId || updatedCert.sampleReceptionId;
        useSampleStore.setState((state) => ({
          receptions: state.receptions.map(r => r.id === receptionId ? {
            ...r,
            financialReceiptNumber: updatedData.financialReceiptNumber,
            policyNumber: updatedData.policyNumber,
            declarationNumber: updatedData.declarationNumber,
            notificationNumber: updatedData.notificationNumber
          } : r)
        }));
      }

      set((state) => ({
        certificates: state.certificates.map(c => c.id === id ? updatedCert : c),
        isLoading: false
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
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
  },
  reconcileSyncedItem: (tempId, realRecord) => {
    set((state) => ({
      certificates: state.certificates.map((c) => c.id === tempId ? realRecord : c)
    }));
    console.log(`[Certificate Store] Reconciled item: ${tempId} -> ${realRecord.id}`);
  },
}));
