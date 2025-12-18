'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { paymentsApi, maintenanceApi } from '@/lib/api-services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Home, DollarSign, Wrench, Calendar, AlertCircle, Plus, CreditCard, Droplet, Zap } from 'lucide-react';
import Link from 'next/link';
import { Payment, MaintenanceRequest } from '@/app/lib/types';

export default function TenantDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('tenant');
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [payments, maintenance] = await Promise.all([
        paymentsApi.getAll(),
        maintenanceApi.getAll()
      ]);

      setRecentPayments(payments.data.slice(0, 5));
      setMaintenanceRequests(maintenance.data.filter((m: MaintenanceRequest) => m.status !== 'completed').slice(0, 5));
      setPendingPayments(payments.data.filter((p: Payment) => p.payment_status === 'pending'));
    } catch (err: any) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const stats = [
    {
      title: 'Pending Payments',
      value: pendingPayments.length,
      icon: AlertCircle,
      color: 'bg-orange-500',
      link: '/tenant/payments?status=pending'
    },
    {
      title: 'Total Paid This Month',
      value: `KSh ${recentPayments
        .filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)
        .toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/tenant/payments'
    },
    {
      title: 'Active Maintenance',
      value: maintenanceRequests.length,
      icon: Wrench,
      color: 'bg-blue-500',
      link: '/tenant/maintenance'
    },
    {
      title: 'Lease Status',
      value: 'Active',
      icon: Home,
      color: 'bg-purple-500',
      link: '/tenant/lease'
    },
  ];

  const paymentTypeIcons: Record<string, any> = {
    rent: Home,
    water: Droplet,
    electricity: Zap,
    other: DollarSign
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name || 'Tenant'}!
            </h1>
            <p className="text-gray-600 mt-1">Manage your tenancy and payments</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link
              key={index}
              href={stat.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  You have {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-orange-800 mb-4">
                  Total amount due: KSh {pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
                <Link
                  href="/tenant/payments?status=pending"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
              <Link
                href="/tenant/payments"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No payment history yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => {
                  const Icon = paymentTypeIcons[payment.payment_type] || DollarSign;
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {payment.payment_type}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(payment.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          KSh {payment.amount.toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[payment.payment_status]}`}>
                          {payment.payment_status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Maintenance Requests</h2>
              <Link
                href="/tenant/maintenance/new"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New
              </Link>
            </div>

            {maintenanceRequests.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No active maintenance requests</p>
                <Link
                  href="/tenant/maintenance/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Submit Request
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {maintenanceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{request.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.priority} priority
                      </span>
                      <span>{new Date(request.reported_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/tenant/payments"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <CreditCard className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Make Payment</h3>
            <p className="text-sm text-gray-600">Pay your rent and utilities</p>
          </Link>

          <Link
            href="/tenant/maintenance/new"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Wrench className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Request Maintenance</h3>
            <p className="text-sm text-gray-600">Report issues in your unit</p>
          </Link>

          <Link
            href="/tenant/profile"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Home className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">My Profile</h3>
            <p className="text-sm text-gray-600">View lease and unit details</p>
          </Link>
        </div>
      </div>
    </div>
  );
}