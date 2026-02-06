/**
 * Sync Engine for Inspection Drafts
 * Manages upload lifecycle for offline-created inspections
 */

import { inspectionsApi } from './api-services';
import {
  getPendingDrafts,
  getFailedDrafts,
  getDraft,
  updateSyncStatus,
  deleteDraft,
  getPendingSyncCount,
} from './inspection-db';
import type { InspectionDraft, SyncResult, InspectionMedia } from './inspection-types';

// Auto-sync interval handle
let autoSyncInterval: NodeJS.Timeout | null = null;
let isCurrentlySyncing = false;

/**
 * Compress an image to max dimensions and quality
 */
async function compressImage(base64Data: string, maxWidth = 1920, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    // If not in browser or not an image, return as-is
    if (typeof window === 'undefined' || !base64Data.startsWith('data:image')) {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Data);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with quality
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(base64Data);
    };

    img.src = base64Data;
  });
}

/**
 * Sync a single draft to the server
 */
export async function syncSingleDraft(uuid: string): Promise<SyncResult> {
  const result: SyncResult = {
    total: 1,
    synced: 0,
    failed: 0,
    errors: [],
  };

  const draft = await getDraft(uuid);
  if (!draft) {
    result.failed = 1;
    result.errors.push({ uuid, error: 'Draft not found' });
    return result;
  }

  // Only sync drafts that are submitted (not still in draft status)
  if (draft.inspection.status === 'draft') {
    result.total = 0;
    return result;
  }

  try {
    // Step 1: Create the inspection on the server
    const createPayload = {
      client_uuid: draft.client_uuid,
      inspection: {
        property_id: draft.inspection.property_id,
        unit_id: draft.inspection.unit_id,
        inspection_type: draft.inspection.inspection_type,
        inspection_date: draft.inspection.inspection_date,
        gps_lat: draft.inspection.gps_lat,
        gps_lng: draft.inspection.gps_lng,
        device_id: draft.inspection.device_id,
        offline_created_at: draft.inspection.offline_created_at || draft.created_at,
        notes: draft.inspection.notes,
      },
      items: draft.items.map((item) => ({
        client_uuid: item.client_uuid,
        name: item.name,
        category: item.category,
        condition: item.condition,
        comment: item.comment,
      })),
      meter_readings: draft.meter_readings.map((reading) => ({
        client_uuid: reading.client_uuid,
        unit_id: reading.unit_id,
        meter_type: reading.meter_type,
        previous_reading: reading.previous_reading,
        current_reading: reading.current_reading,
        reading_date: reading.reading_date,
      })),
    };

    const createResponse = await inspectionsApi.create(createPayload);

    if (!createResponse.success) {
      // Check for duplicate (409 Conflict)
      if (createResponse.error?.includes('duplicate') || createResponse.error?.includes('409')) {
        // Already synced, mark as synced
        await updateSyncStatus(uuid, 'synced');
        result.synced = 1;
        return result;
      }

      throw new Error(createResponse.error || 'Failed to create inspection');
    }

    const serverId = createResponse.data?.id;

    // Step 2: Upload media files
    if (draft.media.length > 0 && serverId) {
      for (const media of draft.media) {
        if (media.file_data) {
          try {
            // Compress image before upload
            const compressedData = await compressImage(media.file_data);

            const mediaPayload = {
              client_uuid: media.client_uuid,
              file_data: compressedData,
              file_type: media.file_type,
              captured_at: media.captured_at,
            };

            const mediaResponse = await inspectionsApi.uploadMedia(serverId, mediaPayload);

            if (!mediaResponse.success) {
              console.warn(`Failed to upload media ${media.client_uuid}:`, mediaResponse.error);
            }
          } catch (mediaError) {
            console.warn(`Failed to upload media ${media.client_uuid}:`, mediaError);
          }
        }
      }
    }

    // Step 3: Mark as synced
    await updateSyncStatus(uuid, 'synced', undefined, serverId);
    result.synced = 1;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncStatus(uuid, 'failed', errorMessage);
    result.failed = 1;
    result.errors.push({ uuid, error: errorMessage });
  }

  return result;
}

/**
 * Sync all pending drafts
 */
export async function syncAllPending(): Promise<SyncResult> {
  // Prevent concurrent syncs
  if (isCurrentlySyncing) {
    return { total: 0, synced: 0, failed: 0, errors: [] };
  }

  isCurrentlySyncing = true;

  const result: SyncResult = {
    total: 0,
    synced: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all pending drafts
    const pendingDrafts = await getPendingDrafts();

    // Filter to only submitted inspections
    const submittedDrafts = pendingDrafts.filter(
      (draft) => draft.inspection.status !== 'draft'
    );

    result.total = submittedDrafts.length;

    // Sync each draft sequentially to avoid race conditions
    for (const draft of submittedDrafts) {
      const singleResult = await syncSingleDraft(draft.client_uuid);
      result.synced += singleResult.synced;
      result.failed += singleResult.failed;
      result.errors.push(...singleResult.errors);
    }
  } catch (error) {
    console.error('Sync all pending failed:', error);
  } finally {
    isCurrentlySyncing = false;
  }

  return result;
}

/**
 * Retry all failed drafts
 */
export async function retryFailed(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0,
    synced: 0,
    failed: 0,
    errors: [],
  };

  try {
    const failedDrafts = await getFailedDrafts();
    result.total = failedDrafts.length;

    // Reset failed drafts to pending and retry
    for (const draft of failedDrafts) {
      await updateSyncStatus(draft.client_uuid, 'pending');
    }

    // Now sync all pending
    const syncResult = await syncAllPending();
    result.synced = syncResult.synced;
    result.failed = syncResult.failed;
    result.errors = syncResult.errors;
  } catch (error) {
    console.error('Retry failed drafts error:', error);
  }

  return result;
}

/**
 * Start auto-sync with interval
 */
export function startAutoSync(intervalMs = 30000): () => void {
  // Clear existing interval if any
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }

  // Sync handler
  const syncHandler = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      await syncAllPending();
    }
  };

  // Set up interval
  autoSyncInterval = setInterval(syncHandler, intervalMs);

  // Also sync on coming online
  const onlineHandler = () => {
    syncHandler();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', onlineHandler);
  }

  // Return cleanup function
  return () => {
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
      autoSyncInterval = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onlineHandler);
    }
  };
}

/**
 * Stop auto-sync
 */
export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

/**
 * Get current sync statistics
 */
export async function getSyncStats(): Promise<{ pending: number; synced: number; failed: number }> {
  try {
    const pendingDrafts = await getPendingDrafts();
    const failedDrafts = await getFailedDrafts();

    // Count synced drafts (those with server_id)
    const allDrafts = [...pendingDrafts, ...failedDrafts];
    const pending = pendingDrafts.length;
    const failed = failedDrafts.length;

    // For synced count, we'd need to query differently
    // For now, we track pending and failed
    return {
      pending,
      synced: 0, // Synced drafts are typically removed or marked
      failed,
    };
  } catch (error) {
    console.error('Failed to get sync stats:', error);
    return { pending: 0, synced: 0, failed: 0 };
  }
}

/**
 * Check if currently syncing
 */
export function isSyncing(): boolean {
  return isCurrentlySyncing;
}
