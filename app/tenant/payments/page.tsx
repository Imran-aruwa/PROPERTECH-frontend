'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { paymentsApi } from '@/app/lib/api-services';
import { paystackService } from '@/app/lib/paystack-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DollarSign, CreditCard, Calendar, Filter, Download, Loader2 } from 'lucide-react';
import { Payment } from '@/app/lib/types';

export default function TenantPaymentsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('tenant');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; payment: Payment | null }>({
    isOpen: false,
    payment: null
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [email, setEmail] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentsApi.getAll();
      setPayments(data.data || data);
    } catch (err: any) {
      showError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      setEmail(user.email || '');
      fetchPayments();
    }
  }, [authLoading, isAuthenticated, user, fetchPayments]);

  const handlePaystackPayment = async () => {
    if (!paymentModal.payment) return;

    // Validate email
    if (!paystackService.validateEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }

    // Check if Paystack is configured
    if (!paystackService.isConfigured()) {
      showError('Payment gateway not configured. Please contact support.');
      return;
    }

    try {
      setProcessingPayment(true);

      // Convert amount to kobo (Paystack uses kobo for NGN)
      const amountInKobo = paystackService.toKobo(paymentModal.payment.amount);

      // Generate unique reference
      const reference = paystackService.generateReference('RENT');

      // Initialize Paystack payment
      await paystackService.initializePayment({
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: email,
        amount: amountInKobo,
        reference: reference,
        metadata: {
          payment_id: paymentModal.payment.id,
          payment_type: paymentModal.payment.payment_type,
          tenant_id: user?.id,
          tenant_name: user?.full_name
        },
        onSuccess: async (response) => {
          try {
            // Update payment status in backend
            await paymentsApi.update(paymentModal.payment!.id, {
              payment_status: 'completed',
              transaction_id: response.reference,
              payment_method: 'paystack',
              payment_date: new Date().toISOString()
            });

            success('Payment completed successfully!');
            setPaymentModal({ isOpen: false, payment: null });
            fetchPayments();
          } catch (err: any) {
            showError('Payment successful but failed to update status. Please contact support.');
          }
        },
        onClose: () => {
          setProcessingPayment(false);
          showError('Payment cancelled');
        }
      });

    } catch (err: any) {
      showError(err.message || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    return p.payment_status === filter;
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    completed: 'bg-green-500/20 text-green-300',
    failed: 'bg-red-500/20 text-red-300',
    refunded: 'bg-gray-500/20 text-gray-300'
  };

  const paymentTypeColors: Record<string, string> = {
    rent: 'bg-blue-500/20 text-blue-300',
    water: 'bg-cyan-500/20 text-cyan-300',
    electricity: 'bg-yellow-500/20 text-yellow-300',
    other: 'bg-gray-500/20 text-gray-300'
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-blue-300">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 opacity-90"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-blue-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between animate-fade-in-up">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-white">Payments</h1>
                <p className="text-blue-300 mt-1">Manage your rent and utility payments</p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-slate-700/50 transition"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-lg p-4 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-blue-400" />
            <div className="flex gap-2">
              {(['all', 'pending', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-2 text-xs">
                      ({payments.filter(p => p.payment_status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-lg p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-blue-200 text-sm font-medium">Total Paid</h3>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              KSh {payments
                .filter(p => p.payment_status === 'completed')
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-lg p-6 animate-fade-in-up delay-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-blue-200 text-sm font-medium">Pending</h3>
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              KSh {payments
                .filter(p => p.payment_status === 'pending')
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-lg p-6 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-blue-200 text-sm font-medium">This Month</h3>
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              KSh {payments
                .filter(p => {
                  const paymentDate = new Date(p.payment_date || p.due_date);
                  const now = new Date();
                  return paymentDate.getMonth() === now.getMonth() &&
                         paymentDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-lg overflow-hidden animate-fade-in-up delay-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-blue-500/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase">Payment Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/10">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-blue-400">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${paymentTypeColors[payment.payment_type]}`}>
                          {payment.payment_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                        KSh {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-200">
                        {new Date(payment.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[payment.payment_status]}`}>
                          {payment.payment_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-200">
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {payment.payment_status === 'pending' && (
                          <button
                            onClick={() => setPaymentModal({ isOpen: true, payment })}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition text-sm font-medium"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Paystack Payment Modal */}
      {paymentModal.payment && (
        <Modal
          isOpen={paymentModal.isOpen}
          onClose={() => !processingPayment && setPaymentModal({ isOpen: false, payment: null })}
          title="Complete Payment"
          size="md"
        >
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">Paystack Payment</h3>
                  <p className="text-sm text-blue-300">Secure card payment</p>
                </div>
              </div>
              <div className="border-t border-blue-500/20 pt-3 mt-3">
                <div className="flex justify-between mb-2 text-blue-200">
                  <span>Payment Type:</span>
                  <span className="font-medium capitalize text-white">{paymentModal.payment.payment_type}</span>
                </div>
                <div className="flex justify-between text-blue-200">
                  <span>Amount:</span>
                  <span className="font-bold text-lg text-white">KSh {paymentModal.payment.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-400/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={processingPayment}
              />
              <p className="mt-1 text-sm text-blue-400">
                Payment receipt will be sent to this email
              </p>
            </div>

            <button
              onClick={handlePaystackPayment}
              disabled={processingPayment || !email}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay KSh {paymentModal.payment.amount.toLocaleString()}
                </>
              )}
            </button>

            <p className="text-xs text-center text-blue-400">
              🔒 Payments are processed securely by Paystack
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}