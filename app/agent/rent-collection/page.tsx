'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { agentApi } from '@/app/lib/api-services';

interface Collection {
  id: string;
  tenant: string;
  unit: string;
  property: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'paid' | 'pending' | 'overdue';
  commission: number;
}

interface Summary {
  totalExpected: number;
  collected: number;
  pending: number;
  overdue: number;
  collectionRate: number;
}

export default function AgentRentCollectionPage() {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRentCollection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await agentApi.getRentCollection();

        if (response.success && response.data) {
          const data = response.data;
          setSummary({
            totalExpected: data.total_expected || data.totalExpected || 0,
            collected: data.collected || data.total_collected || 0,
            pending: data.pending || data.total_pending || 0,
            overdue: data.overdue || data.total_overdue || 0,
            collectionRate: data.collection_rate || data.collectionRate || 0,
          });

          const items = data.collections || data.payments || [];
          setCollections(items.map((c: any) => ({
            id: c.id?.toString() || '',
            tenant: c.tenant || c.tenant_name || '',
            unit: c.unit || c.unit_number || '',
            property: c.property || c.property_name || '',
            amount: c.amount || c.rent_amount || 0,
            dueDate: c.due_date || c.dueDate || '',
            paidDate: c.paid_date || c.paidDate || null,
            status: c.status || 'pending',
            commission: c.commission || 0,
          })));
        } else {
          setSummary({ totalExpected: 0, collected: 0, pending: 0, overdue: 0, collectionRate: 0 });
          setCollections([]);
        }
      } catch (err) {
        console.error('Failed to fetch rent collection:', err);
        setError('Failed to load rent collection data');
        setSummary({ totalExpected: 0, collected: 0, pending: 0, overdue: 0, collectionRate: 0 });
        setCollections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentCollection();
  }, []);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const filteredCollections = filter === 'all'
    ? collections
    : collections.filter(c => c.status === filter);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const columns = [
    {
      header: 'Tenant',
      accessor: (row: Collection) => (
        <div>
          <p className="font-medium text-gray-900">{row.tenant}</p>
          <p className="text-sm text-gray-500">{row.property} - Unit {row.unit}</p>
        </div>
      ),
    },
    {
      header: 'Rent Amount',
      accessor: (row: Collection) => formatCurrency(row.amount),
    },
    {
      header: 'Your Commission',
      accessor: (row: Collection) => (
        <span className="font-semibold text-blue-600">
          {formatCurrency(row.commission)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (row: Collection) => row.dueDate,
    },
    {
      header: 'Paid Date',
      accessor: (row: Collection) => row.paidDate || '-',
    },
    {
      header: 'Status',
      accessor: (row: Collection) => getStatusBadge(row.status),
    },
  ];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {filteredCollections.map((collection) => (
        <div key={collection.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{collection.tenant}</p>
              <p className="text-sm text-gray-500">{collection.property} - Unit {collection.unit}</p>
            </div>
            {getStatusBadge(collection.status)}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Rent</p>
              <p className="font-medium">{formatCurrency(collection.amount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Commission</p>
              <p className="font-semibold text-blue-600">{formatCurrency(collection.commission)}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">{collection.dueDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Paid Date</p>
              <p className="font-medium">{collection.paidDate || '-'}</p>
            </div>
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
            <p className="text-gray-600">Loading rent collection...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rent Collection</h1>
            <p className="text-gray-600 mt-1">Track rent collection and your commission</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto">
            Export Report
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Expected"
            label="This month"
            value={formatCurrency(summary?.totalExpected || 0)}
            icon={DollarSign}
          />
          <StatCard
            title="Collected"
            label={`${summary?.collectionRate || 0}% collection rate`}
            value={formatCurrency(summary?.collected || 0)}
            change={`${summary?.collectionRate || 0}%`}
            icon={TrendingUp}
            trend="up"
            valueClassName="text-green-600"
          />
          <StatCard
            title="Pending"
            label="Awaiting payment"
            value={formatCurrency(summary?.pending || 0)}
            icon={Clock}
            valueClassName="text-yellow-600"
          />
          <StatCard
            title="Overdue"
            label="Action required"
            value={formatCurrency(summary?.overdue || 0)}
            icon={CheckCircle}
            valueClassName="text-red-600"
          />
        </div>

        {/* Filter buttons - scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {['all', 'paid', 'pending', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>

        {filteredCollections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No collections found</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={filteredCollections} columns={columns} />
            </div>
          </>
        )}

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Commission Details</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Standard rate: 10% of collected rent</li>
              <li>• Bonus: 2% for 95%+ collection rate</li>
              <li>• Early payment bonus: Additional 1%</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <h3 className="text-sm font-medium text-green-800 mb-2">This Month Summary</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Collected: {formatCurrency(summary?.collected || 0)}</p>
              <p>• Your commission: {formatCurrency((summary?.collected || 0) * 0.1)}</p>
              <p>• Collection rate: {summary?.collectionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
