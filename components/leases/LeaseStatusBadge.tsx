'use client';

import { LeaseStatus } from '@/app/lib/types';

const STATUS_CONFIG: Record<LeaseStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Sent', className: 'bg-yellow-100 text-yellow-700' },
  signed: { label: 'Signed', className: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', className: 'bg-red-100 text-red-700' },
};

export function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
