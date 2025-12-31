'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Building2, MapPin, Users, Loader2 } from 'lucide-react';
import { apiClient } from '@/app/lib/api-services';

interface Property {
  id: string;
  name: string;
  location: string;
  units: number;
  occupied: number;
  status: string;
}

export default function CaretakerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/caretaker/properties/');

        if (response.success && response.data) {
          const items = response.data.properties || response.data || [];
          setProperties(Array.isArray(items) ? items.map((p: any) => ({
            id: p.id?.toString() || '',
            name: p.name || '',
            location: p.location || '',
            units: p.units || p.total_units || 0,
            occupied: p.occupied || p.occupied_units || 0,
            status: p.status || 'active',
          })) : []);
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        setError('Failed to load properties');
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout role="caretaker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading properties...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-600 mt-1">Properties under your care</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No properties assigned</p>
            <p className="text-gray-400 text-sm mt-1">Properties will appear here once assigned to you</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {property.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{property.name}</h3>
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  {property.location}
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Users className="w-4 h-4" />
                    {property.occupied} / {property.units} units
                  </div>
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">
                      {property.units > 0 ? Math.round((property.occupied / property.units) * 100) : 0}%
                    </span>
                    <span className="text-gray-500"> occupied</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
