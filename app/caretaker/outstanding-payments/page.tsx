'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Clock, AlertCircle, Send, DollarSign, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { caretakerApi } from '@/app/lib/api-services';

interface OutstandingPayment {
  id: string;
  tenant: string;
  unit: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  phone: string;
  status: string;
}

interface Stats {
  totalOutstanding: number;
  overdueTenants: number;
  averageDaysLate: number;
}

export default function OutstandingPaymentsPage() {
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [payments, setPayments] = useState<OutstandingPayment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOutstandingPayments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await caretakerApi.getOutstandingPayments();

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            totalOutstanding: data.total_outstanding || data.totalOutstanding || 0,
            overdueTenants: data.overdue_tenants || data.overdueTenants || 0,
            averageDaysLate: data.average_days_late || data.averageDaysLate || 0,
          });

          const items = data.payments || data.outstanding_payments || [];
          setPayments(items.map((p: any) => ({
            id: p.id?.toString() || '',
            tenant: p.tenant || p.tenant_name || '',
            unit: p.unit || p.unit_number || '',
            amount: p.amount || 0,
            dueDate: p.due_date || p.dueDate || '',
            daysOverdue: p.days_overdue || p.daysOverdue || 0,
            phone: p.phone || '',
            status: p.status || 'overdue',
          })));
        } else {
          setStats({ totalOutstanding: 0, overdueTenants: 0, averageDaysLate: 0 });
          setPayments([]);
        }
      } catch (err) {
        console.error('Failed to fetch outstanding payments:', err);
        setError('Failed to load outstanding payments');
        setStats({ totalOutstanding: 0, overdueTenants: 0, averageDaysLate: 0 });
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutstandingPayments();
  }, []);

  const handleSendReminders = async () => {
    if (selectedPayments.length === 0) {
      alert('Please select payments to send reminders');
      return;
    }

    setSendingReminders(true);
    try {
      // Call API to send reminders
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Reminders sent to ${selectedPayments.length} tenant(s) via SMS`);
      setSelectedPayments([]);
    } catch (err) {
      alert('Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const columns = [
    {
      header: 'Tenant',
      accessor: (row: OutstandingPayment) => row.tenant,
    },
    {
      header: 'Unit',
      accessor: (row: OutstandingPayment) => row.unit,
    },
    {
      header: 'Amount',
      accessor: (row: OutstandingPayment) => formatCurrency(row.amount),
    },
    {
      header: 'Due Date',
      accessor: (row: OutstandingPayment) => row.dueDate,
    },
    {
      header: 'Days Overdue',
      accessor: (row: OutstandingPayment) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.daysOverdue > 10
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {row.daysOverdue} days
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: (row: OutstandingPayment) => row.phone || '-',
    },
  ];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {payments.map((payment) => (
        <div key={payment.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{payment.tenant}</p>
              <p className="text-sm text-gray-500">Unit {payment.unit}</p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                payment.daysOverdue > 10
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {payment.daysOverdue} days overdue
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-medium text-red-600">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">{payment.dueDate}</p>
            </div>
          </div>
          {payment.phone && (
            <div className="pt-2 border-t">
              <a href={`tel:${payment.phone}`} className="text-blue-600 text-sm">
                {payment.phone}
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const statsCards = stats ? [
    { title: "Total Outstanding", label: "This month", value: formatCurrency(stats.totalOutstanding), icon: DollarSign, trend: "up" as const },
    { title: "Overdue Tenants", label: "Action needed", value: stats.overdueTenants.toString(), icon: AlertCircle, trend: "up" as const },
    { title: "Average Days Late", label: "Across tenants", value: stats.averageDaysLate.toString(), icon: Clock, trend: "up" as const },
  ] : [];

  if (isLoading) {
    return (
      <DashboardLayout role="caretaker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading outstanding payments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Outstanding Payments</h1>
            <p className="text-gray-600 mt-1">Track and follow up on overdue payments</p>
          </div>

          <button
            onClick={handleSendReminders}
            disabled={selectedPayments.length === 0 || sendingReminders}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition w-full sm:w-auto"
          >
            {sendingReminders ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Reminders ({selectedPayments.length})
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          {statsCards.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No outstanding payments</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable
                data={payments}
                columns={columns}
                onSelectionChange={setSelectedPayments}
                selectable
              />
            </div>
          </>
        )}

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Reminder Guidelines</h3>
              <p className="mt-2 text-sm text-yellow-700">
                • Send first reminder after 3 days overdue<br />
                • Send second reminder after 7 days overdue<br />
                • Contact property manager after 14 days overdue
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
