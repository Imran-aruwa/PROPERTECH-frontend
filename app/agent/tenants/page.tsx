'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Users, Phone, Mail, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { agentApi } from '@/app/lib/api-services';

interface Tenant {
  id: string;
  name: string;
  unit: string;
  property: string;
  phone: string;
  email: string;
  rentAmount: number;
  status: string;
}

export default function AgentTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await agentApi.getTenants();

        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : response.data.tenants || [];
          setTenants(data.map((t: any) => ({
            id: t.id?.toString() || '',
            name: t.name || t.full_name || '',
            unit: t.unit || t.unit_number || '',
            property: t.property || t.property_name || '',
            phone: t.phone || '',
            email: t.email || '',
            rentAmount: t.rent_amount || t.rentAmount || 0,
            status: t.status || 'active',
          })));
        } else {
          setTenants([]);
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
        setError('Failed to load tenants');
        setTenants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const stats = [
    {
      title: 'Total Tenants',
      label: 'Under your management',
      value: tenants.length.toString(),
      icon: Users,
      trend: "up" as const,
    },
  ];

  const columns = [
    {
      header: 'Tenant',
      accessor: (row: Tenant) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-gray-500">
            {row.property} - Unit {row.unit}
          </p>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (row: Tenant) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{row.phone || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{row.email || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Rent',
      accessor: (row: Tenant) =>
        `KES ${row.rentAmount.toLocaleString()}`,
    },
    {
      header: 'Status',
      accessor: (row: Tenant) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
  ];

  // Mobile card view for tenants
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {tenants.map((tenant) => (
        <div key={tenant.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{tenant.name}</p>
              <p className="text-sm text-gray-500">{tenant.property} - Unit {tenant.unit}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              tenant.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {tenant.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{tenant.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{tenant.email || '-'}</span>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">Monthly Rent</p>
            <p className="font-semibold text-gray-900">KES {tenant.rentAmount.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading tenants...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-1">Manage your tenant portfolio</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {stats.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tenants found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <MobileCardView />

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={tenants} columns={columns} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
