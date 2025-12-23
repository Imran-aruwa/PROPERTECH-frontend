'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { apiClient } from '@/lib/api-services';

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
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    collectionRate: 0,
  });

  useEffect(() => {
    const fetchRentData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/owner/rent-summary/');

        if (response.data) {
          const propsArray = Array.isArray(response.data.properties) ? response.data.properties : [];
          setProperties(propsArray);
          setSummary(response.data.summary || {
            totalExpected: 1450000,
            totalCollected: 1380250,
            totalPending: 35700,
            totalOverdue: 42500,
            collectionRate: 95.2,
          });
        }
      } catch (error) {
        console.error('Error fetching rent data:', error);
        // Mock data for demo
        setSummary({
          totalExpected: 1450000,
          totalCollected: 1380250,
          totalPending: 35700,
          totalOverdue: 42500,
          collectionRate: 95.2,
        });
        setProperties([
          {
            id: 1,
            name: 'Sunrise Apartments',
            expected_rent: 380000,
            collected_rent: 360000,
            collection_rate: 94.7,
            outstanding: 20000,
            overdue: 8000,
            occupancy: 92,
            caretaker: 'John Kamau',
          },
          {
            id: 2,
            name: 'Kilimani Heights',
            expected_rent: 425500,
            collected_rent: 415000,
            collection_rate: 97.5,
            outstanding: 10500,
            overdue: 5000,
            occupancy: 95,
            caretaker: 'Mary Wanjiku',
          },
      ]);
    } finally {
      setLoading(false);
    }
  };

    fetchRentData();
  }, []);

  const collectionTrend = [
    { name: 'Sep', rate: 93.2 },
    { name: 'Oct', rate: 94.8 },
    { name: 'Nov', rate: 95.2 },
  ];

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
          label="Total Expected Rent"
          value={formatCurrency(summary.totalExpected)}
          icon={DollarSign}
          change="0"
          trend="neutral"
        />
        <StatCard
          title="Total Collected"
          label="Total Collected"
          value={formatCurrency(summary.totalCollected)}
          icon={TrendingUp}
          change="1.8"
          trend="up"
        />
        <StatCard
          title="Pending Payments"
          label="Pending Payments"
          value={formatCurrency(summary.totalPending)}
          icon={Users}
          change="0"
          trend="down"
        />
        <StatCard
          title="Overdue Payments"
          label="Overdue Payments"
          value={formatCurrency(summary.totalOverdue)}
          icon={AlertCircle}
          change="0"
          trend="down"
        />

      {/* Collection Rate Trend */}
      <ChartWrapper
        type="line"
        data={collectionTrend}
        dataKey="rate"
        xAxisKey="name"
        title="Collection Rate Trend (Last 3 Months)"
        height={250}
      />

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Property-by-Property Breakdown
        </h2>
        <DataTable data={properties} columns={columns} isLoading={loading} />
      </div>
      </div>
    </div>
  );
}


