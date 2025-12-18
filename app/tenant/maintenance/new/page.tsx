'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { maintenanceApi, tenantsApi } from '@/lib/api-services';
import { useForm, useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Wrench, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function NewMaintenanceRequestPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('tenant');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);

  const fetchTenantInfo = useCallback(async () => {
    try {
      setLoadingTenant(true);
      const response = await tenantsApi.getAll();
      const tenants = response.data || response;
      const currentTenant = tenants.find((t: any) => t.user_id === user?.id);
      if (currentTenant) {
        setTenantInfo(currentTenant);
      } else {
        showError('Tenant information not found');
      }
    } catch (err: any) {
      showError('Failed to load tenant information');
    } finally {
      setLoadingTenant(false);
    }
  }, [user, showError]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchTenantInfo();
    }
  }, [authLoading, isAuthenticated, fetchTenantInfo]);

  const validateForm = (values: MaintenanceFormData) => {
    const errors: Partial<Record<keyof MaintenanceFormData, string>> = {};

    if (!values.title || values.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    if (!values.description || values.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    return errors;
  };

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm<MaintenanceFormData>(
    {
      title: '',
      description: '',
      priority: 'medium'
    },
    validateForm
  );

  const onSubmit = async (data: MaintenanceFormData) => {
    if (!tenantInfo) {
      showError('Tenant information not available');
      return;
    }

    try {
      setSubmitting(true);
      await maintenanceApi.create({
        ...data,
        unit_id: tenantInfo.unit_id,
        tenant_id: tenantInfo.id
      });
      success('Maintenance request submitted successfully!');
      setTimeout(() => router.push('/tenant/maintenance'), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = (fieldName: keyof MaintenanceFormData) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      touched[fieldName] && errors[fieldName]
        ? 'border-red-500'
        : 'border-gray-300'
    }`;

  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Unable to Submit Request</h2>
          <p className="text-gray-600 mb-6">Tenant information not found. Please contact support.</p>
          <Link
            href="/tenant"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const priorityOptions = [
    { value: 'low', label: 'Low - Can wait', color: 'text-gray-600', description: 'Non-urgent, cosmetic issues' },
    { value: 'medium', label: 'Medium - Normal', color: 'text-blue-600', description: 'Regular maintenance needs' },
    { value: 'high', label: 'High - Important', color: 'text-orange-600', description: 'Affects comfort or functionality' },
    { value: 'urgent', label: 'Urgent - Immediate', color: 'text-red-600', description: 'Safety hazard or critical issue' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/tenant/maintenance"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Submit Maintenance Request</h1>
                <p className="text-gray-600 mt-1">Describe the issue you&apos;re experiencing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unit Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-blue-900 mb-2">Your Unit Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Unit Number:</span>
              <span className="ml-2 font-medium text-blue-900">
                {tenantInfo.unit?.unit_number || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Property:</span>
              <span className="ml-2 font-medium text-blue-900">
                {tenantInfo.unit?.property?.name || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              className={inputClasses('title')}
              placeholder="e.g., Leaking faucet in kitchen"
            />
            {touched.title && errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              rows={6}
              className={inputClasses('description')}
              placeholder="Please provide a detailed description of the issue. Include when it started, what you've noticed, and any other relevant information..."
            />
            {touched.description && errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Priority Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Priority Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('priority', option.value as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    values.priority === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`font-medium ${option.color}`}>
                      {option.label}
                    </span>
                    {values.priority === option.value && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Important Notes:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>For emergencies (gas leaks, flooding, fire), contact emergency services immediately</li>
                  <li>Maintenance staff will be assigned to your request within 24-48 hours</li>
                  <li>You&apos;ll receive updates via email as your request progresses</li>
                  <li>Ensure someone is available to provide access to the unit when scheduled</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
            <Link
              href="/tenant/maintenance"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}