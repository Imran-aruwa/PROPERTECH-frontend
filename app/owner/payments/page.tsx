'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { paymentsApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { DollarSign, Filter, Eye, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { Payment } from '@/app/lib/types';

export default function OwnerPaymentsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, removeToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await paymentsApi.getAll();
        const paymentsArray = Array.isArray(response.data) ? response.data : [];
        setPayments(paymentsArray);
      } catch (err: any) {
        console.error('Failed to load payments:', err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [authLoading, isAuthenticated]);

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' ? true : payment.payment_status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      payment.tenant?.user?.full_name?.toLowerCase().includes(searchLower) ||
      payment.unit?.unit_number?.toLowerCase().includes(searchLower) ||
      payment.transaction_id?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const completedAmount = payments.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const pendingAmount = payments.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-bg-secondary text-tx-primary'
  };

  const statusIcons: Record<string, any> = {
    pending: Clock,
    completed: CheckCircle,
    failed: XCircle,
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-secondary p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-bd rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-tx-primary">Payments</h1>
                <p className="text-tx-secondary mt-1">Track and manage all payments</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary text-tx-secondary rounded-lg hover:bg-bd transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Total Payments</h3>
              <DollarSign className="w-5 h-5 text-tx-muted" />
            </div>
            <p className="text-3xl font-bold text-tx-primary">{payments.length}</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Total Amount</h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(completedAmount)}</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Pending</h3>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-tx-secondary" />
              <span className="font-medium text-tx-secondary">Filters:</span>
            </div>

            <input
              type="text"
              placeholder="Search by tenant, unit, or transaction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <div className="flex gap-2">
              {(['all', 'pending', 'completed', 'failed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-green-600 text-white'
                      : 'bg-bg-secondary text-tx-secondary hover:bg-bd'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-2">({payments.filter(p => p.payment_status === status).length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length === 0 ? (
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-12 text-center">
            <DollarSign className="w-16 h-16 text-tx-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tx-primary mb-2">
              {payments.length === 0 ? 'No payments yet' : 'No payments found'}
            </h3>
            <p className="text-tx-secondary">
              {payments.length === 0
                ? 'Payments will appear here once tenants make payments'
                : 'No payments match your search criteria'}
            </p>
          </div>
        ) : (
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-bd">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-tx-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd">
                  {filteredPayments.map((payment) => {
                    const StatusIcon = statusIcons[payment.payment_status] || Clock;
                    return (
                      <tr key={payment.id} className="hover:bg-bg-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-tx-primary">
                            {payment.transaction_id || `#${payment.id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-tx-primary">
                            {(payment.tenant as any)?.user?.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-tx-primary">
                            {payment.unit?.unit_number || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                            {payment.payment_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-tx-primary">
                            {formatCurrency(payment.amount ?? 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusColors[payment.payment_status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {payment.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tx-muted">
                          {payment.payment_date
                            ? new Date(payment.payment_date).toLocaleDateString()
                            : new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
