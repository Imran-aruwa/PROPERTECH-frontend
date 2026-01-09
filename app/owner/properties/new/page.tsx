'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { propertiesApi } from '@/lib/api-services';
import { useForm, useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { PropertyType } from '@/app/lib/types';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment Complex' },
  { value: 'maisonette', label: 'Maisonette' },
  { value: 'standalone', label: 'Standalone House' },
  { value: 'commercial', label: 'Commercial Property' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' },
  { value: 'bungalow', label: 'Bungalow' },
];

interface PropertyFormData {
  name: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description: string;
  image_url: string;
  // Unit generation fields
  total_units: number;
  unit_prefix: string;
  default_bedrooms: number;
  default_bathrooms: number;
  default_toilets: number;
  default_rent: number | '';
  default_square_feet: number | '';
  // Master bedroom
  default_has_master_bedroom: boolean;
  // Servant quarters
  default_has_servant_quarters: boolean;
  default_sq_bathrooms: number;
  // Unit description
  default_unit_description: string;
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
      property_type: 'apartment',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Kenya',
      description: '',
      image_url: '',
      // Unit generation defaults
      total_units: 0,
      unit_prefix: 'Unit',
      default_bedrooms: 3,
      default_bathrooms: 2,
      default_toilets: 3,
      default_rent: '',
      default_square_feet: '',
      // Master bedroom
      default_has_master_bedroom: true,
      // Servant quarters
      default_has_servant_quarters: false,
      default_sq_bathrooms: 0,
      // Unit description
      default_unit_description: ''
    },
    validateForm
  );

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setSubmitting(true);

      // Format data for API - convert empty strings to null/undefined
      const apiData = {
        ...data,
        total_units: data.total_units || 0,
        unit_prefix: data.unit_prefix || 'Unit',
        default_bedrooms: data.default_bedrooms || 1,
        default_bathrooms: data.default_bathrooms || 1,
        default_toilets: data.default_toilets || 0,
        default_rent: data.default_rent || null,
        default_square_feet: data.default_square_feet || null,
        default_has_master_bedroom: data.default_has_master_bedroom || false,
        default_has_servant_quarters: data.default_has_servant_quarters || false,
        default_sq_bathrooms: data.default_sq_bathrooms || 0,
        default_unit_description: data.default_unit_description || null
      };

      console.log('[NewProperty] Creating property with data:', apiData);
      const response = await propertiesApi.create(apiData);
      console.log('[NewProperty] Create response:', JSON.stringify(response, null, 2));

      if (!response.success) {
        showError(response.error || 'Failed to add property');
        return;
      }

      const unitsCreated = data.total_units || 0;
      const message = unitsCreated > 0
        ? `Property added with ${unitsCreated} units!`
        : 'Property added successfully!';
      success(message);
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

          {/* Property Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              value={values.property_type}
              onChange={(e) => handleChange('property_type', e.target.value as PropertyType)}
              onBlur={() => handleBlur('property_type')}
              className={inputClasses('property_type')}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select the type of property for better categorization and reporting
            </p>
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

          {/* Unit Generation Section */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Configuration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Automatically generate units for this property. Leave "Number of Units" at 0 to skip automatic unit creation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Number of Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={values.total_units}
                  onChange={(e) => handleChange('total_units', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('total_units')}
                  className={inputClasses('total_units')}
                  placeholder="0"
                />
              </div>

              {/* Unit Prefix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Prefix
                </label>
                <select
                  value={values.unit_prefix}
                  onChange={(e) => handleChange('unit_prefix', e.target.value)}
                  onBlur={() => handleBlur('unit_prefix')}
                  className={inputClasses('unit_prefix')}
                >
                  <option value="Unit">Unit</option>
                  <option value="Apt">Apt</option>
                  <option value="Suite">Suite</option>
                  <option value="Room">Room</option>
                  <option value="House">House</option>
                  <option value="">No Prefix (Numbers Only)</option>
                </select>
              </div>

              {/* Default Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Bedrooms
                </label>
                <select
                  value={values.default_bedrooms}
                  onChange={(e) => handleChange('default_bedrooms', parseInt(e.target.value))}
                  onBlur={() => handleBlur('default_bedrooms')}
                  className={inputClasses('default_bedrooms')}
                >
                  <option value="0">Studio</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
              </div>

              {/* Default Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Bathrooms
                </label>
                <select
                  value={values.default_bathrooms}
                  onChange={(e) => handleChange('default_bathrooms', parseFloat(e.target.value))}
                  onBlur={() => handleBlur('default_bathrooms')}
                  className={inputClasses('default_bathrooms')}
                >
                  <option value="1">1 Bathroom</option>
                  <option value="1.5">1.5 Bathrooms</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="2.5">2.5 Bathrooms</option>
                  <option value="3">3 Bathrooms</option>
                  <option value="3.5">3.5 Bathrooms</option>
                  <option value="4">4+ Bathrooms</option>
                </select>
              </div>

              {/* Default Toilets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Toilets (Separate)
                </label>
                <select
                  value={values.default_toilets}
                  onChange={(e) => handleChange('default_toilets', parseInt(e.target.value))}
                  onBlur={() => handleBlur('default_toilets')}
                  className={inputClasses('default_toilets')}
                >
                  <option value="0">0 Toilets</option>
                  <option value="1">1 Toilet</option>
                  <option value="2">2 Toilets</option>
                  <option value="3">3 Toilets</option>
                  <option value="4">4+ Toilets</option>
                </select>
              </div>

              {/* Default Rent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Monthly Rent (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  value={values.default_rent}
                  onChange={(e) => handleChange('default_rent', e.target.value ? parseFloat(e.target.value) : '')}
                  onBlur={() => handleBlur('default_rent')}
                  className={inputClasses('default_rent')}
                  placeholder="e.g., 15000"
                />
              </div>

              {/* Default Square Feet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Size (sq ft)
                </label>
                <input
                  type="number"
                  min="0"
                  value={values.default_square_feet}
                  onChange={(e) => handleChange('default_square_feet', e.target.value ? parseInt(e.target.value) : '')}
                  onBlur={() => handleBlur('default_square_feet')}
                  className={inputClasses('default_square_feet')}
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            {/* Additional Features Section */}
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h4 className="text-md font-medium text-gray-800 mb-4">Additional Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Master Bedroom */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="master_bedroom"
                    checked={values.default_has_master_bedroom}
                    onChange={(e) => handleChange('default_has_master_bedroom', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="master_bedroom" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Has Master Bedroom (En-suite)
                  </label>
                </div>

                {/* Servant Quarters */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="servant_quarters"
                    checked={values.default_has_servant_quarters}
                    onChange={(e) => handleChange('default_has_servant_quarters', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="servant_quarters" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Has Servant Quarters (SQ)
                  </label>
                </div>

                {/* SQ Bathrooms - only show if servant quarters is checked */}
                {values.default_has_servant_quarters && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SQ Bathrooms
                    </label>
                    <select
                      value={values.default_sq_bathrooms}
                      onChange={(e) => handleChange('default_sq_bathrooms', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="0">No Bathroom</option>
                      <option value="1">1 Bathroom</option>
                      <option value="2">2 Bathrooms</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Unit Description */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Description (applies to all units)
                </label>
                <textarea
                  value={values.default_unit_description}
                  onChange={(e) => handleChange('default_unit_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="e.g., Master en-suite, 2 guest toilets, external SQ with washroom"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This description will be added to all generated units. You can edit individual units later.
                </p>
              </div>
            </div>

            {values.total_units > 0 && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{values.total_units}</strong> units will be created: {values.default_bedrooms} BR, {values.default_bathrooms} Bath
                  {values.default_toilets > 0 && `, ${values.default_toilets} Toilets`}
                  {values.default_has_master_bedroom && ', Master Bedroom'}
                  {values.default_has_servant_quarters && `, SQ with ${values.default_sq_bathrooms} bathroom(s)`}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Units: {values.unit_prefix} 1, {values.unit_prefix} 2, ... {values.unit_prefix} {values.total_units}
                </p>
              </div>
            )}
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



