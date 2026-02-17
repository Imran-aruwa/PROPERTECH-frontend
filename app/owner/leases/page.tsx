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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Leases</h1>
            <p className="text-gray-600 mt-1">Manage lease agreements and e-signatures</p>
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
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <div className="text-center py-12 bg-white rounded-lg border">
            <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No leases found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first lease to get started</p>
            <Link
              href="/owner/leases/new"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Lease
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leases.map((lease) => (
                    <tr key={lease.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{lease.property?.name || `Property #${lease.property_id}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{lease.unit?.unit_number || `Unit #${lease.unit_id}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {lease.tenant?.user?.full_name || `Tenant #${lease.tenant_id}`}
                      </td>
                      <td className="px-4 py-3"><LeaseStatusBadge status={lease.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lease.start_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lease.end_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatCurrency(lease.rent_amount)}</td>
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
