import apiClient from '../services/apiClient';
import { getDB, updateOperationStatus } from '../lib/db';
import type { SyncOperation } from '../lib/db';
import { resolveRelations } from './resolver';

const syncChannel = new BroadcastChannel('sync-status-updates');

export async function executeOperation(op: SyncOperation) {
  const db = await getDB();
  
  try {
    // 1. Resolve any pending relations in payload
    const finalPayload = await resolveRelations(op.payload, op.relations);
    
    // 2. Execute the request
    console.log(`[Sync Executor] Executing ${op.method} ${op.url}`, finalPayload);
    const response = await apiClient({
      method: op.method,
      url: op.url,
      data: finalPayload,
      headers: op.headers
    });

    // 3. If successful and has a tempId, save the mapping
    if (op.tempId && response.data && response.data.id) {
      await db.put('idMappings', {
        tempId: op.tempId,
        realId: response.data.id,
        entity: op.url.split('/')[1] || 'unknown',
        createdAt: Date.now()
      });
      console.log(`[Sync Executor] Saved mapping: ${op.tempId} -> ${response.data.id}`);
    }

    // 4. Update status and notify other tabs
    await updateOperationStatus(op.id, { status: 'success', updatedAt: Date.now() });
    
    syncChannel.postMessage({
      type: 'SYNC_DONE',
      tempId: op.tempId,
      realId: response.data?.id,
      entityType: op.url.split('/')[1],
      newRecord: response.data
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    const status = error.response?.status;
    console.error(`[Sync Executor] Failed ${op.id}:`, error);

    if (status === 409) {
      // Conflict: Mark as failed and don't retry automatically
      await updateOperationStatus(op.id, { status: 'failed', errorReason: 'Conflict (409)' });
    } else if (status >= 400 && status < 500) {
      // Client error: Mark as blocked/failed
      await updateOperationStatus(op.id, { status: 'failed', errorReason: `Client Error (${status})` });
    } else {
      // Server error or Network: Increment retry count
      const MAX_RETRIES = 5;
      const nextRetryCount = (op.retryCount || 0) + 1;
      
      if (nextRetryCount > MAX_RETRIES) {
        await updateOperationStatus(op.id, { 
          status: 'failed', 
          errorReason: `Max retries (${MAX_RETRIES}) exceeded: ${error.message}` 
        });
      } else {
        await updateOperationStatus(op.id, { 
          status: 'retrying', 
          retryCount: nextRetryCount,
          errorReason: error.message 
        });
      }
    }

    return { success: false, error };
  }
}
