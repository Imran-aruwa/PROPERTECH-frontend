'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { apiClient } from '@/lib/api-services';

interface Tenant {
  id: number;
  name: string;
  unit: string;
  rent: number;
  status: 'paid' | 'pending' | 'overdue';
  daysOverdue: number;
  lastPayment: string;
  phone: string;
}

interface CollectionTrend {
  name: string;
  collected: number;
}

interface UtilityBills {
  water: {
    expected: number;
    collected: number;
    rate: number;
    pending: number;
  };
  electricity: {
    expected: number;
    collected: number;
    rate: number;
    pending: number;
  };
}

export default function CaretakerRentTracking() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [collectionTrend, setCollectionTrend] = useState<CollectionTrend[]>([]);
  const [utilityBills, setUtilityBills] = useState<UtilityBills | null>(null);
  const [summary, setSummary] = useState({
    expectedRent: 0,
    collectedRent: 0,
    pending: 0,
    overdue: 0,
    collectionRate: 0,
  });

  const fetchRentData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/caretaker/rent-summary/');
      if (response.success && response.data) {
        const data = response.data;
        setSummary({
          expectedRent: data.summary?.expectedRent || data.summary?.expected_rent || 0,
          collectedRent: data.summary?.collectedRent || data.summary?.collected_rent || 0,
          pending: data.summary?.pending || 0,
          overdue: data.summary?.overdue || 0,
          collectionRate: data.summary?.collectionRate || data.summary?.collection_rate || 0,
        });

        // Map tenants data
        const tenantsData = data.tenants || [];
        setTenants(Array.isArray(tenantsData) ? tenantsData.map((t: any) => ({
          id: t.id || 0,
          name: t.name || t.tenant_name || '',
          unit: t.unit || t.unit_number || '',
          rent: t.rent || t.rent_amount || 0,
          status: t.status || 'pending',
          daysOverdue: t.daysOverdue || t.days_overdue || 0,
          lastPayment: t.lastPayment || t.last_payment || '-',
          phone: t.phone || '',
        })) : []);

        // Map collection trend data
        const trendData = data.collectionTrend || data.collection_trend || [];
        setCollectionTrend(Array.isArray(trendData) ? trendData : []);

        // Map utility bills data
        if (data.utilityBills || data.utility_bills) {
          const bills = data.utilityBills || data.utility_bills;
          setUtilityBills({
            water: {
              expected: bills.water?.expected || 0,
              collected: bills.water?.collected || 0,
              rate: bills.water?.rate || 0,
              pending: bills.water?.pending || 0,
            },
            electricity: {
              expected: bills.electricity?.expected || 0,
              collected: bills.electricity?.collected || 0,
              rate: bills.electricity?.rate || 0,
              pending: bills.electricity?.pending || 0,
            },
          });
        } else {
          setUtilityBills(null);
        }
      } else {
        // No data available - show empty state
        setTenants([]);
        setCollectionTrend([]);
        setUtilityBills(null);
      }
    } catch (error) {
      console.error('Error fetching rent data:', error);
      setTenants([]);
      setCollectionTrend([]);
      setUtilityBills(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentData();
  }, [fetchRentData]);

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleSendReminder = async (tenant: Tenant) => {
    try {
      await apiClient.post('/caretaker/rent-reminders/', {
        tenant_id: tenant.id,
      });
      alert(`Payment reminder sent to ${tenant.name} (${tenant.phone})`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const columns = [
    {
      header: 'Tenant',
      accessor: 'name' as keyof Tenant,
    },
    {
      header: 'Unit',
      accessor: 'unit' as keyof Tenant,
    },
    {
      header: 'Rent Amount',
      accessor: ((row: Tenant) => formatCurrency(row.rent)) as any,
    },
    {
      header: 'Status',
      accessor: ((row: Tenant) => getStatusBadge(row.status)) as any,
    },
    {
      header: 'Days Overdue',
      accessor: ((row: Tenant) => (
        <span className={row.daysOverdue > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
          {row.daysOverdue > 0 ? `${row.daysOverdue} days` : '-'}
        </span>
      )) as any,
    },
    {
      header: 'Last Payment',
      accessor: 'lastPayment' as keyof Tenant,
    },
    {
      header: 'Actions',
      accessor: ((row: Tenant) => (
        <div className="flex gap-2">
          {row.status !== 'paid' && (
            <button
              onClick={() => handleSendReminder(row)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
            >
              Send Reminder
            </button>
          )}
        </div>
      )) as any,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading rent data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rent Management</h1>
        <p className="text-gray-600 mt-1">Track and manage rent collection for your property</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Expected Rent"
          value={formatCurrency(summary.expectedRent)}
          icon={DollarSign}
          label="This month"
        />
        <StatCard
          title="Collected"
          value={formatCurrency(summary.collectedRent)}
          icon={TrendingUp}
          subtitle={`${summary.collectionRate}% rate`}
          valueClassName="text-green-600"
        />
        <StatCard
          title="Pending"
          value={formatCurrency(summary.pending)}
          icon={Users}
          label="Grace period"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(summary.overdue)}
          icon={AlertCircle}
          label="Action needed"
          valueClassName="text-red-600"
        />
      </div>

      {/* Collection Progress */}
      {collectionTrend.length > 0 ? (
        <ChartWrapper
          type="line"
          data={collectionTrend}
          dataKey="collected"
          xAxisKey="name"
          title="Monthly Collection Progress"
          height={250}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collection Progress</h3>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No collection data available</p>
          </div>
        </div>
      )}

      {/* Bills Summary */}
      {utilityBills ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Bills</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Expected:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(utilityBills.water.expected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collected:</span>
                <span className="font-semibold text-green-600">{formatCurrency(utilityBills.water.collected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rate:</span>
                <span className="font-semibold text-green-600">{utilityBills.water.rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">{formatCurrency(utilityBills.water.pending)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Electricity Bills</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Expected:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(utilityBills.electricity.expected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collected:</span>
                <span className="font-semibold text-green-600">{formatCurrency(utilityBills.electricity.collected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rate:</span>
                <span className="font-semibold text-green-600">{utilityBills.electricity.rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">{formatCurrency(utilityBills.electricity.pending)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Utility Bills</h3>
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No utility bill data available</p>
          </div>
        </div>
      )}

      {/* Tenant Payment Status Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tenant Payment Status
        </h2>
        <DataTable data={tenants} columns={columns} isLoading={loading} />
      </div>
    </div>
  );
}
