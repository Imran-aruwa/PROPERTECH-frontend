'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { unitsApi, propertiesApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { LoadingSpinner, TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import { Home, Plus, Edit, Trash2, Eye, Bed, Bath, Maximize, DollarSign, Filter } from 'lucide-react';
import Link from 'next/link';
import { Unit, Property } from '@/app/lib/types';

export default function OwnerUnitsPage() {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'vacant' | 'rented' | 'bought' | 'mortgaged' | 'maintenance'>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; unitId: number | null }>({
    isOpen: false,
    unitId: null
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || role !== 'owner') return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const propertiesResponse = await propertiesApi.getAll();

        if (!propertiesResponse.success) {
          console.error('Failed to load properties:', propertiesResponse.error);
          setProperties([]);
          setUnits([]);
          return;
        }

        const propertiesData = Array.isArray(propertiesResponse.data)
          ? propertiesResponse.data
          : [];
        setProperties(propertiesData);

        const allUnits: Unit[] = [];

        for (const property of propertiesData) {
          try {
            const unitsResponse = await unitsApi.list(property.id.toString());
            if (unitsResponse.success && Array.isArray(unitsResponse.data)) {
              allUnits.push(...unitsResponse.data);
            }
          } catch (err) {
            console.error(`Failed to fetch units for property ${property.id}:`, err);
          }
        }

        setUnits(allUnits);

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setUnits([]);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, role]);

  const handleDelete = async () => {
    if (!deleteModal.unitId) return;

    try {
      setDeleting(true);
      const response = await unitsApi.delete(deleteModal.unitId.toString());
      
      if (!response.success) {
        showError(response.error || 'Failed to delete unit');
        return;
      }
      
      success('Unit deleted successfully');
      setUnits(units.filter(u => u.id !== deleteModal.unitId));
      setDeleteModal({ isOpen: false, unitId: null });
    } catch (err: any) {
      showError(err.message || 'Failed to delete unit');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUnits = units.filter(unit => {
    const matchesProperty = selectedProperty ? unit.property_id === selectedProperty : true;
    const matchesStatus = statusFilter === 'all' ? true : unit.status?.toLowerCase() === statusFilter;
    return matchesProperty && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    vacant: 'bg-yellow-100 text-yellow-800',
    occupied: 'bg-blue-100 text-blue-800',
    rented: 'bg-green-100 text-green-800',
    bought: 'bg-indigo-100 text-indigo-800',
    mortgaged: 'bg-purple-100 text-purple-800',
    maintenance: 'bg-orange-100 text-orange-800'
  };

  const getPropertyName = (propertyId: number) => {
    return properties.find(p => p.id === propertyId)?.name || 'Unknown Property';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={7} />
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
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Units</h1>
                <p className="text-gray-600 mt-1">Manage all your property units</p>
              </div>
            </div>
            <Link
              href="/owner/units/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Unit
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Units</h3>
              <Home className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{units.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Vacant</h3>
              <Home className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {units.filter(u => u.status?.toLowerCase() === 'vacant').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Rented</h3>
              <Home className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {units.filter(u => u.status?.toLowerCase() === 'rented').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Bought</h3>
              <Home className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {units.filter(u => u.status?.toLowerCase() === 'bought').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Avg. Rent</h3>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">
              KSh {units.length > 0 ? Math.round(units.reduce((sum, u) => sum + ((u as any).monthly_rent || u.rent_amount || 0), 0) / units.length).toLocaleString() : 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <label htmlFor="property-filter" className="sr-only">Filter by property</label>
            <select
              id="property-filter"
              value={selectedProperty || ''}
              onChange={(e) => setSelectedProperty(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'vacant', 'rented', 'bought', 'mortgaged', 'maintenance'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-2">({units.filter(u => u.status?.toLowerCase() === status).length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Units Grid */}
        {filteredUnits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No units found</h3>
            <p className="text-gray-600 mb-6">
              {units.length === 0 
                ? properties.length === 0
                  ? 'Please add properties first before creating units'
                  : 'Get started by adding your first unit'
                : 'No units match the selected filters'}
            </p>
            {units.length === 0 && properties.length > 0 && (
              <Link
                href="/owner/units/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Your First Unit
              </Link>
            )}
            {properties.length === 0 && (
              <Link
                href="/owner/properties/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Property First
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Unit Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{unit.unit_number}</h3>
                      <p className="text-blue-100 text-sm">{getPropertyName(unit.property_id)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[unit.status]}`}>
                      {unit.status}
                    </span>
                  </div>
                </div>

                {/* Unit Details */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Bed className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{unit.bedrooms}</p>
                      <p className="text-xs text-gray-600">Bedrooms</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Bath className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{unit.bathrooms}</p>
                      <p className="text-xs text-gray-600">Bathrooms</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Maximize className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{unit.size_sqm}</p>
                      <p className="text-xs text-gray-600">m²</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Floor</span>
                      <span className="font-medium text-gray-900">Floor {unit.floor}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600">Monthly Rent</span>
                      <span className="font-bold text-lg text-gray-900">
                        KSh {((unit as any).monthly_rent || unit.rent_amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {unit.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {unit.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/owner/units/${unit.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      href={`/owner/units/${unit.id}/edit`}
                      className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, unitId: unit.id })}
                      className="flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, unitId: null })}
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