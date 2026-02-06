'use client';

import { WifiOff, Clock, AlertTriangle, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SyncStatusBarProps {
  pendingCount: number;
  failedCount: number;
  syncing: boolean;
  isOnline: boolean;
  onSyncNow: () => void;
  onRetry?: () => void;
}

export function SyncStatusBar({
  pendingCount,
  failedCount,
  syncing,
  isOnline,
  onSyncNow,
  onRetry,
}: SyncStatusBarProps) {
  const [showSynced, setShowSynced] = useState(false);
  const [prevPending, setPrevPending] = useState(pendingCount);

  // Show "synced" message briefly when pending count decreases
  useEffect(() => {
    if (prevPending > 0 && pendingCount === 0 && failedCount === 0) {
      setShowSynced(true);
      const timer = setTimeout(() => setShowSynced(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevPending(pendingCount);
  }, [pendingCount, failedCount, prevPending]);

  // Offline state
  if (!isOnline) {
    return (
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-gray-600">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You are offline</span>
            {pendingCount > 0 && (
              <span className="text-xs text-gray-500">
                ({pendingCount} inspection{pendingCount !== 1 ? 's' : ''} will sync when online)
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Syncing state
  if (syncing) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Syncing inspections...</span>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (failedCount > 0) {
    return (
      <div className="bg-red-50 border-b border-red-100 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {failedCount} inspection{failedCount !== 1 ? 's' : ''} failed to sync
            </span>
          </div>
          <button
            onClick={onRetry || onSyncNow}
            className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Pending state
  if (pendingCount > 0) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-yellow-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {pendingCount} inspection{pendingCount !== 1 ? 's' : ''} pending sync
            </span>
          </div>
          <button
            onClick={onSyncNow}
            className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  // All synced state (shows briefly)
  if (showSynced) {
    return (
      <div className="bg-green-50 border-b border-green-100 px-4 py-2">
        <div className="flex items-center justify-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">All inspections synced</span>
          </div>
        </div>
      </div>
    );
  }

  // No status to show
  return null;
}
