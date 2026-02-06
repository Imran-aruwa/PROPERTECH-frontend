/**
 * React Hooks for Inspection System
 * Custom hooks for offline-first inspection functionality
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getAllDrafts,
  saveDraft,
  getPendingSyncCount,
  getFailedDrafts,
  getPendingDrafts,
} from './inspection-db';
import {
  syncAllPending,
  syncSingleDraft,
  startAutoSync,
  getSyncStats,
  retryFailed,
} from './inspection-sync';
import type { InspectionDraft, SyncResult } from './inspection-types';

// ============================================
// ONLINE STATUS HOOK
// ============================================

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================
// DRAFTS HOOK
// ============================================

/**
 * Hook to manage inspection drafts from IndexedDB
 */
export function useInspectionDrafts() {
  const [drafts, setDrafts] = useState<InspectionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allDrafts = await getAllDrafts();
      setDrafts(allDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { drafts, loading, error, refresh };
}

// ============================================
// SYNC HOOK
// ============================================

interface SyncState {
  syncing: boolean;
  lastResult: SyncResult | null;
  stats: { pending: number; synced: number; failed: number };
}

/**
 * Hook to manage sync operations
 */
export function useInspectionSync() {
  const [state, setState] = useState<SyncState>({
    syncing: false,
    lastResult: null,
    stats: { pending: 0, synced: 0, failed: 0 },
  });

  const isOnline = useOnlineStatus();

  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      const stats = await getSyncStats();
      setState((prev) => ({ ...prev, stats }));
    } catch (err) {
      console.error('Failed to refresh sync stats:', err);
    }
  }, []);

  // Sync all pending
  const syncAll = useCallback(async () => {
    if (!isOnline) return null;

    setState((prev) => ({ ...prev, syncing: true }));

    try {
      const result = await syncAllPending();
      setState((prev) => ({ ...prev, syncing: false, lastResult: result }));
      await refreshStats();
      return result;
    } catch (err) {
      setState((prev) => ({ ...prev, syncing: false }));
      throw err;
    }
  }, [isOnline, refreshStats]);

  // Sync single draft
  const syncOne = useCallback(
    async (uuid: string) => {
      if (!isOnline) return null;

      setState((prev) => ({ ...prev, syncing: true }));

      try {
        const result = await syncSingleDraft(uuid);
        setState((prev) => ({ ...prev, syncing: false, lastResult: result }));
        await refreshStats();
        return result;
      } catch (err) {
        setState((prev) => ({ ...prev, syncing: false }));
        throw err;
      }
    },
    [isOnline, refreshStats]
  );

  // Retry failed
  const retry = useCallback(async () => {
    if (!isOnline) return null;

    setState((prev) => ({ ...prev, syncing: true }));

    try {
      const result = await retryFailed();
      setState((prev) => ({ ...prev, syncing: false, lastResult: result }));
      await refreshStats();
      return result;
    } catch (err) {
      setState((prev) => ({ ...prev, syncing: false }));
      throw err;
    }
  }, [isOnline, refreshStats]);

  // Start auto-sync on mount
  useEffect(() => {
    refreshStats();
    const cleanup = startAutoSync(30000);

    return () => {
      cleanup();
    };
  }, [refreshStats]);

  // Refresh stats when coming online
  useEffect(() => {
    if (isOnline) {
      refreshStats();
    }
  }, [isOnline, refreshStats]);

  return {
    syncAll,
    syncOne,
    retry,
    syncing: state.syncing,
    lastResult: state.lastResult,
    stats: state.stats,
    refreshStats,
  };
}

// ============================================
// AUTO-SAVE HOOK
// ============================================

/**
 * Hook for debounced auto-save to IndexedDB
 */
export function useAutoSave(draft: InspectionDraft | null, debounceMs = 2000) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDraftRef = useRef<string>('');

  useEffect(() => {
    if (!draft) return;

    // Serialize draft for comparison
    const serialized = JSON.stringify(draft);

    // Skip if draft hasn't changed
    if (serialized === previousDraftRef.current) return;

    previousDraftRef.current = serialized;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSaveStatus('saving');

    // Debounce save
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveDraft(draft);
        setSaveStatus('saved');
        setLastSaved(new Date());

        // Reset to idle after a short delay
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [draft, debounceMs]);

  // Force save (for submit action)
  const forceSave = useCallback(async (draftToSave: InspectionDraft) => {
    try {
      setSaveStatus('saving');
      await saveDraft(draftToSave);
      setSaveStatus('saved');
      setLastSaved(new Date());
      previousDraftRef.current = JSON.stringify(draftToSave);
      return true;
    } catch (err) {
      console.error('Force save failed:', err);
      setSaveStatus('error');
      return false;
    }
  }, []);

  return { saveStatus, lastSaved, forceSave };
}

// ============================================
// GEOLOCATION HOOK
// ============================================

interface GeoLocationState {
  position: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook to capture GPS coordinates
 */
export function useGeoLocation() {
  const [state, setState] = useState<GeoLocationState>({
    position: null,
    error: null,
    loading: false,
  });

  const refresh = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Get position on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

// ============================================
// DEVICE ID HOOK
// ============================================

const DEVICE_ID_KEY = 'propertech_device_id';

/**
 * Hook to get a persistent device identifier
 */
export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try to get existing device ID
    let id = localStorage.getItem(DEVICE_ID_KEY);

    if (!id) {
      // Generate new device ID from browser fingerprint
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width.toString(),
        screen.height.toString(),
        screen.colorDepth.toString(),
        new Date().getTimezoneOffset().toString(),
      ];

      // Create a simple hash
      const hash = components.join('|');
      let hashCode = 0;
      for (let i = 0; i < hash.length; i++) {
        const char = hash.charCodeAt(i);
        hashCode = (hashCode << 5) - hashCode + char;
        hashCode = hashCode & hashCode; // Convert to 32bit integer
      }

      // Add random component for uniqueness
      const random = Math.random().toString(36).substring(2, 10);
      id = `device_${Math.abs(hashCode).toString(16)}_${random}`;

      localStorage.setItem(DEVICE_ID_KEY, id);
    }

    setDeviceId(id);
  }, []);

  return deviceId;
}

// ============================================
// PHOTO CAPTURE HOOK
// ============================================

interface PhotoData {
  id: string;
  data: string; // base64
  captured_at: string;
}

/**
 * Hook for capturing and managing photos
 */
export function usePhotoCapture() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const capture = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const newPhoto: PhotoData = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: result,
            captured_at: new Date().toISOString(),
          };
          setPhotos((prev) => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input to allow same file selection
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const setInitialPhotos = useCallback((initialPhotos: PhotoData[]) => {
    setPhotos(initialPhotos);
  }, []);

  return {
    inputRef,
    photos,
    capture,
    handleFileChange,
    removePhoto,
    clearPhotos,
    setInitialPhotos,
  };
}

// ============================================
// PENDING SYNC COUNT HOOK
// ============================================

/**
 * Hook to get pending sync count
 */
export function usePendingSyncCount() {
  const [count, setCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const pending = await getPendingDrafts();
      const failed = await getFailedDrafts();
      setCount(pending.filter((d) => d.inspection.status !== 'draft').length);
      setFailedCount(failed.length);
    } catch (err) {
      console.error('Failed to get pending sync count:', err);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Refresh periodically
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { pendingCount: count, failedCount, refresh };
}
