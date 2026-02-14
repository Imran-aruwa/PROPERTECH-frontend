'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Home,
  ArrowLeft,
  Save,
  Bed,
  Bath,
  DollarSign,
  Loader2,
  Check,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { agentApi } from '@/app/lib/api-services';

interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  property_type: string;
  description: string;
  total_units: number;
  unit_prefix: string;
  default_bedrooms: number;
  default_bathrooms: number;
  default_toilets: number;
  default_rent: number;
  default_square_feet: number;
  default_has_master_bedroom: boolean;
  default_has_servant_quarters: boolean;
  default_sq_bathrooms: number;
  default_unit_description: string;
}

export default function AgentNewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Kenya',
    property_type: 'residential',
    description: '',
    total_units: 0,
    unit_prefix: 'Unit',
    default_bedrooms: 2,
    default_bathrooms: 1,
    default_toilets: 1,
    default_rent: 0,
    default_square_feet: 0,
    default_has_master_bedroom: false,
    default_has_servant_quarters: false,
    default_sq_bathrooms: 0,
    default_unit_description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await agentApi.createProperty(formData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/agent/properties');
        }, 2000);
      } else {
        setError(response.error || 'Failed to create property');
      }
    } catch (err: any) {
      console.error('Error creating property:', err);
      setError(err.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout role="agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Created!</h2>
            <p className="text-gray-600">Redirecting to properties list...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/agent/properties"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
            <p className="text-gray-600">Create a property listing for management</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Property Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Sunrise Apartments"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Street address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Nairobi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/County
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g., Nairobi County"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="e.g., 00100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="mixed">Mixed Use</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the property..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Unit Generation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-green-600" />
              Unit Configuration
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Set the number of units to automatically generate them with default settings.
                  You can customize individual units later.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="total_units" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Units
                </label>
                <input
                  type="number"
                  id="total_units"
                  name="total_units"
                  value={formData.total_units}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="unit_prefix" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Prefix
                </label>
                <input
                  type="text"
                  id="unit_prefix"
                  name="unit_prefix"
                  value={formData.unit_prefix}
                  onChange={handleChange}
                  placeholder="e.g., Unit, Apt, House"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="default_rent" className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Monthly Rent (KES)
                  </span>
                </label>
                <input
                  type="number"
                  id="default_rent"
                  name="default_rent"
                  value={formData.default_rent}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="default_bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    Bedrooms
                  </span>
                </label>
                <input
                  type="number"
                  id="default_bedrooms"
                  name="default_bedrooms"
                  value={formData.default_bedrooms}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="default_bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    Bathrooms
                  </span>
                </label>
                <input
                  type="number"
                  id="default_bathrooms"
                  name="default_bathrooms"
                  value={formData.default_bathrooms}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="default_toilets" className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Toilets
                </label>
                <input
                  type="number"
                  id="default_toilets"
                  name="default_toilets"
                  value={formData.default_toilets}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="default_square_feet" className="block text-sm font-medium text-gray-700 mb-1">
                  Square Feet
                </label>
                <input
                  type="number"
                  id="default_square_feet"
                  name="default_square_feet"
                  value={formData.default_square_feet}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Additional Features */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Additional Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    name="default_has_master_bedroom"
                    checked={formData.default_has_master_bedroom}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Master Bedroom En-suite</span>
                    <p className="text-sm text-gray-500">Master bedroom has attached bathroom</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    name="default_has_servant_quarters"
                    checked={formData.default_has_servant_quarters}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Servant Quarters (SQ)</span>
                    <p className="text-sm text-gray-500">Separate staff accommodation</p>
                  </div>
                </label>
              </div>

              {formData.default_has_servant_quarters && (
                <div className="mt-4">
                  <label htmlFor="default_sq_bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    SQ Bathrooms
                  </label>
                  <input
                    type="number"
                    id="default_sq_bathrooms"
                    name="default_sq_bathrooms"
                    value={formData.default_sq_bathrooms}
                    onChange={handleChange}
                    min="0"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="mt-4">
                <label htmlFor="default_unit_description" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Description Template
                </label>
                <textarea
                  id="default_unit_description"
                  name="default_unit_description"
                  value={formData.default_unit_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g., Master en-suite, 2 guest toilets, external SQ with washroom"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {formData.total_units > 0 && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
              <p className="text-sm text-gray-600">
                This will create <span className="font-semibold">{formData.total_units}</span> units named{' '}
                <span className="font-mono bg-white px-2 py-0.5 rounded border">
                  {formData.unit_prefix} 1
                </span>{' '}
                through{' '}
                <span className="font-mono bg-white px-2 py-0.5 rounded border">
                  {formData.unit_prefix} {formData.total_units}
                </span>
                {formData.default_rent > 0 && (
                  <>, each with a monthly rent of <span className="font-semibold">KES {formData.default_rent.toLocaleString()}</span></>
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/agent/properties"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Property
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
