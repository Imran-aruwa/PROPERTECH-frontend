'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  Plus,
  RefreshCw,
  WifiOff,
  Wifi,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { getAllDrafts } from '@/app/lib/inspection-db';
import { useOnlineStatus, useInspectionSync } from '@/app/lib/inspection-hooks';
import type { InspectionDraft } from '@/app/lib/inspection-types';
import { INSPECTION_TYPE_CONFIG, SYNC_STATUS_CONFIG } from '@/app/lib/inspection-types';

export default function InspectHomePage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { syncAll, syncing, stats, refreshStats } = useInspectionSync();
  const [drafts, setDrafts] = useState<InspectionDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = async () => {
    try {
      const all = await getAllDrafts();
      setDrafts(all);
    } catch (e) {
      console.error('Failed to load drafts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleSync = async () => {
    await syncAll();
    await loadDrafts();
    await refreshStats();
  };

  const pendingDrafts = drafts.filter((d) => d.sync_status === 'pending' && d.inspection.status !== 'draft');
  const failedDrafts = drafts.filter((d) => d.sync_status === 'failed');
  const allDrafts = drafts.filter((d) => d.inspection.status === 'draft');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            <h1 className="text-xl font-bold">Inspect</h1>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {isOnline ? (
              <><Wifi className="h-4 w-4 text-green-300" /><span className="text-green-200">Online</span></>
            ) : (
              <><WifiOff className="h-4 w-4 text-yellow-300" /><span className="text-yellow-200">Offline</span></>
            )}
          </div>
        </div>

        {/* Sync status summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{allDrafts.length}</div>
            <div className="text-xs text-blue-100">Drafts</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{pendingDrafts.length}</div>
            <div className="text-xs text-blue-100">Pending</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-200">{failedDrafts.length}</div>
            <div className="text-xs text-blue-100">Failed</div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-4 py-3 flex gap-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/inspect/new"
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Inspection
        </Link>
        {(pendingDrafts.length > 0 || failedDrafts.length > 0) && isOnline && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-green-600 text-white rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Sync
          </button>
        )}
      </div>

      {/* Draft list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No inspections yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap "New Inspection" to start</p>
          </div>
        ) : (
          <>
            {pendingDrafts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Pending Sync ({pendingDrafts.length})
                </p>
                {pendingDrafts.map((draft) => (
                  <DraftCard key={draft.client_uuid} draft={draft} />
                ))}
              </div>
            )}

            {failedDrafts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                  Failed ({failedDrafts.length})
                </p>
                {failedDrafts.map((draft) => (
                  <DraftCard key={draft.client_uuid} draft={draft} />
                ))}
              </div>
            )}

            {allDrafts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  In Progress ({allDrafts.length})
                </p>
                {allDrafts.map((draft) => (
                  <DraftCard key={draft.client_uuid} draft={draft} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom nav link */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <Link
          href="/owner/inspections"
          className="block text-center text-sm text-blue-600 font-medium"
        >
          View All Inspections →
        </Link>
      </div>
    </div>
  );
}

function DraftCard({ draft }: { draft: InspectionDraft }) {
  const config = INSPECTION_TYPE_CONFIG[draft.inspection.inspection_type];
  const syncConfig = SYNC_STATUS_CONFIG[draft.sync_status];
  const date = new Date(draft.last_modified).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Link
      href={`/inspect/${draft.client_uuid}`}
      className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-2 active:scale-98 transition-transform"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {config?.label || draft.inspection.inspection_type}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {draft.inspection.notes || 'No notes'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{date}</span>
            <span>·</span>
            <span>{draft.items.length} item{draft.items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className={`h-2 w-2 rounded-full ${syncConfig.color}`} />
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
