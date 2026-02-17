'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { CreditCard, Home, Wrench, FileText, Loader2, FileSignature } from 'lucide-react';
import { tenantDashboardApi, apiClient } from '@/app/lib/api-services';
import Link from 'next/link';

interface DashboardStats {
  nextPaymentDue: string;
  rentAmount: number;
  openRequests: number;
  leaseEnd: string;
  unitNumber: string;
  propertyName: string;
}

interface RecentPayment {
  id: string;
  month: string;
  amount: number;
  status: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export default function TenantDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLease, setActiveLease] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await tenantDashboardApi.getDashboard();

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            nextPaymentDue: data.next_payment_due || data.nextPaymentDue || '-',
            rentAmount: data.rent_amount || data.rentAmount || 0,
            openRequests: data.open_requests || data.openRequests || 0,
            leaseEnd: data.lease_end || data.leaseEnd || '-',
            unitNumber: data.unit_number || data.unitNumber || '-',
            propertyName: data.property_name || data.propertyName || '-',
          });
          setRecentPayments(data.recent_payments || data.recentPayments || []);
          setMaintenanceRequests(data.maintenance_requests || data.maintenanceRequests || []);

          // Try to fetch active lease
          try {
            const leaseRes = await apiClient.get('/tenant/leases/');
            if (leaseRes.success && leaseRes.data) {
              const leases = Array.isArray(leaseRes.data) ? leaseRes.data : leaseRes.data?.data ? (Array.isArray(leaseRes.data.data) ? leaseRes.data.data : []) : [];
              const active = leases.find((l: any) => l.status === 'active' || l.status === 'signed');
              if (active) setActiveLease(active);
            }
          } catch {
            // Lease fetch is optional
          }
        } else {
          setStats({
            nextPaymentDue: '-',
            rentAmount: 0,
            openRequests: 0,
            leaseEnd: '-',
            unitNumber: '-',
            propertyName: '-',
          });
          setRecentPayments([]);
          setMaintenanceRequests([]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
        setStats({
          nextPaymentDue: '-',
          rentAmount: 0,
          openRequests: 0,
          leaseEnd: '-',
          unitNumber: '-',
          propertyName: '-',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const statsCards = stats ? [
    { title: 'Next Payment Due', label: 'For reference', value: stats.nextPaymentDue, change: 'Due soon', icon: CreditCard, trend: "up" as const },
    { title: 'Rent Amount', label: 'For reference', value: formatCurrency(stats.rentAmount), change: 'Monthly', icon: Home, trend: "up" as const },
    { title: 'Open Requests', label: 'For reference', value: stats.openRequests.toString(), change: 'Pending', icon: Wrench, trend: "up" as const },
    { title: 'Lease Ends', label: 'For reference', value: stats.leaseEnd, change: 'Contract end', icon: FileText, trend: "up" as const },
  ] : [];

  if (isLoading) {
    return (
      <DashboardLayout role="tenant">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tenant">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tenant Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {stats?.unitNumber && stats?.propertyName
              ? `Unit ${stats.unitNumber}, ${stats.propertyName}`
              : 'Welcome to your dashboard'}
          </p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        {activeLease && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Active Lease</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeLease.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {activeLease.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <p className="text-gray-500">Start</p>
                <p className="font-medium text-gray-900">{activeLease.start_date}</p>
              </div>
              <div>
                <p className="text-gray-500">End</p>
                <p className="font-medium text-gray-900">{activeLease.end_date}</p>
              </div>
              <div>
                <p className="text-gray-500">Rent</p>
                <p className="font-medium text-gray-900">KES {activeLease.rent_amount?.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/tenant/documents" className="text-blue-600 text-sm hover:underline">
              View lease documents &rarr;
            </Link>
          </div>
        )}

        {stats && stats.rentAmount > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">Pay Your Rent</h2>
            <p className="mb-4 opacity-90">Next payment due: {stats.nextPaymentDue}</p>
            <Link
              href="/tenant/payments"
              className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Pay Now - {formatCurrency(stats.rentAmount)}
            </Link>
          </div>
        )}

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No payment history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                    <span className="text-gray-700">{payment.month}</span>
                    <span className={`font-semibold ${payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Maintenance Requests</h2>
              <Link href="/tenant/maintenance" className="text-blue-600 text-sm hover:underline">
                View all
              </Link>
            </div>
            {maintenanceRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No maintenance requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {maintenanceRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-3 border-l-4 rounded ${
                      request.priority === 'high'
                        ? 'border-red-500 bg-red-50'
                        : request.status === 'in_progress'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-green-500 bg-green-50'
                    }`}
                  >
                    <p className={`font-medium ${
                      request.priority === 'high' ? 'text-red-900' :
                      request.status === 'in_progress' ? 'text-yellow-900' : 'text-green-900'
                    }`}>
                      {request.title}
                    </p>
                    <p className={`text-sm ${
                      request.priority === 'high' ? 'text-red-700' :
                      request.status === 'in_progress' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      Status: {request.status.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
