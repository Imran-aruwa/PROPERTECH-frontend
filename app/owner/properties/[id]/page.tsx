'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { propertiesApi, unitsApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import {
  Building2, ArrowLeft, Edit, Trash2, Home, MapPin, Users,
  DollarSign, Plus, Bed, Bath, Eye
} from 'lucide-react';
import Link from 'next/link';
import { Property, Unit } from '@/app/lib/types';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, token, role } = useAuth();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const propertyId = params.id as string;

  // Fetch property data only once when authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (role && role !== 'owner') { router.push('/unauthorized'); return; }
    if (!token) return;
    if (!propertyId) return;

    let isMounted = true;
    let hasFetched = false;

    const fetchData = async () => {
      // Prevent duplicate fetches
      if (hasFetched) return;
      hasFetched = true;

      try {
        setLoading(true);
        const [propertyResponse, unitsResponse] = await Promise.all([
          propertiesApi.get(propertyId),
          unitsApi.list(propertyId)
        ]);

        if (!isMounted) return;

        if (propertyResponse.success && propertyResponse.data) {
          setProperty(propertyResponse.data);
        } else {
          console.error('[PropertyDetail] Property not found');
          setProperty(null);
        }

        if (unitsResponse.success) {
          const unitsData = Array.isArray(unitsResponse.data)
            ? unitsResponse.data
            : unitsResponse.data?.units || [];
          setUnits(unitsData);
        }
      } catch (err: any) {
        console.error('Failed to load property:', err);
        if (isMounted) {
          setProperty(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated, propertyId, token, role, router]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await propertiesApi.delete(propertyId);

      if (!response.success) {
        showError(response.error || 'Failed to delete property');
        return;
      }

      success('Property deleted successfully');
      router.push('/owner/properties');
    } catch (err: any) {
      showError(err.message || 'Failed to delete property');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    const safeAmount = amount || 0;
    return `KES ${safeAmount.toLocaleString()}`;
  };

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    vacant: 'bg-green-100 text-green-800',
    occupied: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800'
  };

  // Calculate stats - handle both rent_amount and monthly_rent field names
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'occupied' || u.status === 'rented').length;
  const availableUnits = units.filter(u => u.status === 'available' || u.status === 'vacant').length;
  const totalRent = units.reduce((sum, u) => sum + ((u as any).monthly_rent || (u as any).rent_amount || 0), 0);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading property details..." />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <Link
            href="/owner/properties"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/owner/properties"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{property.address}, {property.city}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/owner/properties/${propertyId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Units</h3>
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalUnits}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Occupancy Rate</h3>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{occupancyRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Available</h3>
              <Home className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{availableUnits}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Rent Potential</h3>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRent)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{property.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-medium text-gray-900">{property.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">State/County</p>
                  <p className="font-medium text-gray-900">{property.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Postal Code</p>
                  <p className="font-medium text-gray-900">{property.postal_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="font-medium text-gray-900">{property.country}</p>
                </div>
              </div>
              {property.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-700">{property.description}</p>
                </div>
              )}
            </div>

            {/* Units List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Units ({units.length})</h2>
                <Link
                  href="/owner/units/new"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Unit
                </Link>
              </div>

              {units.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Units Yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding units to this property</p>
                  <Link
                    href="/owner/units/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Unit
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{unit.unit_number}</h3>
                          {(unit as any).floor && <p className="text-sm text-gray-600">Floor {(unit as any).floor}</p>}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[unit.status] || 'bg-gray-100 text-gray-800'}`}>
                          {unit.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Bed className="w-4 h-4" /> {unit.bedrooms || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4" /> {unit.bathrooms || 0}
                        </span>
                        {((unit as any).square_feet || (unit as any).size_sqm) && (
                          <span>{(unit as any).square_feet || (unit as any).size_sqm} {(unit as any).square_feet ? 'sq ft' : 'm²'}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{formatCurrency((unit as any).monthly_rent || (unit as any).rent_amount)}/mo</span>
                        <Link
                          href={`/owner/units/${unit.id}`}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Image */}
            {property.image_url && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <img
                  src={property.image_url}
                  alt={property.name}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Breakdown</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Occupied Units</span>
                  <span className="font-bold text-blue-600">{occupiedUnits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Available Units</span>
                  <span className="font-bold text-green-600">{availableUnits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Under Maintenance</span>
                  <span className="font-bold text-orange-600">
                    {units.filter(u => u.status === 'maintenance').length}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg. Rent</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(totalUnits > 0 ? Math.round(totalRent / totalUnits) : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/owner/units/new"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Unit
                </Link>
                <Link
                  href="/owner/tenants/new"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Add Tenant
                </Link>
                <Link
                  href={`/owner/properties/${propertyId}/edit`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Property
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Property"
        message={`Are you sure you want to delete "${property.name}"? This will also delete all ${totalUnits} units associated with this property. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
