import { create } from 'zustand';
import apiClient from '../services/apiClient';
import { setEntityCache, getEntityCache } from '../lib/db';

interface ChartDataPoint {
  label: string;
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
  chartSamples: ChartDataPoint[];
  chartCertificates: ChartDataPoint[];
}

type Period = "today" | "week" | "month" | "year";

interface DashboardState {
  stats: DashboardStats | null;
  period: Period;
  targetYear: number | null;
  loading: boolean;
  error: string | null;
  setPeriod: (p: Period) => void;
  setTargetYear: (y: number | null) => void;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  period: "year",
  targetYear: null,
  loading: false,
  error: null,
  setPeriod: (p) => {
    // If switching away from year, clear targetYear
    if (p !== "year") set({ targetYear: null });
    set({ period: p });
    get().fetchStats();
  },
  setTargetYear: (y) => {
    set({ targetYear: y, period: "year" }); // Auto switch to "year" period
    get().fetchStats();
  },
  fetchStats: async () => {
    set({ loading: true, error: null });
    const { period, targetYear } = get();
    // Get Timezone string safely
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    try {
      let url = `/dashboard/stats?period=${period}&timezone=${encodeURIComponent(tz)}`;
      if (targetYear && period === "year") {
        url += `&year=${targetYear}`;
      }
      const response = await apiClient.get(url);
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
