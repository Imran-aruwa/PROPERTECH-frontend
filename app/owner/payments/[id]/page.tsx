'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { paymentsApi } from '@/app/lib/api-services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DollarSign, ArrowLeft, Calendar, User, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function PaymentDetailPage() {
  const { isLoading: authLoading } = useRequireAuth('owner');
  const params = useParams();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const fetchPayment = async () => {
      try {
        const res = await paymentsApi.get(params.id as string);
        if (res.success) setPayment(res.data?.data || res.data);
      } catch (err) {
        console.error('Failed to load payment:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [authLoading, params.id]);

  if (authLoading || loading) {
    return <div className="min-h-screen bg-bg-secondary flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-bg-secondary text-tx-primary';
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="bg-bg-card shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/owner/payments" className="p-2 hover:bg-bg-hover rounded-lg"><ArrowLeft className="w-5 h-5 text-tx-secondary" /></Link>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-tx-primary">Payment Details</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!payment ? (
          <div className="bg-bg-card rounded-lg shadow-sm border p-8 text-center">
            <p className="text-tx-muted">Payment not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-tx-primary">Payment #{payment.id}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(payment.status || payment.payment_status)}`}>
                  {payment.status || payment.payment_status || 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3"><DollarSign className="w-5 h-5 text-tx-muted" /><div><p className="text-sm text-tx-muted">Amount</p><p className="font-semibold text-tx-primary">KES {(payment.amount || 0).toLocaleString()}</p></div></div>
                <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-tx-muted" /><div><p className="text-sm text-tx-muted">Date</p><p className="font-semibold text-tx-primary">{payment.payment_date || payment.created_at ? new Date(payment.payment_date || payment.created_at).toLocaleDateString() : 'N/A'}</p></div></div>
                <div className="flex items-center gap-3"><User className="w-5 h-5 text-tx-muted" /><div><p className="text-sm text-tx-muted">Tenant</p><p className="font-semibold text-tx-primary">{payment.tenant?.user?.full_name || payment.tenant_name || 'N/A'}</p></div></div>
                <div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-tx-muted" /><div><p className="text-sm text-tx-muted">Method</p><p className="font-semibold text-tx-primary capitalize">{payment.payment_method || 'N/A'}</p></div></div>
              </div>
              {payment.reference_number && (
                <div className="mt-4 pt-4 border-t"><p className="text-sm text-tx-muted">Reference</p><p className="font-medium text-tx-primary">{payment.reference_number}</p></div>
              )}
              {payment.notes && (
                <div className="mt-4 pt-4 border-t"><p className="text-sm text-tx-muted">Notes</p><p className="text-tx-primary">{payment.notes}</p></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
