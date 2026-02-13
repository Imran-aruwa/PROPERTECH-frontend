'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { tenantsApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, ArrowLeft, Save, User, Phone, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Tenant } from '@/app/lib/types';

interface TenantFormData {
  full_name: string;
  phone: string;
  lease_start: string;
  lease_end: string;
  rent_amount: string;
  deposit_amount: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
}

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const tenantId = params.id as string;

  const [formData, setFormData] = useState<TenantFormData>({
    full_name: '',
    phone: '',
    lease_start: '',
    lease_end: '',
    rent_amount: '',
    deposit_amount: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TenantFormData, string>>>({});

  useEffect(() => {
    if (authLoading || !isAuthenticated || !tenantId) return;

    const fetchTenant = async () => {
      try {
        setLoading(true);
        const response = await tenantsApi.get(tenantId);

        if (response.success && response.data) {
          const t = response.data as Tenant;
          const tenantUser = (t as any).user;
          setTenant(t);
          setFormData({
            full_name: tenantUser?.full_name || '',
            phone: tenantUser?.phone || '',
            lease_start: t.lease_start?.split('T')[0] || '',
            lease_end: t.lease_end?.split('T')[0] || '',
            rent_amount: t.unit?.rent_amount?.toString() || '',
            deposit_amount: (t as any).deposit_amount?.toString() || '',
            emergency_contact_name: (t as any).emergency_contact_name || '',
            emergency_contact_phone: (t as any).emergency_contact_phone || '',
            notes: (t as any).notes || ''
          });
        } else {
          showError('Tenant not found');
          router.push('/owner/tenants');
        }
      } catch (err) {
        console.error('Failed to load tenant:', err);
        showError('Failed to load tenant');
        router.push('/owner/tenants');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [authLoading, isAuthenticated, tenantId, router, showError]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TenantFormData, string>> = {};

    if (!formData.full_name || formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name must be at least 3 characters';
    }
    if (!formData.phone || formData.phone.trim().length < 10) {
      newErrors.phone = 'Valid phone number is required';
    }
    if (!formData.lease_start) {
      newErrors.lease_start = 'Lease start date is required';
    }
    if (!formData.lease_end) {
      newErrors.lease_end = 'Lease end date is required';
    }
    if (formData.lease_start && formData.lease_end && new Date(formData.lease_end) <= new Date(formData.lease_start)) {
      newErrors.lease_end = 'Lease end date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof TenantFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const tenantData = {
        user: {
          full_name: formData.full_name,
          phone: formData.phone
        },
        lease_start: formData.lease_start,
        lease_end: formData.lease_end,
        rent_amount: parseFloat(formData.rent_amount) || 0,
        deposit_amount: parseFloat(formData.deposit_amount) || 0,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        notes: formData.notes
      };

      await tenantsApi.update(tenantId, tenantData);
      success('Tenant updated successfully!');
      setTimeout(() => router.push(`/owner/tenants/${tenantId}`), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tenant..." />
      </div>
    );
  }

  const tenantUser = tenant ? (tenant as any).user : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/owner/tenants/${tenantId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Tenant</h1>
                <p className="text-gray-600 text-sm">{tenantUser?.full_name || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">
                  Email: <span className="font-medium text-gray-700">{tenantUser?.email || 'N/A'}</span>
                  <span className="ml-2 text-gray-400">(Cannot be changed)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Lease Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Lease Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="lease_start" className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Start Date *
                </label>
                <input
                  type="date"
                  id="lease_start"
                  name="lease_start"
                  value={formData.lease_start}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.lease_start ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lease_start && <p className="mt-1 text-sm text-red-500">{errors.lease_start}</p>}
              </div>

              <div>
                <label htmlFor="lease_end" className="block text-sm font-medium text-gray-700 mb-1">
                  Lease End Date *
                </label>
                <input
                  type="date"
                  id="lease_end"
                  name="lease_end"
                  value={formData.lease_end}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.lease_end ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lease_end && <p className="mt-1 text-sm text-red-500">{errors.lease_end}</p>}
              </div>

              <div>
                <label htmlFor="rent_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent (KES)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    id="rent_amount"
                    name="rent_amount"
                    value={formData.rent_amount}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Security Deposit (KES)
                </label>
                <input
                  type="number"
                  id="deposit_amount"
                  name="deposit_amount"
                  value={formData.deposit_amount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/owner/tenants/${tenantId}`}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
