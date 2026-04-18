import { getActiveOperations } from '../lib/db';
import type { SyncOperation } from '../lib/db';
import { checkIfLeader } from './leader';
import { executeOperation } from './executor';
import { useSyncStore } from '../store/useSyncStore';

let isRunning = false;
let timeoutId: any = null;

/**
 * Starts the smart scheduler loop.
 */
export function startSyncEngine() {
  if (isRunning) return;
  isRunning = true;
  console.log('[Sync Engine] Scheduler started.');

  // Immediate sync when coming back online
  window.addEventListener('online', () => {
    console.log('[Sync Engine] Network back online. Triggering immediate sync.');
    processQueue();
  });

  scheduleNextTick();
}

/**
 * Stops the scheduler.
 */
export function stopSyncEngine() {
  isRunning = false;
  if (timeoutId) clearTimeout(timeoutId);
  console.log('[Sync Engine] Scheduler stopped.');
}

async function scheduleNextTick() {
  if (!isRunning) return;

  try {
    await processQueue();
  } catch (err) {
    console.error('[Sync Engine] Error in processQueue:', err);
  }

  // Schedule next run (1 second delay to be browser-friendly)
  timeoutId = setTimeout(scheduleNextTick, 2000);
}

async function processQueue() {
  // Only the leader tab is allowed to execute the queue
  if (!checkIfLeader()) {
    return;
  }

  const operations = await getActiveOperations();
  if (operations.length === 0) {
    useSyncStore.getState().setSyncing(false);
    return;
  }

  console.log(`[Sync Engine] Found ${operations.length} active operations.`);
  useSyncStore.getState().setSyncing(true);

  for (const op of operations) {
    // Check if dependencies are resolved
    if (!areDependenciesResolved(op, operations)) {
      continue;
    }

    // Skip if already being processed by another tab
    if (op.status === 'executing' || op.status === 'success') continue;

    // Execute!
    await executeOperation(op);
  }

  useSyncStore.getState().setSyncing(false);
}

function areDependenciesResolved(op: SyncOperation, allOps: SyncOperation[]): boolean {
  if (!op.dependsOn || op.dependsOn.length === 0) return true;

  return op.dependsOn.every(depId => {
    const dependency = allOps.find(o => o.id === depId);
    // Dependency is resolved if it doesn't exist in active queue (already success)
    // or if it explicitly marked as success.
    return !dependency || dependency.status === 'success';
  });
}
