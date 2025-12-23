'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { propertiesApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { LoadingSpinner, TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import { Building2, Plus, Edit, Trash2, Eye, MapPin, Home } from 'lucide-react';
import Link from 'next/link';
import { Property } from '@/app/lib/types';

export default function PropertiesPage() {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; propertyId: number | null }>({
    isOpen: false,
    propertyId: null
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Wait for auth to load first
    if (authLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect if not owner
    if (role && role !== 'owner') {
      router.push('/unauthorized');
      return;
    }

    // Fetch properties
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await propertiesApi.getAll();

        if (!response.success) {
          const errorMsg = response.error || '';
          if (errorMsg.includes('Unauthorized') || errorMsg.includes('401') || errorMsg.includes('token') || errorMsg.includes('credentials')) {
            console.error('Authentication error - redirecting to login');
            setProperties([]);
            router.push('/login');
            return;
          }
          console.error('Properties error:', errorMsg);
          setProperties([]);
          return;
        }

        const propsArray = Array.isArray(response.data) ? response.data : [];
        setProperties(propsArray);
      } catch (err: any) {
        console.error('Error fetching properties:', err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [authLoading, isAuthenticated, role, router]);

  const handleDelete = async () => {
    if (!deleteModal.propertyId) return;

    try {
      setDeleting(true);
      const response = await propertiesApi.delete(deleteModal.propertyId.toString());
      
      if (!response.success) {
        showError(response.error || 'Failed to delete property');
        return;
      }
      
      success('Property deleted successfully');
      setProperties(properties.filter(p => p.id !== deleteModal.propertyId));
      setDeleteModal({ isOpen: false, propertyId: null });
    } catch (err: any) {
      showError(err.message || 'Failed to delete property');
    } finally {
      setDeleting(false);
    }
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <TableSkeleton rows={5} cols={5} />
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
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
                <p className="text-gray-600 mt-1">Manage all your properties</p>
              </div>
            </div>
            <Link
              href="/owner/properties/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!Array.isArray(properties) || properties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first property</p>
            <Link
              href="/owner/properties/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Your First Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Property Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-16 h-16 text-white opacity-50" />
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{property.name}</h3>
                  
                  <div className="flex items-start gap-2 text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm">{property.address}, {property.city}</p>
                  </div>

                  {property.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-600">Total Units</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {property.total_units || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Home className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">Occupied</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {property.occupied_units || 0}
                      </p>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Occupancy Rate</span>
                      <span className="font-medium text-gray-900">
                        {property.total_units 
                          ? Math.round((property.occupied_units || 0) / property.total_units * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${property.total_units 
                            ? (property.occupied_units || 0) / property.total_units * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/owner/properties/${property.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      href={`/owner/properties/${property.id}/edit`}
                      className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, propertyId: property.id })}
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
        onClose={() => setDeleteModal({ isOpen: false, propertyId: null })}
        onConfirm={handleDelete}
        title="Delete Property"
        message="Are you sure you want to delete this property? This action cannot be undone and will remove all associated units, tenants, and data."
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}