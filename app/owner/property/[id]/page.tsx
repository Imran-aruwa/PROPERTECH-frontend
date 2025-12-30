'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Building2, Users, TrendingUp, AlertCircle, Download, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { apiClient } from '@/app/lib/api-services';

interface Unit {
  id: number;
  unit_number: string;
  tenant_name: string;
  rent_status: 'paid' | 'pending' | 'overdue';
  water_status: 'paid' | 'pending' | 'overdue';
  electricity_status: 'paid' | 'pending' | 'overdue';
  days_overdue: number;
}

interface Property {
  name: string;
  location: string;
  caretaker: string;
  expectedRent: number;
  collectedRent: number;
  pending: number;
  overdue: number;
  waterCollected: number;
  electricityCollected: number;
  totalRevenue: number;
  previousRevenue: number;
}

interface RevenueTrend {
  name: string;
  revenue: number;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);

  const fetchPropertyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/owner/property/${propertyId}`);
      if (response.success && response.data) {
        const data = response.data;
        setProperty({
          name: data.property?.name || data.name || '',
          location: data.property?.location || data.location || '',
          caretaker: data.property?.caretaker || data.caretaker || '',
          expectedRent: data.property?.expected_rent || data.expectedRent || 0,
          collectedRent: data.property?.collected_rent || data.collectedRent || 0,
          pending: data.property?.pending || data.pending || 0,
          overdue: data.property?.overdue || data.overdue || 0,
          waterCollected: data.property?.water_collected || data.waterCollected || 0,
          electricityCollected: data.property?.electricity_collected || data.electricityCollected || 0,
          totalRevenue: data.property?.total_revenue || data.totalRevenue || 0,
          previousRevenue: data.property?.previous_revenue || data.previousRevenue || 0,
        });
        setUnits(data.units || []);
        setRevenueTrend(data.revenue_trend || data.revenueTrend || []);
      } else {
        setError('Property not found');
        setProperty(null);
        setUnits([]);
      }
    } catch (err) {
      console.error('Error fetching property data:', err);
      setError('Failed to load property data');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPropertyData();
  }, [fetchPropertyData]);

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config?.className || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || status}
      </span>
    );
  };

  const columns = [
    {
      header: 'Unit',
      accessor: 'unit_number' as keyof Unit,
    },
    {
      header: 'Tenant',
      accessor: 'tenant_name' as keyof Unit,
    },
    {
      header: 'Rent Status',
      accessor: ((row: Unit) => getStatusBadge(row.rent_status)) as any,
    },
    {
      header: 'Water',
      accessor: ((row: Unit) => getStatusBadge(row.water_status)) as any,
    },
    {
      header: 'Electricity',
      accessor: ((row: Unit) => getStatusBadge(row.electricity_status)) as any,
    },
    {
      header: 'Days Overdue',
      accessor: ((row: Unit) => (
        <span className={row.days_overdue > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
          {row.days_overdue > 0 ? `${row.days_overdue} days` : '-'}
        </span>
      )) as any,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white rounded-lg border">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error || 'Property not found'}</p>
        </div>
      </div>
    );
  }

  const collectionRate = property.expectedRent > 0
    ? ((property.collectedRent / property.expectedRent) * 100).toFixed(1)
    : '0';
  const revenueGrowth = property.previousRevenue > 0
    ? (((property.totalRevenue - property.previousRevenue) / property.previousRevenue) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.name}</h1>
          </div>
          <p className="text-gray-600">{property.location}</p>
          {property.caretaker && (
            <p className="text-sm text-gray-500 mt-1">Managed by: {property.caretaker}</p>
          )}
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto">
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Expected Rent"
          value={formatCurrency(property.expectedRent)}
          icon={Building2}
        />
        <StatCard
          title="Collected Rent"
          value={formatCurrency(property.collectedRent)}
          icon={TrendingUp}
          label={`${collectionRate}% collection rate`}
        />
        <StatCard
          title="Pending"
          value={formatCurrency(property.pending)}
          icon={Users}
          label="Pending Payments"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(property.overdue)}
          icon={AlertCircle}
          label="Overdue Payments"
          valueClassName="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Bills</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Collected:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(property.waterCollected)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Electricity Bills</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Collected:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(property.electricityCollected)}</span>
            </div>
          </div>
        </div>
      </div>

      {revenueTrend.length > 0 && (
        <ChartWrapper
          type="line"
          data={revenueTrend}
          dataKey="revenue"
          xAxisKey="name"
          title={`Revenue Trend (${parseFloat(revenueGrowth) > 0 ? '+' : ''}${revenueGrowth}% vs last month)`}
          height={250}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Unit-by-Unit Breakdown</h2>
        {units.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No units found for this property</p>
          </div>
        ) : (
          <DataTable data={units} columns={columns} />
        )}
      </div>
    </div>
  );
}
