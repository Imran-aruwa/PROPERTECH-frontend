/**
 * IndexedDB Layer for Inspection Drafts
 * Native IndexedDB API wrapper, no external dependencies
 */

import {
  InspectionDraft,
  SyncStatus,
  CachedProperty,
  CachedUnit,
} from './inspection-types';

const DB_NAME = 'propertech_inspections';
const DB_VERSION = 2;

// Store names
const DRAFTS_STORE = 'drafts';
const CACHED_PROPERTIES_STORE = 'cached_properties';
const CACHED_UNITS_STORE = 'cached_units';

// Singleton database instance
let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open the inspection database (singleton pattern)
 */
export async function openInspectionDB(): Promise<IDBDatabase> {
  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Return pending promise if database is being opened
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(new Error('Failed to open database: ' + request.error?.message));
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle database close
      dbInstance.onclose = () => {
        dbInstance = null;
        dbPromise = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create drafts store
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const draftsStore = db.createObjectStore(DRAFTS_STORE, { keyPath: 'client_uuid' });
        draftsStore.createIndex('by_sync_status', 'sync_status', { unique: false });
        draftsStore.createIndex('by_property', 'inspection.property_id', { unique: false });
        draftsStore.createIndex('by_last_modified', 'last_modified', { unique: false });
        draftsStore.createIndex('by_performed_by', 'inspection.performed_by_id', { unique: false });
      }

      // Create cached properties store
      if (!db.objectStoreNames.contains(CACHED_PROPERTIES_STORE)) {
        db.createObjectStore(CACHED_PROPERTIES_STORE, { keyPath: 'id' });
      }

      // Create cached units store
      if (!db.objectStoreNames.contains(CACHED_UNITS_STORE)) {
        const unitsStore = db.createObjectStore(CACHED_UNITS_STORE, { keyPath: 'id' });
        unitsStore.createIndex('by_property', 'property_id', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Close the database connection
 */
export function closeInspectionDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbPromise = null;
  }
}

// ============================================
// DRAFT OPERATIONS
// ============================================

/**
 * Save a draft to IndexedDB
 */
export async function saveDraft(draft: InspectionDraft): Promise<void> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);

    // Update last_modified timestamp
    draft.last_modified = new Date().toISOString();

    const request = store.put(draft);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save draft: ' + request.error?.message));
  });
}

/**
 * Get a single draft by UUID
 */
export async function getDraft(uuid: string): Promise<InspectionDraft | null> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.get(uuid);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get draft: ' + request.error?.message));
  });
}

/**
 * Get all drafts
 */
export async function getAllDrafts(): Promise<InspectionDraft[]> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const drafts = request.result || [];
      // Sort by last_modified descending
      drafts.sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());
      resolve(drafts);
    };
    request.onerror = () => reject(new Error('Failed to get all drafts: ' + request.error?.message));
  });
}

/**
 * Delete a draft by UUID
 */
export async function deleteDraft(uuid: string): Promise<void> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.delete(uuid);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete draft: ' + request.error?.message));
  });
}

/**
 * Get all drafts with pending sync status
 */
export async function getPendingDrafts(): Promise<InspectionDraft[]> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const index = store.index('by_sync_status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Failed to get pending drafts: ' + request.error?.message));
  });
}

/**
 * Get all drafts with failed sync status
 */
export async function getFailedDrafts(): Promise<InspectionDraft[]> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const index = store.index('by_sync_status');
    const request = index.getAll('failed');

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Failed to get failed drafts: ' + request.error?.message));
  });
}

/**
 * Update sync status of a draft
 */
export async function updateSyncStatus(
  uuid: string,
  status: SyncStatus,
  error?: string,
  serverId?: number
): Promise<void> {
  const draft = await getDraft(uuid);
  if (!draft) {
    throw new Error('Draft not found: ' + uuid);
  }

  draft.sync_status = status;
  draft.sync_error = error;
  if (serverId !== undefined) {
    draft.server_id = serverId;
  }

  await saveDraft(draft);
}

/**
 * Get total count of drafts
 */
export async function getDraftCount(): Promise<number> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to count drafts: ' + request.error?.message));
  });
}

/**
 * Get count of drafts pending sync
 */
export async function getPendingSyncCount(): Promise<number> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFTS_STORE, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const index = store.index('by_sync_status');
    const request = index.count('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to count pending drafts: ' + request.error?.message));
  });
}

// ============================================
// PROPERTY/UNIT CACHE OPERATIONS
// ============================================

/**
 * Cache properties for offline use
 */
export async function cacheProperties(properties: CachedProperty[]): Promise<void> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHED_PROPERTIES_STORE, 'readwrite');
    const store = transaction.objectStore(CACHED_PROPERTIES_STORE);

    // Clear existing and add new
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      const now = new Date().toISOString();
      let completed = 0;
      let hasError = false;

      if (properties.length === 0) {
        resolve();
        return;
      }

      properties.forEach((property) => {
        const request = store.add({ ...property, cached_at: now });
        request.onsuccess = () => {
          completed++;
          if (completed === properties.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(new Error('Failed to cache property: ' + request.error?.message));
          }
        };
      });
    };

    clearRequest.onerror = () => {
      reject(new Error('Failed to clear properties cache: ' + clearRequest.error?.message));
    };
  });
}

/**
 * Cache units for offline use
 */
export async function cacheUnits(units: CachedUnit[]): Promise<void> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHED_UNITS_STORE, 'readwrite');
    const store = transaction.objectStore(CACHED_UNITS_STORE);

    // Clear existing and add new
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      const now = new Date().toISOString();
      let completed = 0;
      let hasError = false;

      if (units.length === 0) {
        resolve();
        return;
      }

      units.forEach((unit) => {
        const request = store.add({ ...unit, cached_at: now });
        request.onsuccess = () => {
          completed++;
          if (completed === units.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(new Error('Failed to cache unit: ' + request.error?.message));
          }
        };
      });
    };

    clearRequest.onerror = () => {
      reject(new Error('Failed to clear units cache: ' + clearRequest.error?.message));
    };
  });
}

/**
 * Get cached properties
 */
export async function getCachedProperties(): Promise<CachedProperty[]> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHED_PROPERTIES_STORE, 'readonly');
    const store = transaction.objectStore(CACHED_PROPERTIES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Failed to get cached properties: ' + request.error?.message));
  });
}

/**
 * Get cached units for a property
 */
export async function getCachedUnits(propertyId?: number): Promise<CachedUnit[]> {
  const db = await openInspectionDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CACHED_UNITS_STORE, 'readonly');
    const store = transaction.objectStore(CACHED_UNITS_STORE);

    if (propertyId !== undefined) {
      const index = store.index('by_property');
      const request = index.getAll(propertyId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get cached units: ' + request.error?.message));
    } else {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get cached units: ' + request.error?.message));
    }
  });
}
