'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search as SearchIcon,
  Filter,
  ClipboardCheck,
  LogIn,
  LogOut,
  Gauge,
  ChevronRight,
  Loader2,
  Calendar,
  Building2,
  Home,
  Shield,
  TrendingUp,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { inspectionsApi } from '@/app/lib/api-services';
import { getAllDrafts } from '@/app/lib/inspection-db';
import {
  useOnlineStatus,
  useInspectionSync,
  usePendingSyncCount,
} from '@/app/lib/inspection-hooks';
import { SyncStatusBar } from './SyncStatusBar';
import { InspectionStatusBadge, InspectionTypeBadge } from './InspectionStatusBadge';
import type {
  InspectionDraft,
  InspectionListItem,
  InspectionStatus,
  InspectionType,
  UserRole,
} from '@/app/lib/inspection-types';

interface InspectionListProps {
  role: UserRole;
  userId?: number;
}

interface MergedInspection {
  id: string | number;
  client_uuid: string;
  property_name: string;
  unit_number: string;
  inspection_type: InspectionType;
  status: InspectionStatus;
  sync_status?: 'pending' | 'synced' | 'failed';
  inspection_date: string;
  performed_by_name?: string;
  isLocal: boolean;
}

const TYPE_ICONS: Record<InspectionType, React.FC<{ className?: string }>> = {
  routine: ClipboardCheck,
  move_in: LogIn,
  move_out: LogOut,
  meter: Gauge,
  pre_purchase: SearchIcon,
  insurance: Shield,
  valuation: TrendingUp,
  fire_safety: Flame,
  emergency_damage: AlertTriangle,
};

const STATUS_FILTERS: { value: InspectionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'locked', label: 'Locked' },
];

export function InspectionList({ role, userId }: InspectionListProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { syncAll, retry, syncing } = useInspectionSync();
  const { pendingCount, failedCount, refresh: refreshCounts } = usePendingSyncCount();

  const [remoteInspections, setRemoteInspections] = useState<InspectionListItem[]>([]);
  const [localDrafts, setLocalDrafts] = useState<InspectionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch local drafts
      const drafts = await getAllDrafts();
      setLocalDrafts(drafts);

      // Fetch remote inspections if online
      if (isOnline) {
        const response = await inspectionsApi.list();
        if (response.success && response.data) {
          setRemoteInspections(Array.isArray(response.data) ? response.data : []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Merge local and remote inspections
  const mergedInspections = useMemo<MergedInspection[]>(() => {
    const result: MergedInspection[] = [];
    const seenUuids = new Set<string>();

    // Add remote inspections first (they take precedence)
    remoteInspections.forEach((inspection) => {
      seenUuids.add(inspection.client_uuid);
      result.push({
        id: inspection.id,
        client_uuid: inspection.client_uuid,
        property_name: inspection.property_name || 'Unknown Property',
        unit_number: inspection.unit_number || 'N/A',
        inspection_type: inspection.inspection_type,
        status: inspection.status,
        sync_status: 'synced',
        inspection_date: inspection.inspection_date,
        performed_by_name: inspection.performed_by_name,
        isLocal: false,
      });
    });

    // Add local drafts that aren't already in remote
    localDrafts.forEach((draft) => {
      if (!seenUuids.has(draft.client_uuid)) {
        result.push({
          id: draft.client_uuid,
          client_uuid: draft.client_uuid,
          property_name: `Property #${draft.inspection.property_id}`,
          unit_number: `Unit #${draft.inspection.unit_id}`,
          inspection_type: draft.inspection.inspection_type,
          status: draft.inspection.status,
          sync_status: draft.sync_status,
          inspection_date: draft.inspection.inspection_date,
          isLocal: true,
        });
      }
    });

    // Sort by date descending
    result.sort(
      (a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
    );

    return result;
  }, [remoteInspections, localDrafts]);

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return mergedInspections.filter((inspection) => {
      // Status filter
      if (statusFilter !== 'all' && inspection.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          inspection.property_name.toLowerCase().includes(query) ||
          inspection.unit_number.toLowerCase().includes(query) ||
          inspection.inspection_type.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [mergedInspections, statusFilter, searchQuery]);

  // Handle sync
  const handleSyncNow = async () => {
    await syncAll();
    await fetchData();
    refreshCounts();
  };

  const handleRetry = async () => {
    await retry();
    await fetchData();
    refreshCounts();
  };

  // Navigate to inspection
  const handleInspectionClick = (inspection: MergedInspection) => {
    if (inspection.isLocal && inspection.status === 'draft') {
      // Edit local draft
      router.push(`/${role}/inspections/new?draft=${inspection.client_uuid}`);
    } else if (!inspection.isLocal) {
      // View remote inspection
      router.push(`/${role}/inspections/${inspection.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sync Status Bar */}
      <SyncStatusBar
        pendingCount={pendingCount}
        failedCount={failedCount}
        syncing={syncing}
        isOnline={isOnline}
        onSyncNow={handleSyncNow}
        onRetry={handleRetry}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href={`/${role}/inspections/new`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Inspection
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by property, unit, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inspections List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first inspection to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link
                href={`/${role}/inspections/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                New Inspection
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map((inspection) => {
              const TypeIcon = TYPE_ICONS[inspection.inspection_type];
              const date = new Date(inspection.inspection_date);

              return (
                <button
                  key={inspection.client_uuid}
                  onClick={() => handleInspectionClick(inspection)}
                  className="w-full bg-white rounded-lg border p-4 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">
                            {inspection.property_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Home className="w-4 h-4" />
                            <span>{inspection.unit_number}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <InspectionTypeBadge type={inspection.inspection_type} size="sm" />
                        <InspectionStatusBadge
                          status={inspection.status}
                          syncStatus={inspection.sync_status}
                          size="sm"
                        />
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {date.toLocaleDateString()}
                        </span>
                      </div>

                      {inspection.performed_by_name && (
                        <p className="text-xs text-gray-500 mt-2">
                          By: {inspection.performed_by_name}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
