import { create } from 'zustand';
import axios from 'axios';

interface Sample {
  id?: number;
  sampleNumber: string;
  description: string;
  root?: string;
}

interface SampleReception {
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
}

interface SampleState {
  receptions: SampleReception[];
  loading: boolean;
  error: string | null;
  fetchReceptions: () => Promise<void>;
  addReception: (reception: SampleReception) => Promise<boolean>;
  deleteReception: (id: number) => Promise<void>;
}

const API_URL = 'http://localhost:5173/api/samples'; // Base URL is handled by proxy or full URL

export const useSampleStore = create<SampleState>((set) => ({
  receptions: [],
  loading: false,
  error: null,

  fetchReceptions: async () => {
    set({ loading: true });
    try {
      const response = await axios.get('http://localhost:5034/api/samples');
      set({ receptions: response.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch samples', loading: false });
    }
  },

  addReception: async (reception) => {
    set({ loading: true });
    try {
      await axios.post('http://localhost:5034/api/samples', reception);
      set((state) => ({ loading: false }));
      return true;
    } catch (error) {
      set({ error: 'Failed to add sample reception', loading: false });
      return false;
    }
  },

  deleteReception: async (id) => {
    try {
      await axios.delete(`http://localhost:5034/api/samples/${id}`);
      set((state) => ({
        receptions: state.receptions.filter((r) => r.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete reception' });
    }
  },
}));
