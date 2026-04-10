import { create } from 'zustand';
import axios from 'axios';

interface MonthlyStat {
  month: string;
  environmental: number;
  consumable: number;
}

interface DashboardStats {
  totalSamples: number;
  samplesToday: number;
  samplesEnvironmental: number;
  samplesConsumable: number;
  totalCertificates: number;
  certificatesToday: number;
  certificatesEnvironmental: number;
  certificatesConsumable: number;
  monthlySamples: MonthlyStat[];
  monthlyCertificates: MonthlyStat[];
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5144/api';

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('enjaz-auth') 
        ? JSON.parse(localStorage.getItem('enjaz-auth')!).state.token 
        : null;
        
      const response = await axios.get(`${API_URL}/Dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ stats: response.data, loading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'فشل في جلب إحصائيات لوحة التحكم', 
        loading: false 
      });
    }
  }
}));
