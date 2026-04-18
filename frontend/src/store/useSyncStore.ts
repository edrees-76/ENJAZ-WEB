import { create } from 'zustand';
import { getActiveOperations } from '../lib/db';
import apiClient from '../services/apiClient';

interface SyncState {
  isOnline: boolean;
  isServerAvailable: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  refreshCounts: () => Promise<void>;
  setSyncing: (status: boolean) => void;
  checkServerStatus: () => Promise<void>;
}

// Global channel for UI updates from the Sync Engine
const syncChannel = new BroadcastChannel('sync-status-updates');

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isServerAvailable: true,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,

  checkServerStatus: async () => {
    try {
      // Use a lightweight endpoint to check connectivity
      await apiClient.get('/alerts/unread-count', { timeout: 3000 });
      set({ isServerAvailable: true });
    } catch (error) {
      set({ isServerAvailable: false });
    }
  },

  refreshCounts: async () => {
    try {
      const ops = await getActiveOperations();
      set({
        pendingCount: ops.filter(o => ['pending', 'queued', 'retrying', 'executing'].includes(o.status)).length,
        failedCount: ops.filter(o => o.status === 'failed' || o.status === 'blocked').length,
      });
    } catch (error) {
      console.error('Failed to refresh queue counts:', error);
    }
  },

  setSyncing: (status) => set({ isSyncing: status }),
}));

// Setup global listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useSyncStore.setState({ isOnline: true }));
  window.addEventListener('offline', () => useSyncStore.setState({ isOnline: false }));

  // Refresh counts whenever the engine finishes an operation
  syncChannel.onmessage = (event) => {
    if (event.data.type === 'SYNC_DONE' || event.data.type === 'QUEUE_UPDATED') {
      useSyncStore.getState().refreshCounts();
    }
  };

  // Initial count load
  useSyncStore.getState().refreshCounts();
}
