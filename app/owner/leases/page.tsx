'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { leasesApi } from '@/app/lib/api-services';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusBadge';
import { Lease, LeaseStatus } from '@/app/lib/types';
import { FileSignature, Plus, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';

const STATUS_TABS: { label: string; value: LeaseStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Signed', value: 'signed' },
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
];

export default function LeasesPage() {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LeaseStatus | 'all'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (role && role !== 'owner') { router.push('/unauthorized'); return; }

    const fetch = async () => {
      setLoading(true);
      const params = activeTab !== 'all' ? { status: activeTab } : undefined;
      const res = await leasesApi.list(params);
      if (res.success) {
        setLeases(Array.isArray(res.data) ? res.data : []);
      } else {
        setLeases([]);
      }
      setLoading(false);
    };
    fetch();
  }, [authLoading, isAuthenticated, role, router, activeTab]);

  const formatCurrency = (amount: number) => `KES ${amount?.toLocaleString() || '0'}`;

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">Leases</h1>
            <p className="text-tx-secondary mt-1">Manage lease agreements and e-signatures</p>
          </div>
          <Link
            href="/owner/leases/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4" /> Create Lease
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-tx-muted hover:text-tx-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : leases.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-lg border">
            <FileSignature className="w-12 h-12 text-tx-muted mx-auto mb-4" />
            <p className="text-tx-muted font-medium">No leases found</p>
            <p className="text-tx-muted text-sm mt-1">Create your first lease to get started</p>
            <Link
              href="/owner/leases/new"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Lease
            </Link>
          </div>
        ) : (
          <div className="bg-bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-bd">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">Property</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">Tenant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">Start</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">End</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">Rent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-tx-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd">
                  {leases.map((lease) => (
                    <tr key={lease.id} className="hover:bg-bg-hover">
                      <td className="px-4 py-3 text-sm text-tx-primary">{lease.property?.name || `Property #${lease.property_id}`}</td>
                      <td className="px-4 py-3 text-sm text-tx-primary">{lease.unit?.unit_number || `Unit #${lease.unit_id}`}</td>
                      <td className="px-4 py-3 text-sm text-tx-primary">
                        {lease.tenant?.user?.full_name || `Tenant #${lease.tenant_id}`}
                      </td>
                      <td className="px-4 py-3"><LeaseStatusBadge status={lease.status} /></td>
                      <td className="px-4 py-3 text-sm text-tx-secondary">{lease.start_date}</td>
                      <td className="px-4 py-3 text-sm text-tx-secondary">{lease.end_date}</td>
                      <td className="px-4 py-3 text-sm text-tx-primary font-medium">{formatCurrency(lease.rent_amount)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/owner/leases/${lease.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
