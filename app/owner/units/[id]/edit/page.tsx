'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { unitsApi, propertiesApi, tenantsApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Home, ArrowLeft, Save, Bed, Bath, Maximize, DollarSign, Users, UserPlus, UserMinus, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Unit, Property, Tenant } from '@/app/lib/types';

interface UnitFormData {
  unit_number: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  size_sqm: string;
  rent_amount: string;
  status: 'available' | 'occupied' | 'maintenance' | 'vacant' | 'rented' | 'bought' | 'mortgaged';
  description: string;
}

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [removingTenant, setRemovingTenant] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const unitId = params.id as string;

  const [formData, setFormData] = useState<UnitFormData>({
    unit_number: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    size_sqm: '',
    rent_amount: '',
    status: 'vacant',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UnitFormData, string>>>({});

  useEffect(() => {
    if (authLoading || !isAuthenticated || !unitId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const propertiesResponse = await propertiesApi.getAll();
        const propertiesData = Array.isArray(propertiesResponse.data) ? propertiesResponse.data : [];

        let foundUnit: Unit | null = null;
        let foundProperty: Property | null = null;

        for (const prop of propertiesData) {
          const unitsResponse = await unitsApi.list(prop.id.toString());
          if (unitsResponse.success && Array.isArray(unitsResponse.data)) {
            const matchingUnit = unitsResponse.data.find((u: Unit) => String(u.id) === String(unitId));
            if (matchingUnit) {
              foundUnit = matchingUnit;
              foundProperty = prop;
              break;
            }
          }
        }

        if (!foundUnit) {
          showError('Unit not found');
          router.push('/owner/units');
          return;
        }

        setUnit(foundUnit);
        setProperty(foundProperty);
        const rentValue = (foundUnit as any).monthly_rent ?? foundUnit.rent_amount ?? 0;
        const sizeValue = (foundUnit as any).square_feet ?? foundUnit.size_sqm ?? 0;
        setFormData({
          unit_number: foundUnit.unit_number || '',
          floor: foundUnit.floor?.toString() || '',
          bedrooms: foundUnit.bedrooms?.toString() || '',
          bathrooms: foundUnit.bathrooms?.toString() || '',
          size_sqm: sizeValue.toString(),
          rent_amount: rentValue.toString(),
          status: foundUnit.status || 'vacant',
          description: foundUnit.description || ''
        });

        // Fetch tenant info if unit is occupied
        const isOccupied = foundUnit.status?.toLowerCase() === 'occupied' || foundUnit.status?.toLowerCase() === 'rented';
        if (isOccupied) {
          try {
            const tenantsResponse = await tenantsApi.list();
            const tenantsData = Array.isArray(tenantsResponse.data) ? tenantsResponse.data : [];
            const unitTenant = tenantsData.find((t: any) => {
              const tUnitId = t.unit_id ?? t.unit?.id;
              return String(tUnitId) === String(unitId);
            });
            if (unitTenant) {
              setCurrentTenant(unitTenant);
            }
          } catch (err) {
            console.error('Failed to fetch tenant info:', err);
          }
        }
      } catch (err) {
        console.error('Failed to load unit:', err);
        showError('Failed to load unit');
        router.push('/owner/units');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, unitId, router, showError]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UnitFormData, string>> = {};

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
    if (!validateForm() || !property) return;

    try {
      setSubmitting(true);

      const unitData = {
        unit_number: formData.unit_number,
        floor: parseInt(formData.floor),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        size_sqm: parseFloat(formData.size_sqm),
        square_feet: parseFloat(formData.size_sqm),
        rent_amount: parseFloat(formData.rent_amount),
        monthly_rent: parseFloat(formData.rent_amount),
        status: formData.status,
        description: formData.description
      };

      await unitsApi.update(property.id.toString(), unitId, unitData);
      success('Unit updated successfully!');
      setTimeout(() => router.push(`/owner/units/${unitId}`), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to update unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveTenant = async () => {
    if (!currentTenant || !property) return;

    try {
      setRemovingTenant(true);
      const tenantId = currentTenant.id ?? currentTenant.user_id;

      // Delete tenant assignment
      await tenantsApi.delete(String(tenantId));

      // Update unit status to vacant
      await unitsApi.update(property.id.toString(), unitId, {
        ...unit,
        status: 'vacant'
      });

      setCurrentTenant(null);
      setFormData(prev => ({ ...prev, status: 'vacant' }));
      setShowRemoveConfirm(false);
      success('Tenant removed and unit set to vacant.');
    } catch (err: any) {
      showError(err.message || 'Failed to remove tenant');
    } finally {
      setRemovingTenant(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading unit..." />
      </div>
    );
  }

  const isOccupied = formData.status === 'occupied' || formData.status === 'rented';
  const tenantName = currentTenant?.user?.full_name ?? currentTenant?.full_name ?? 'Unknown Tenant';
  const tenantEmail = currentTenant?.user?.email ?? currentTenant?.email ?? '';
  const tenantPhone = currentTenant?.user?.phone ?? currentTenant?.phone ?? '';
  const tenantId = currentTenant?.id ?? currentTenant?.user_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/owner/units/${unitId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Unit {unit?.unit_number}</h1>
                <p className="text-gray-600 text-sm">{property?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tenant Management Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Tenant Management
            </h2>

            {isOccupied && currentTenant ? (
              <div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium mb-1">Current Tenant</p>
                      <p className="text-lg font-semibold text-gray-900">{tenantName}</p>
                      {tenantEmail && <p className="text-sm text-gray-600">{tenantEmail}</p>}
                      {tenantPhone && <p className="text-sm text-gray-600">{tenantPhone}</p>}
                      {currentTenant.lease_start && (
                        <p className="text-sm text-gray-500 mt-2">
                          Lease: {new Date(currentTenant.lease_start).toLocaleDateString()} - {currentTenant.lease_end ? new Date(currentTenant.lease_end).toLocaleDateString() : 'Ongoing'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {tenantId && (
                        <Link
                          href={`/owner/tenants/${tenantId}`}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Profile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!showRemoveConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                    Remove Tenant from Unit
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium mb-3">
                      Are you sure you want to remove {tenantName} from this unit? The unit status will be set to vacant.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveTenant}
                        disabled={removingTenant}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {removingTenant ? <LoadingSpinner size="sm" /> : <UserMinus className="w-4 h-4" />}
                        {removingTenant ? 'Removing...' : 'Yes, Remove Tenant'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRemoveConfirm(false)}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">This unit is currently vacant. No tenant assigned.</p>
                <Link
                  href={`/owner/tenants/new?unit_id=${unitId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign Tenant
                </Link>
              </div>
            )}
          </div>

          {/* Unit Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Details</h2>
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
                  <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> Bedrooms *</span>
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
                  <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> Bathrooms *</span>
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
                  <span className="flex items-center gap-1"><Maximize className="w-4 h-4" /> Size (m²) *</span>
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
                  <option value="vacant" className="text-gray-900">Vacant</option>
                  <option value="available" className="text-gray-900">Available</option>
                  <option value="occupied" className="text-gray-900">Occupied</option>
                  <option value="rented" className="text-gray-900">Rented</option>
                  <option value="bought" className="text-gray-900">Bought</option>
                  <option value="mortgaged" className="text-gray-900">Mortgaged</option>
                  <option value="maintenance" className="text-gray-900">Under Maintenance</option>
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
                />
              </div>
              {errors.rent_amount && <p className="mt-1 text-sm text-red-500">{errors.rent_amount}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/owner/units/${unitId}`}
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
