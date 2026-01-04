'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { propertiesApi } from '@/lib/api-services';
import { useForm, useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description: string;
  image_url: string;
}

export default function NewPropertyPage() {
  const { isLoading: authLoading } = useRequireAuth('owner');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (values: PropertyFormData) => {
    const errors: Partial<Record<keyof PropertyFormData, string>> = {};

    if (!values.name || values.name.trim().length < 3) {
      errors.name = 'Property name must be at least 3 characters';
    }
    if (!values.address || values.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }
    if (!values.city || values.city.trim().length < 2) {
      errors.city = 'City is required';
    }
    if (!values.state || values.state.trim().length < 2) {
      errors.state = 'State/County is required';
    }
    if (!values.postal_code || values.postal_code.trim().length < 4) {
      errors.postal_code = 'Valid postal code is required';
    }
    if (!values.country || values.country.trim().length < 2) {
      errors.country = 'Country is required';
    }

    return errors;
  };

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm<PropertyFormData>(
    {
      name: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Kenya',
      description: '',
      image_url: ''
    },
    validateForm
  );

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setSubmitting(true);
      console.log('[NewProperty] Creating property with data:', data);
      const response = await propertiesApi.create(data);
      console.log('[NewProperty] Create response:', JSON.stringify(response, null, 2));

      if (!response.success) {
        showError(response.error || 'Failed to add property');
        return;
      }

      success('Property added successfully!');
      setTimeout(() => router.push('/owner/properties'), 1500);
    } catch (err: any) {
      console.error('[NewProperty] Error:', err);
      showError(err.message || 'Failed to add property');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = (fieldName: keyof PropertyFormData) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
      touched[fieldName] && errors[fieldName]
        ? 'border-red-500'
        : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/owner/properties"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
                <p className="text-gray-600 mt-1">Fill in the details below</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Property Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={inputClasses('name')}
              placeholder="e.g., Sunset Apartments"
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Address */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              className={inputClasses('address')}
              placeholder="123 Main Street"
            />
            {touched.address && errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          {/* City, State, Postal Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={values.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                className={inputClasses('city')}
                placeholder="Nairobi"
              />
              {touched.city && errors.city && (
                <p className="mt-1 text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/County <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={values.state}
                onChange={(e) => handleChange('state', e.target.value)}
                onBlur={() => handleBlur('state')}
                className={inputClasses('state')}
                placeholder="Nairobi County"
              />
              {touched.state && errors.state && (
                <p className="mt-1 text-sm text-red-500">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={values.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                onBlur={() => handleBlur('postal_code')}
                className={inputClasses('postal_code')}
                placeholder="00100"
              />
              {touched.postal_code && errors.postal_code && (
                <p className="mt-1 text-sm text-red-500">{errors.postal_code}</p>
              )}
            </div>
          </div>

          {/* Country */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.country}
              onChange={(e) => handleChange('country', e.target.value)}
              onBlur={() => handleBlur('country')}
              className={inputClasses('country')}
              placeholder="Kenya"
            />
            {touched.country && errors.country && (
              <p className="mt-1 text-sm text-red-500">{errors.country}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={values.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              rows={4}
              className={inputClasses('description')}
              placeholder="Describe your property (optional)..."
            />
          </div>

          {/* Image URL */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={values.image_url}
              onChange={(e) => handleChange('image_url', e.target.value)}
              onBlur={() => handleBlur('image_url')}
              className={inputClasses('image_url')}
              placeholder="https://example.com/image.jpg (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide a URL to an image of your property
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Add Property
                </>
              )}
            </button>
            <Link
              href="/owner/properties"
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



