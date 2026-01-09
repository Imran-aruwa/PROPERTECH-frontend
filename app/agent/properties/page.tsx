'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Building2, ShoppingBag } from 'lucide-react';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { agentApi } from '@/app/lib/api-services';

interface Property {
  id: number;
  name: string;
  location: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  collectionRate: number;
  outstanding: number;
  status: 'active' | 'inactive';
}

export default function AgentPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await agentApi.getProperties();

        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : response.data.properties || [];
          setProperties(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            location: p.location || p.address || '',
            totalUnits: p.total_units || p.totalUnits || 0,
            occupiedUnits: p.occupied_units || p.occupiedUnits || 0,
            monthlyRevenue: p.monthly_revenue || p.monthlyRevenue || 0,
            collectionRate: p.collection_rate || p.collectionRate || 0,
            outstanding: p.outstanding || 0,
            status: p.status || 'active',
          })));
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
      <DashboardLayout role="agent">
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
    <DashboardLayout role="agent">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Properties</h1>
            <p className="text-gray-600 mt-1">View and manage all properties in the system</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link
              href="/agent/marketplace"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Marketplace</span>
            </Link>
            <Link
              href="/agent/properties/new"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Property</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No properties in the system yet</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href="/agent/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Property
              </Link>
              <Link
                href="/agent/marketplace"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse Marketplace
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                name={property.name}
                location={property.location}
                totalUnits={property.totalUnits}
                occupiedUnits={property.occupiedUnits}
                monthlyRevenue={property.monthlyRevenue}
                collectionRate={property.collectionRate}
                outstanding={property.outstanding}
                status={property.status}
                basePath="/agent/properties"
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
