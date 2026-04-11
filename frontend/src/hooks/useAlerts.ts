import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Types
export type AlertSeverity = 0 | 1 | 2; // Info, Warning, Critical

export type Alert = {
  id: number;
  type: string;
  severity: AlertSeverity;
  entityId: number;
  title: string;
  message?: string;
  isResolved: boolean;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5144/api/v1';

export const useAlerts = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  // Fetch Alerts
  const { data: alerts = [], isLoading, error } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const resp = await axios.get(`${API_BASE}/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return resp.data;
    },
    enabled: !!token,
  });

  // Fetch Unread Count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['alerts', 'unread-count'],
    queryFn: async () => {
      const resp = await axios.get(`${API_BASE}/alerts/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return resp.data.count;
    },
    enabled: !!token,
  });

  // Mark as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.post(`${API_BASE}/alerts/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  // I1: تم حذف useCallback غير المستخدم
  // M8: تم نقل اتصال SignalR إلى SignalRProvider — اتصال عام واحد فقط

  return {
    alerts,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
  };
};
