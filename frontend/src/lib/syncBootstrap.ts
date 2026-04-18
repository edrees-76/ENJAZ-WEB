import { initLeaderElection } from '../sync/leader';
import { startSyncEngine } from '../sync/engine';
import { useSyncStore } from '../store/useSyncStore';

let initialized = false;

/**
 * Initializes the entire enterprise sync infrastructure.
 */
export const initSyncBootstrap = () => {
  if (initialized) return;
  initialized = true;

  console.log('[Sync Bootstrap] Initializing Enterprise Sync System...');

  // 1. Initialize Leader Election (Multi-tab safety)
  initLeaderElection();

  // 2. Start the Engine Loop (Smart Scheduler)
  startSyncEngine();

  // 3. Start Server Heartbeat (Real-time connectivity monitoring)
  useSyncStore.getState().checkServerStatus(); // Initial check
  setInterval(() => {
    useSyncStore.getState().checkServerStatus();
  }, 5000);

  console.log('[Sync Bootstrap] System Ready.');
};
