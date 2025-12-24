'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { unitsApi, propertiesApi, maintenanceApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import {
  Home, ArrowLeft, Edit, Trash2, Bed, Bath, Maximize, Building2,
  DollarSign, User, Calendar, Wrench, CheckCircle, Clock
} from 'lucide-react';
import Link from 'next/link';
import { Unit, Property, MaintenanceRequest } from '@/app/lib/types';

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const unitId = params.id as string;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !unitId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // First get all properties to find unit
        const propertiesResponse = await propertiesApi.getAll();
        const propertiesData = Array.isArray(propertiesResponse.data) ? propertiesResponse.data : [];

        // Search for the unit across all properties
        let foundUnit: Unit | null = null;
        let foundProperty: Property | null = null;

        for (const prop of propertiesData) {
          const unitsResponse = await unitsApi.list(prop.id.toString());
          if (unitsResponse.success && Array.isArray(unitsResponse.data)) {
            const matchingUnit = unitsResponse.data.find((u: Unit) => u.id === parseInt(unitId));
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

        // Fetch maintenance requests for this unit
        try {
          const maintenanceResponse = await maintenanceApi.getAll();
          if (maintenanceResponse.success && Array.isArray(maintenanceResponse.data)) {
            const unitMaintenance = maintenanceResponse.data.filter(
              (m: MaintenanceRequest) => m.unit_id === parseInt(unitId)
            );
            setMaintenanceRequests(unitMaintenance);
          }
        } catch (err) {
          console.error('Failed to fetch maintenance requests:', err);
        }
      } catch (err: any) {
        console.error('Failed to load unit:', err);
        showError('Failed to load unit details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, unitId, router]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await unitsApi.delete(unitId);

      if (!response.success) {
        showError(response.error || 'Failed to delete unit');
        return;
      }

      success('Unit deleted successfully');
      router.push('/owner/units');
    } catch (err: any) {
      showError(err.message || 'Failed to delete unit');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800'
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading unit details..." />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unit Not Found</h2>
          <p className="text-gray-600 mb-4">The unit you're looking for doesn't exist.</p>
          <Link
            href="/owner/units"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Units
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
                href="/owner/units"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Unit {unit.unit_number}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[unit.status]}`}>
                    {unit.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{property?.name || 'Unknown Property'}</span>
                  <span className="mx-2">•</span>
                  <span>Floor {unit.floor}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/owner/units/${unitId}/edit`}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unit Specifications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bed className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{unit.bedrooms}</p>
                  <p className="text-sm text-gray-600">Bedrooms</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bath className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{unit.bathrooms}</p>
                  <p className="text-sm text-gray-600">Bathrooms</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Maximize className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{unit.size_sqm}</p>
                  <p className="text-sm text-gray-600">Sq. Meters</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{(unit.rent_amount / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-gray-600">KES/Month</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {unit.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{unit.description}</p>
              </div>
            )}

            {/* Maintenance History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                Maintenance Requests
              </h2>
              {maintenanceRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No maintenance requests for this unit</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {request.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{request.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(request.reported_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[request.priority]}`}>
                          {request.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Monthly Rent</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(unit.rent_amount)}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {formatCurrency(unit.rent_amount / unit.size_sqm)}/m² per month
                  </p>
                </div>
              </div>
            </div>

            {/* Current Tenant */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Current Tenant
              </h2>
              {unit.status === 'occupied' && unit.tenant ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {(unit.tenant as any).user?.full_name?.charAt(0) || 'T'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{(unit.tenant as any).user?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{(unit.tenant as any).user?.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <Link
                    href={`/owner/tenants/${unit.tenant.id}`}
                    className="block w-full text-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    View Tenant Details
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600 mb-4">No tenant assigned</p>
                  <Link
                    href="/owner/tenants/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Assign Tenant
                  </Link>
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Property
              </h2>
              {property && (
                <div className="space-y-3">
                  <p className="font-medium text-gray-900">{property.name}</p>
                  <p className="text-sm text-gray-600">{property.address}</p>
                  <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
                  <Link
                    href={`/owner/properties/${property.id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors mt-4"
                  >
                    View Property
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/owner/maintenance?unit=${unitId}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Create Maintenance Request
                </Link>
                <Link
                  href={`/owner/units/${unitId}/edit`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Unit Details
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
        title="Delete Unit"
        message="Are you sure you want to delete this unit? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
