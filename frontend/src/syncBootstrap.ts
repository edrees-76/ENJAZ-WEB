import { initLeaderElection } from './sync/leader';
import { startSyncEngine } from './sync/engine';

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

  console.log('[Sync Bootstrap] System Ready.');
};
