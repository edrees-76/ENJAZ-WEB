import { create } from 'zustand';
import apiClient from '../services/apiClient';

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

const mockStats: DashboardStats = {
  totalSamples: 1250,
  samplesToday: 24,
  samplesEnvironmental: 850,
  samplesConsumable: 400,
  totalCertificates: 1100,
  certificatesToday: 15,
  certificatesEnvironmental: 780,
  certificatesConsumable: 320,
  monthlySamples: [
    { month: 'يناير', environmental: 65, consumable: 30 },
    { month: 'فبراير', environmental: 85, consumable: 45 },
    { month: 'مارس', environmental: 120, consumable: 55 },
    { month: 'أبريل', environmental: 95, consumable: 40 }
  ],
  monthlyCertificates: [
    { month: 'يناير', environmental: 60, consumable: 25 },
    { month: 'فبراير', environmental: 80, consumable: 40 },
    { month: 'مارس', environmental: 110, consumable: 50 },
    { month: 'أبريل', environmental: 90, consumable: 38 }
  ]
};

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get('/Dashboard/stats');
      set({ stats: response.data, loading: false });
    } catch (err: any) {
      console.log("DEMO MODE: Falling back to mock dashboard stats");
      set({ 
        stats: mockStats,
        error: null, 
        loading: false 
      });
    }
  }
}));
