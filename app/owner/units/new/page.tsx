'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { unitsApi, propertiesApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Home, ArrowLeft, Save, Building2, Bed, Bath, Maximize, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Property } from '@/app/lib/types';

interface UnitFormData {
  property_id: string;
  unit_number: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  size_sqm: string;
  rent_amount: string;
  status: 'available' | 'occupied' | 'maintenance';
  description: string;
  amenities: string;
}

export default function NewUnitPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);

  const [formData, setFormData] = useState<UnitFormData>({
    property_id: '',
    unit_number: '',
    floor: '1',
    bedrooms: '1',
    bathrooms: '1',
    size_sqm: '',
    rent_amount: '',
    status: 'available',
    description: '',
    amenities: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UnitFormData, string>>>({});

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await propertiesApi.getAll();
        const propertiesData = Array.isArray(response.data) ? response.data : [];
        setProperties(propertiesData);
        if (propertiesData.length === 1) {
          setFormData(prev => ({ ...prev, property_id: propertiesData[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [authLoading, isAuthenticated]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UnitFormData, string>> = {};

    if (!formData.property_id) {
      newErrors.property_id = 'Please select a property';
    }
    if (!formData.unit_number || formData.unit_number.trim().length < 1) {
      newErrors.unit_number = 'Unit number is required';
    }
    if (!formData.floor || parseInt(formData.floor) < 0) {
      newErrors.floor = 'Valid floor number is required';
    }
    if (!formData.bedrooms || parseInt(formData.bedrooms) < 0) {
      newErrors.bedrooms = 'Number of bedrooms is required';
    }
    if (!formData.bathrooms || parseInt(formData.bathrooms) < 0) {
      newErrors.bathrooms = 'Number of bathrooms is required';
    }
    if (!formData.size_sqm || parseFloat(formData.size_sqm) <= 0) {
      newErrors.size_sqm = 'Valid size is required';
    }
    if (!formData.rent_amount || parseFloat(formData.rent_amount) <= 0) {
      newErrors.rent_amount = 'Valid rent amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof UnitFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const unitData = {
        property_id: parseInt(formData.property_id),
        unit_number: formData.unit_number,
        floor: parseInt(formData.floor),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        size_sqm: parseFloat(formData.size_sqm),
        rent_amount: parseFloat(formData.rent_amount),
        status: formData.status,
        description: formData.description,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : []
      };

      await unitsApi.create(formData.property_id, unitData);
      success('Unit added successfully!');
      setTimeout(() => router.push('/owner/units'), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to add unit');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h2>
          <p className="text-gray-600 mb-4">You need to add a property before you can add units.</p>
          <Link
            href="/owner/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Property First
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/owner/units"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Unit</h1>
                <p className="text-gray-600 text-sm">Create a new unit for your property</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Property
            </h2>
            <div>
              <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 mb-1">
                Select Property *
              </label>
              <select
                id="property_id"
                name="property_id"
                value={formData.property_id}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.property_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
              {errors.property_id && <p className="mt-1 text-sm text-red-500">{errors.property_id}</p>}
            </div>
          </div>

          {/* Unit Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              Unit Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Number *
                </label>
                <input
                  type="text"
                  id="unit_number"
                  name="unit_number"
                  value={formData.unit_number}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.unit_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., A101, Unit 5"
                />
                {errors.unit_number && <p className="mt-1 text-sm text-red-500">{errors.unit_number}</p>}
              </div>

              <div>
                <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">
                  Floor *
                </label>
                <input
                  type="number"
                  id="floor"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.floor ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.floor && <p className="mt-1 text-sm text-red-500">{errors.floor}</p>}
              </div>

              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" /> Bedrooms *
                  </span>
                </label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.bedrooms ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.bedrooms && <p className="mt-1 text-sm text-red-500">{errors.bedrooms}</p>}
              </div>

              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" /> Bathrooms *
                  </span>
                </label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.bathrooms ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.bathrooms && <p className="mt-1 text-sm text-red-500">{errors.bathrooms}</p>}
              </div>

              <div>
                <label htmlFor="size_sqm" className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Maximize className="w-4 h-4" /> Size (m²) *
                  </span>
                </label>
                <input
                  type="number"
                  id="size_sqm"
                  name="size_sqm"
                  value={formData.size_sqm}
                  onChange={handleChange}
                  min="1"
                  step="0.1"
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.size_sqm ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 75"
                />
                {errors.size_sqm && <p className="mt-1 text-sm text-red-500">{errors.size_sqm}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rent */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Pricing
            </h2>
            <div>
              <label htmlFor="rent_amount" className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rent (KES) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                <input
                  type="number"
                  id="rent_amount"
                  name="rent_amount"
                  value={formData.rent_amount}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={`w-full pl-14 pr-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.rent_amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="25000"
                />
              </div>
              {errors.rent_amount && <p className="mt-1 text-sm text-red-500">{errors.rent_amount}</p>}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  id="amenities"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., WiFi, Parking, Balcony, AC"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the unit features, view, special characteristics..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/owner/units"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Adding Unit...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Add Unit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
