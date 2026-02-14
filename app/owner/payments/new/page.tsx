'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { paymentsApi, tenantsApi, propertiesApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DollarSign, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewPaymentPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tenant_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'rent',
    payment_method: 'mpesa',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const tenantsRes = await tenantsApi.getAll();
        setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenant_id || !formData.amount) {
      showError('Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const selectedTenant = tenants.find(t => String(t.id) === formData.tenant_id);
      await paymentsApi.create({
        tenant_id: parseInt(formData.tenant_id),
        unit_id: selectedTenant?.unit_id,
        property_id: selectedTenant?.property_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        notes: formData.notes,
        status: 'paid',
      });
      success('Payment recorded successfully');
      setTimeout(() => router.push('/owner/payments'), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" text="Loading..." /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/owner/payments" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                <p className="text-gray-600 text-sm">Record a rent or other payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select name="tenant_id" value={formData.tenant_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="">Select tenant</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id} className="text-gray-900">
                      {t.user?.full_name || t.full_name || 'Unknown'} - {t.unit?.unit_number || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="25000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select name="payment_type" value={formData.payment_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="rent">Rent</option>
                  <option value="deposit">Deposit</option>
                  <option value="penalty">Penalty</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="mpesa">M-Pesa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="paystack">Paystack</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input type="text" name="reference_number" value={formData.reference_number} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Transaction reference" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Optional notes..." />
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href="/owner/payments" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</Link>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {submitting ? <><LoadingSpinner size="sm" /> Recording...</> : <><Save className="w-5 h-5" /> Record Payment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
