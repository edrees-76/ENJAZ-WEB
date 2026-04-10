import { create } from 'zustand';
import axios from 'axios';

export interface Sample {
  id?: number;
  sampleNumber: string;
  description: string;
  root?: string;
}

export interface SampleReception {
  id?: number;
  sequence?: number;
  analysisRequestNumber: string;
  notificationNumber?: string;
  declarationNumber?: string;
  supplier?: string;
  sender: string;
  origin?: string;
  policyNumber?: string;
  financialReceiptNumber?: string;
  certificateType: string;
  date: string;
  status?: string;
  samples: Sample[];
  createdAt?: string;
  createdByName?: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedAt?: string;
}

const mockReceptions: SampleReception[] = [
  {
    id: 1,
    analysisRequestNumber: "REQ-001",
    notificationNumber: "NOTIF-324",
    declarationNumber: "DEC-1122",
    supplier: "شركة الاستيراد المتحدة",
    sender: "جمارك الميناء",
    origin: "الصين",
    certificateType: "استهلاكية",
    date: "2026-04-06",
    status: "قيد التحليل",
    samples: [
      { id: 1, sampleNumber: "A-55324", description: "ألعاب أطفال", root: "1" },
      { id: 2, sampleNumber: "S-55325", description: "ملابس قطنية", root: "2" }
    ]
  },
  {
    id: 2,
    analysisRequestNumber: "REQ-002",
    notificationNumber: "NOTIF-999",
    declarationNumber: "DEC-4433",
    supplier: "مؤسسة البناء",
    sender: "هيئة البيئة",
    origin: "محلي",
    certificateType: "بيئية",
    date: "2026-04-05",
    status: "قيد التحليل",
    samples: [
      { id: 3, sampleNumber: "ENV-001", description: "عينة تربة فحص اشعاعي", root: "1" }
    ]
  }
];

interface SampleState {
  receptions: SampleReception[];
  loading: boolean;
  error: string | null;
  fetchReceptions: () => Promise<void>;
  clearReceptions: () => void;
  addReception: (reception: SampleReception) => Promise<boolean>;
  deleteReception: (id: number) => Promise<void>;
  updateReception: (id: number, reception: SampleReception) => Promise<boolean>;
}

export const useSampleStore = create<SampleState>((set) => ({
  receptions: [],
  loading: false,
  error: null,

  fetchReceptions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('http://localhost:5144/api/samples', {
        timeout: 10000,
      });
      
      const rawData = response.data;
      let data: SampleReception[] = [];
      
      if (Array.isArray(rawData)) {
        data = rawData
          .filter((item: any) => item != null)
          .map((item: any) => ({
            ...item,
            samples: Array.isArray(item.samples) ? item.samples : [],
            sender: item.sender || '-',
            certificateType: item.certificateType || '-',
            date: item.date || new Date().toISOString(),
          }));
      }
        
      set({ receptions: data, loading: false });
    } catch (error) {
      console.error('fetchReceptions error:', error);
      set({ receptions: [], loading: false });
    }
  },

  clearReceptions: () => {
    set({ receptions: [] });
  },

  addReception: async (reception) => {
    set({ loading: true });
    try {
      await axios.post('http://localhost:5144/api/samples', reception);
      set(() => ({ loading: false }));
      return true;
    } catch (error) {
      set({ error: 'Failed to add sample reception', loading: false });
      return false;
    }
  },

  deleteReception: async (id) => {
    try {
      await axios.delete(`http://localhost:5144/api/samples/${id}`);
      set((state) => ({
        receptions: state.receptions.filter((r) => r.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete reception' });
    }
  },

  updateReception: async (id, reception) => {
    set({ loading: true });
    try {
      const response = await axios.put(`http://localhost:5144/api/samples/${id}`, reception);
      const updatedItem = response.data;
      
      set((state) => ({
        receptions: state.receptions.map((r) => r.id === id ? updatedItem : r),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to update sample reception', loading: false });
      return false;
    }
  },
}));
