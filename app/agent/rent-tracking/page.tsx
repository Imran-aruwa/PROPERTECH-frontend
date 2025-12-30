'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { agentApi } from '@/app/lib/api-services';

interface RentPayment {
  id: string;
  tenant: string;
  unit: string;
  property: string;
  amount: number;
  commission: number;
  dueDate: string;
  paidDate: string | null;
  status: 'paid' | 'pending' | 'overdue';
}

interface Stats {
  totalCollected: number;
  commissionEarned: number;
  pendingPayments: number;
  collectionRate: number;
}

export default function AgentRentTrackingPage() {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRentTracking = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await agentApi.getRentTracking();

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            totalCollected: data.total_collected || data.totalCollected || 0,
            commissionEarned: data.commission_earned || data.commissionEarned || 0,
            pendingPayments: data.pending_payments || data.pendingPayments || 0,
            collectionRate: data.collection_rate || data.collectionRate || 0,
          });

          const payments = data.payments || data.rent_payments || [];
          setRentPayments(payments.map((p: any) => ({
            id: p.id?.toString() || '',
            tenant: p.tenant || p.tenant_name || '',
            unit: p.unit || p.unit_number || '',
            property: p.property || p.property_name || '',
            amount: p.amount || p.rent_amount || 0,
            commission: p.commission || 0,
            dueDate: p.due_date || p.dueDate || '',
            paidDate: p.paid_date || p.paidDate || null,
            status: p.status || 'pending',
          })));
        } else {
          setStats({ totalCollected: 0, commissionEarned: 0, pendingPayments: 0, collectionRate: 0 });
          setRentPayments([]);
        }
      } catch (err) {
        console.error('Failed to fetch rent tracking:', err);
        setError('Failed to load rent tracking data');
        setStats({ totalCollected: 0, commissionEarned: 0, pendingPayments: 0, collectionRate: 0 });
        setRentPayments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentTracking();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
    return `KES ${amount.toLocaleString()}`;
  };

  const filteredPayments = filter === 'all'
    ? rentPayments
    : rentPayments.filter(p => p.status === filter);

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
      accessor: (row: RentPayment) => (
        <div>
          <p className="font-medium text-gray-900">{row.tenant}</p>
          <p className="text-sm text-gray-500">{row.property} - Unit {row.unit}</p>
        </div>
      ),
    },
    {
      header: 'Rent Amount',
      accessor: (row: RentPayment) => `KES ${row.amount.toLocaleString()}`,
    },
    {
      header: 'Your Commission',
      accessor: (row: RentPayment) => (
        <span className="font-semibold text-blue-600">
          KES {row.commission.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (row: RentPayment) => row.dueDate,
    },
    {
      header: 'Paid Date',
      accessor: (row: RentPayment) => row.paidDate || '-',
    },
    {
      header: 'Status',
      accessor: (row: RentPayment) => getStatusBadge(row.status),
    },
  ];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {filteredPayments.map((payment) => (
        <div key={payment.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{payment.tenant}</p>
              <p className="text-sm text-gray-500">{payment.property} - Unit {payment.unit}</p>
            </div>
            {getStatusBadge(payment.status)}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Rent</p>
              <p className="font-medium">KES {payment.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Commission</p>
              <p className="font-semibold text-blue-600">KES {payment.commission.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">{payment.dueDate}</p>
            </div>
            <div>
              <p className="text-gray-500">Paid Date</p>
              <p className="font-medium">{payment.paidDate || '-'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const statsCards = stats ? [
    { title: 'Total Collected', label: 'This month', value: formatCurrency(stats.totalCollected), icon: DollarSign, trend: "up" as const },
    { title: 'Commission Earned', label: 'Your earnings', value: formatCurrency(stats.commissionEarned), icon: TrendingUp, trend: "up" as const },
    { title: 'Pending Payments', label: 'Awaiting collection', value: stats.pendingPayments.toString(), icon: Clock, trend: "up" as const },
    { title: 'Collection Rate', label: 'Performance', value: `${stats.collectionRate}%`, icon: CheckCircle, trend: "up" as const },
  ] : [];

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading rent tracking...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rent Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor rent collection and your commissions</p>
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
          {statsCards.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} icon={stat.icon} trend={stat.trend} />
          ))}
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

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payments found</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={filteredPayments} columns={columns} />
            </div>
          </>
        )}

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Commission Structure</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Standard rate: 10% of monthly rent</li>
              <li>• Paid upon successful collection</li>
              <li>• Monthly payout on the 5th</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <h3 className="text-sm font-medium text-green-800 mb-2">This Month's Summary</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>• Total collected: {formatCurrency(stats?.totalCollected || 0)}</p>
              <p>• Your commission: {formatCurrency(stats?.commissionEarned || 0)}</p>
              <p>• Collection rate: {stats?.collectionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
