import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export type SyncOperationStatus = 'pending' | 'queued' | 'executing' | 'success' | 'failed' | 'retrying' | 'blocked';

export interface SyncRelation {
  fieldPath: string; // e.g. "sampleReceptionId"
  tempId: number;
}

export interface SyncOperation {
  id: string; // UUID
  transactionId?: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  payload?: any;
  status: SyncOperationStatus;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  errorReason?: string;
  idempotencyKey: string;
  dependsOn?: string[]; 
  lockedBy?: string;
  lockExpiry?: number;
  
  // New Fields for Relational Sync
  tempId?: number; // Temporary negative ID assigned locally
  relations?: SyncRelation[]; // Explicit mapping for ID resolution
}

interface EnjazDB extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncOperation;
    indexes: {
      'by-status': SyncOperationStatus;
      'by-created': number;
      'by-transaction': string;
    };
  };
  idMappings: {
    key: number; // tempId
    value: {
      tempId: number;
      realId: number;
      entity: string;
      createdAt: number;
    };
  };
  drafts: {
    key: string;
    value: {
      id: string;
      data: any;
      updatedAt: number;
    };
  };
  entityCache: {
    key: string; // entity name (e.g. "receptions")
    value: {
      entity: string;
      data: any;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'enjaz-offline-db';
const DB_VERSION = 3; // Incremented version to ensure entityCache creation

let dbPromise: Promise<IDBPDatabase<EnjazDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<EnjazDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Table for API Operations Queue
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-status', 'status');
          syncStore.createIndex('by-created', 'createdAt');
          syncStore.createIndex('by-transaction', 'transactionId');
        }
        
        // New Table for ID Mappings (v2)
        if (!db.objectStoreNames.contains('idMappings')) {
          db.createObjectStore('idMappings', { keyPath: 'tempId' });
        }

        // Table for Auto-save Drafts
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }

        // Table for Offline Data Caching (v2)
        if (!db.objectStoreNames.contains('entityCache')) {
          db.createObjectStore('entityCache', { keyPath: 'entity' });
        }
      },
    });
  }
  return dbPromise;
};

// --- Cache Methods ---

export const setEntityCache = async (entity: string, data: any) => {
  const db = await getDB();
  await db.put('entityCache', { entity, data, updatedAt: Date.now() });
};

export const getEntityCache = async (entity: string) => {
  const db = await getDB();
  const cache = await db.get('entityCache', entity);
  return cache ? cache.data : null;
};

// --- Queue Methods ---

export const addOperationToQueue = async (op: Omit<SyncOperation, 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>) => {
  const db = await getDB();
  const now = Date.now();
  const operation: SyncOperation = {
    ...op,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.put('syncQueue', operation);
  return operation;
};

export const getActiveOperations = async () => {
  const db = await getDB();
  // Get all, then sort by createdAt to ensure strict FIFO baseline
  const ops = await db.getAllFromIndex('syncQueue', 'by-created');
  return ops.filter(op => op.status !== 'success');
};

export const updateOperationStatus = async (id: string, updates: Partial<SyncOperation>) => {
  const db = await getDB();
  const op = await db.get('syncQueue', id);
  if (op) {
    await db.put('syncQueue', { ...op, ...updates, updatedAt: Date.now() });
  }
};

export const removeOperation = async (id: string) => {
  const db = await getDB();
  await db.delete('syncQueue', id);
};

export const getQueueCount = async () => {
  const db = await getDB();
  return db.count('syncQueue');
};

// --- Drafts Methods (Auto-save) ---

export const saveDraft = async (id: string, data: any) => {
  const db = await getDB();
  await db.put('drafts', { id, data, updatedAt: Date.now() });
};

export const getDraft = async (id: string) => {
  const db = await getDB();
  return db.get('drafts', id);
};

export const deleteDraft = async (id: string) => {
  const db = await getDB();
  await db.delete('drafts', id);
};
