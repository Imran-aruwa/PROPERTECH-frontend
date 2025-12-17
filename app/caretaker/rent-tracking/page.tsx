'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
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

export default function CaretakerRentTracking() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [summary, setSummary] = useState({
    expectedRent: 280000,
    collectedRent: 265000,
    pending: 15000,
    overdue: 8000,
    collectionRate: 94.6,
  });

  const fetchRentData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/caretaker/rent-summary');
      if (response.data) {
        setSummary(response.data.summary);
        setTenants(response.data.tenants);
      } else {
        // Mock data
        setTenants([
          {
            id: 1,
            name: 'John Doe',
            unit: 'A101',
            rent: 8000,
            status: 'paid',
            daysOverdue: 0,
            lastPayment: '2025-11-01',
            phone: '+254712345678',
          },
          {
            id: 2,
            name: 'Jane Smith',
            unit: 'A102',
            rent: 8000,
            status: 'pending',
            daysOverdue: 2,
            lastPayment: '2025-10-01',
            phone: '+254723456789',
          },
          {
            id: 3,
            name: 'Bob Wilson',
            unit: 'A103',
            rent: 8000,
            status: 'overdue',
            daysOverdue: 7,
            lastPayment: '2025-09-28',
            phone: '+254734567890',
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching rent data:', error);
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
      paid: { label: '✓ Paid', className: 'bg-green-100 text-green-800' },
      pending: { label: '⏳ Pending', className: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: '⚠ Overdue', className: 'bg-red-100 text-red-800' },
    };
    const config = configs[status as keyof typeof configs];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleSendReminder = (tenant: Tenant) => {
    alert(`Sending payment reminder to ${tenant.name} (${tenant.phone})`);
  };

  const collectionTrend = [
    { name: 'Week 1', collected: 65000 },
    { name: 'Week 2', collected: 128000 },
    { name: 'Week 3', collected: 195000 },
    { name: 'Week 4', collected: 265000 },
  ];

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
      <ChartWrapper
        type="line"
        data={collectionTrend}
        dataKey="collected"
        xAxisKey="name"
        title="Monthly Collection Progress"
        height={250}
      />

      {/* Bills Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Bills</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Expected:</span>
              <span className="font-semibold text-gray-900">KES 20,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Collected:</span>
              <span className="font-semibold text-green-600">KES 18,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-semibold text-green-600">92.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold text-yellow-600">KES 1,500</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Electricity Bills</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Expected:</span>
              <span className="font-semibold text-gray-900">KES 38,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Collected:</span>
              <span className="font-semibold text-green-600">KES 34,200</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-semibold text-green-600">90%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold text-yellow-600">KES 3,800</span>
            </div>
          </div>
        </div>
      </div>

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
