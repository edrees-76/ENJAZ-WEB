import { create } from 'zustand';
import apiClient from '../services/apiClient';
import { setEntityCache, getEntityCache } from '../lib/db';

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

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/dashboard/stats');
      const data = response.data;
      set({ stats: data, loading: false });

      // Save to Offline Cache (fire-and-forget — never blocks UI)
      setEntityCache('dashboard_stats', data).catch(e =>
        console.warn('Cache save failed (non-critical):', e)
      );
      return; // Success — exit early
    } catch (err: any) {
      console.error('fetchStats: API failed, trying local cache:', err);
    }

    // API failed — try loading from cache
    try {
      const cachedData = await getEntityCache('dashboard_stats');
      if (cachedData) {
        set({ stats: cachedData, loading: false, error: null });
      } else {
        set({ 
          stats: null,
          error: "لا يمكن الوصول للخادم ولا يوجد بيانات مخزنة محلياً", 
          loading: false 
        });
      }
    } catch (cacheError) {
      console.warn('Cache read also failed:', cacheError);
      set({ 
        stats: null,
        error: "تعذر الاتصال بالخادم", 
        loading: false 
      });
    }
  }
}));
