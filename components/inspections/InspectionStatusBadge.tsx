'use client';

import {
  STATUS_CONFIG,
  SYNC_STATUS_CONFIG,
  type InspectionStatus,
  type SyncStatus,
} from '@/app/lib/inspection-types';

interface InspectionStatusBadgeProps {
  status: InspectionStatus;
  syncStatus?: SyncStatus;
  size?: 'sm' | 'md';
}

export function InspectionStatusBadge({
  status,
  syncStatus,
  size = 'md',
}: InspectionStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const syncConfig = syncStatus ? SYNC_STATUS_CONFIG[syncStatus] : null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} font-medium rounded-full ${config.bgColor} ${config.color}`}
    >
      {config.label}
      {syncConfig && syncStatus !== 'synced' && (
        <span
          className={`w-2 h-2 rounded-full ${syncConfig.color}`}
          title={syncConfig.label}
        />
      )}
    </span>
  );
}

interface InspectionTypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  routine: { bg: 'bg-blue-100', text: 'text-blue-700' },
  move_in: { bg: 'bg-green-100', text: 'text-green-700' },
  move_out: { bg: 'bg-orange-100', text: 'text-orange-700' },
  meter: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

const TYPE_LABELS: Record<string, string> = {
  routine: 'Routine',
  move_in: 'Move-in',
  move_out: 'Move-out',
  meter: 'Meter',
};

export function InspectionTypeBadge({ type, size = 'md' }: InspectionTypeBadgeProps) {
  const colors = TYPE_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const label = TYPE_LABELS[type] || type;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-full ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
}
