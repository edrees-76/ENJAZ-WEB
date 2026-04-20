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
      await apiClient.get('/alerts/unread-count', { 
        timeout: 5000,
        // Don't trigger the global 401 interceptor for heartbeats if possible
        // but since it's already there, we just handle the result
      });
      set({ isServerAvailable: true });
    } catch (error: any) {
      // Logic: If the server responded with ANY status code (401, 500, etc.), 
      // the server is definitely reachable/available.
      // Only if there's NO response (network timeout, DNS failure, etc.) is it unavailable.
      if (error.response || error.code === 'ECONNABORTED') {
        // If we got a response, server is available.
        // ECONNABORTED with a response is handled above. 
        // If it's a pure timeout without response, error.response is undefined.
        if (error.response) {
          set({ isServerAvailable: true });
        } else {
          set({ isServerAvailable: false });
        }
      } else {
        set({ isServerAvailable: false });
      }
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
