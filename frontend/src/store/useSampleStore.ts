import { create } from 'zustand';
import apiClient from '../services/apiClient';
import { v4 as uuidv4 } from 'uuid';
import { addOperationToQueue, setEntityCache, getEntityCache } from '../lib/db';
import { useSyncStore } from './useSyncStore';

const syncChannel = new BroadcastChannel('sync-status-updates');
syncChannel.onmessage = (event) => {
  if (event.data.type === 'SYNC_DONE' && event.data.entityType === 'samples') {
    const { tempId, newRecord } = event.data;
    if (tempId && newRecord) {
      // Access the store directly to update
      const store = useSampleStore.getState();
      store.reconcileSyncedItem(tempId, newRecord);
    }
  }
};

// Exported for cleanup during HMR or app teardown to prevent memory leaks
export const disposeSampleSync = () => {
  syncChannel.close();
};


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
  addReception: (reception: SampleReception) => Promise<boolean | 'queued'>;
  deleteReception: (id: number) => Promise<void>;
  updateReception: (id: number, reception: SampleReception) => Promise<boolean | 'queued'>;
  reconcileSyncedItem: (tempId: number, realRecord: SampleReception) => void;
}

export const useSampleStore = create<SampleState>((set) => ({
  receptions: [],
  loading: false,
  error: null,

  fetchReceptions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/samples', {
        timeout: 10000,
      });
      
      const rawData = response.data;
      let dataList: any[] = [];
      
      if (rawData && Array.isArray(rawData.items)) {
          dataList = rawData.items;
      } else if (Array.isArray(rawData)) {
          dataList = rawData;
      }
      
      let data: SampleReception[] = [];
      if (dataList.length > 0) {
        data = dataList
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
      
      // Save to Offline Cache (fire-and-forget — never blocks UI)
      setEntityCache('receptions', data).catch(e =>
        console.warn('Cache save failed (non-critical):', e)
      );
      return; // Success — exit early
    } catch (error) {
      console.error('fetchReceptions: API failed, trying local cache:', error);
    }

    // API failed — try loading from cache
    try {
      const cachedData = await getEntityCache('receptions');
      if (cachedData) {
        set({ receptions: cachedData, loading: false, error: null });
      } else {
        set({ receptions: [], loading: false });
      }
    } catch (cacheError) {
      console.warn('Cache read also failed:', cacheError);
      set({ receptions: [], loading: false });
    }
  },

  clearReceptions: () => {
    set({ receptions: [] });
  },

  addReception: async (reception) => {
    set({ loading: true });
    try {
      // Try online first
      const response = await apiClient.post('/samples', reception);
      set({ loading: false });
      return true;
    } catch (error: any) {
      // If the backend is down (e.g., ERR_NETWORK, no response) OR offline, fallback to queue
      if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !navigator.onLine) {
        const tempId = -Math.floor(Math.random() * 1000000);
        const optimisticReception: SampleReception = { 
          ...reception, 
          id: tempId,
          status: 'بانتظار المزامنة 🟡' 
        };

        await addOperationToQueue({
          id: uuidv4(),
          method: 'POST',
          url: '/samples',
          payload: reception,
          idempotencyKey: uuidv4(),
          tempId: tempId
        });
        
        set((state) => {
          const newReceptions = [optimisticReception, ...state.receptions];
          // Also update the local offline cache so the optimistic item survives navigation/refresh
          setEntityCache('receptions', newReceptions).catch(e => 
            console.warn('Failed to save optimistic reception to cache', e)
          );
          
          return { 
            receptions: newReceptions,
            loading: false 
          };
        });
        
        useSyncStore.getState().refreshCounts();
        return 'queued';
      }

      set({ error: 'Failed to add sample reception', loading: false });
      return false;
    }
  },

  deleteReception: async (id) => {
    try {
      await apiClient.delete(`/samples/${id}`);
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
      const response = await apiClient.put(`/samples/${id}`, reception);
      const updatedItem = response.data;
      
      set((state) => ({
        receptions: state.receptions.map((r) => r.id === id ? updatedItem : r),
        loading: false
      }));
      return true;
    } catch (error: any) {
      // If the backend is down (e.g., ERR_NETWORK, no response), fallback to offline queue
      if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !navigator.onLine) {
        await addOperationToQueue({
          id: uuidv4(),
          method: 'PUT',
          url: `/samples/${id}`,
          payload: reception,
          idempotencyKey: uuidv4(),
        });
        
        useSyncStore.getState().refreshCounts();
        set((state) => {
          const updatedReception = { ...state.receptions.find(r => r.id === id), ...reception, status: 'بانتظار التعديل 🟡' } as SampleReception;
          const newReceptions = state.receptions.map((r) => r.id === id ? updatedReception : r);
          
          setEntityCache('receptions', newReceptions).catch(e => 
            console.warn('Failed to save optimistic update to cache', e)
          );
          
          return {
            receptions: newReceptions,
            loading: false
          };
        });
        
        return 'queued';
      }

      set({ error: 'Failed to update sample reception', loading: false });
      return false;
    }
  },

  reconcileSyncedItem: (tempId, realRecord) => {
    set((state) => ({
      receptions: state.receptions.map((r) => r.id === tempId ? realRecord : r)
    }));
    console.log(`[Sample Store] Reconciled item: ${tempId} -> ${realRecord.id}`);
  },
}));
