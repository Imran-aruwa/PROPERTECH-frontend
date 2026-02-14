'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Users, Phone, Mail, Home, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { caretakerApi } from '@/app/lib/api-services';

interface Tenant {
  id: string;
  name: string;
  unit: string;
  phone: string;
  email: string;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  status: string;
}

interface Stats {
  totalTenants: number;
  activeLeases: number;
  moveInsThisMonth: number;
}

export default function CaretakerTenantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await caretakerApi.getTenants();

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            totalTenants: data.total_tenants || data.totalTenants || 0,
            activeLeases: data.active_leases || data.activeLeases || 0,
            moveInsThisMonth: data.move_ins_this_month || data.moveInsThisMonth || 0,
          });

          const items = data.tenants || [];
          setTenants(items.map((t: any) => ({
            id: t.id?.toString() || '',
            name: t.name || t.full_name || '',
            unit: t.unit || t.unit_number || '',
            phone: t.phone || '',
            email: t.email || '',
            rentAmount: t.rent_amount || t.rentAmount || 0,
            leaseStart: t.lease_start || t.leaseStart || '',
            leaseEnd: t.lease_end || t.leaseEnd || '',
            status: t.status || 'active',
          })));
        } else {
          setStats({ totalTenants: 0, activeLeases: 0, moveInsThisMonth: 0 });
          setTenants([]);
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
        setError('Failed to load tenants');
        setStats({ totalTenants: 0, activeLeases: 0, moveInsThisMonth: 0 });
        setTenants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.unit.includes(searchQuery)
  );

  const statsCards = stats ? [
    { title: 'Total Tenants', label: 'Under your care', value: stats.totalTenants.toString(), icon: Users, trend: "up" as const },
    { title: 'Active Leases', label: 'Current contracts', value: stats.activeLeases.toString(), icon: Home, trend: "up" as const },
    { title: 'Move-ins This Month', label: 'New tenants', value: stats.moveInsThisMonth.toString(), icon: Users, trend: "up" as const },
  ] : [];

  const columns = [
    {
      header: 'Tenant',
      accessor: (row: Tenant) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-sm text-gray-500">Unit {row.unit}</p>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (row: Tenant) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3 h-3 text-gray-400" />
            {row.phone || '-'}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-gray-400" />
            {row.email || '-'}
          </div>
        </div>
      ),
    },
    {
      header: 'Rent Amount',
      accessor: (row: Tenant) => `KES ${row.rentAmount.toLocaleString()}`,
    },
    {
      header: 'Lease Period',
      accessor: (row: Tenant) => (
        <div className="text-sm">
          <p>{row.leaseStart || '-'}</p>
          <p className="text-gray-500">to {row.leaseEnd || '-'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Tenant) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
  ];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {filteredTenants.map((tenant) => (
        <div key={tenant.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{tenant.name}</p>
              <p className="text-sm text-gray-500">Unit {tenant.unit}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {tenant.status.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${tenant.phone}`} className="text-blue-600">{tenant.phone}</a>
              </div>
            )}
            {tenant.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{tenant.email}</span>
              </div>
            )}
          </div>
          <div className="pt-2 border-t grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Rent</p>
              <p className="font-medium">KES {tenant.rentAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Lease End</p>
              <p className="font-medium">{tenant.leaseEnd || '-'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout role="caretaker">
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
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tenants Directory</h1>
          <p className="text-gray-600 mt-1">View and manage tenant information</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          {statsCards.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <input
            type="text"
            placeholder="Search by name or unit number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {filteredTenants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tenants found</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={filteredTenants} columns={columns} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
