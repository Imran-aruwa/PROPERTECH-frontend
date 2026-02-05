'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { apiClient, paymentsApi } from '@/lib/api-services';
import { Payment } from '@/app/lib/types';

interface Property {
  id: number;
  name: string;
  expected_rent: number;
  collected_rent: number;
  collection_rate: number;
  outstanding: number;
  overdue: number;
  occupancy: number;
  caretaker: string;
}

export default function GlobalRentTracking() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    collectionRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [rentRes, paymentsRes] = await Promise.all([
          apiClient.get('/owner/rent-summary/'),
          paymentsApi.getAll(),
        ]);

        if (rentRes.data) {
          const propsArray = Array.isArray(rentRes.data.properties) ? rentRes.data.properties : [];
          setProperties(propsArray);
          if (rentRes.data.summary) {
            setSummary(rentRes.data.summary);
          }
        }

        const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data
          : paymentsRes.data?.data ? (Array.isArray(paymentsRes.data.data) ? paymentsRes.data.data : [])
          : [];
        setPayments(paymentsData);
      } catch (error) {
        console.error('Error fetching rent data:', error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute collection trend from actual payment data (last 3 months)
  const collectionTrend = useMemo(() => {
    const rentPayments = payments.filter(p => p.payment_type === 'rent');
    if (rentPayments.length === 0) return [];

    const now = new Date();
    const months: { name: string; rate: number }[] = [];

    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });

      const monthRentPayments = rentPayments.filter(p => {
        const pd = new Date(p.due_date || p.created_at);
        return pd.getMonth() === month && pd.getFullYear() === year;
      });

      const total = monthRentPayments.length;
      const completed = monthRentPayments.filter(p => p.payment_status === 'completed').length;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      months.push({ name: monthName, rate: Math.round(rate * 10) / 10 });
    }

    return months.filter(m => m.rate > 0 || payments.length > 0);
  }, [payments]);

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  const columns = [
    {
      header: 'Property',
      accessor: 'name' as keyof Property,
    },
    {
      header: 'Expected Rent',
      accessor: ((row: Property) => formatCurrency(row.expected_rent)) as any,
    },
    {
      header: 'Collected',
      accessor: ((row: Property) => formatCurrency(row.collected_rent)) as any,
    },
    {
      header: 'Collection Rate',
      accessor: ((row: Property) => (
        <span
          className={`font-semibold ${
            row.collection_rate >= 95
              ? 'text-green-600'
              : row.collection_rate >= 85
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}
        >
          {row.collection_rate}%
        </span>
      )) as any,
    },
    {
      header: 'Outstanding',
      accessor: ((row: Property) => formatCurrency(row.outstanding)) as any,
    },
    {
      header: 'Overdue',
      accessor: ((row: Property) => (
        <span className="text-red-600 font-semibold">
          {formatCurrency(row.overdue)}
        </span>
      )) as any,
    },
    {
      header: 'Occupancy',
      accessor: ((row: Property) => `${row.occupancy}%`) as any,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Global Rent Tracking</h1>
        <p className="text-gray-600 mt-1">
          Monitor rent collection across all your properties
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Expected Rent"
          value={formatCurrency(summary.totalExpected)}
          icon={DollarSign}
          trend="neutral"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(summary.totalCollected)}
          icon={TrendingUp}
          change={summary.collectionRate > 0 ? `${summary.collectionRate.toFixed(1)}% collected` : undefined}
          trend="up"
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(summary.totalPending)}
          icon={Users}
          trend={summary.totalPending > 0 ? "down" : "neutral"}
        />
        <StatCard
          title="Overdue Payments"
          value={formatCurrency(summary.totalOverdue)}
          icon={AlertCircle}
          trend={summary.totalOverdue > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Collection Rate Trend */}
      {collectionTrend.length > 0 && (
        <ChartWrapper
          type="line"
          data={collectionTrend}
          dataKey="rate"
          xAxisKey="name"
          title="Collection Rate Trend (Last 3 Months)"
          height={250}
        />
      )}

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Property-by-Property Breakdown
        </h2>
        <DataTable data={properties} columns={columns} isLoading={loading} />
      </div>
    </div>
  );
}
