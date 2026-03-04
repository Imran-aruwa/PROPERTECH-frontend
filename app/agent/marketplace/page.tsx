'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Home,
  DollarSign,
  Search,
  Filter,
  ArrowLeft,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  Phone,
  Calendar
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { agentApi } from '@/app/lib/api-services';

interface MarketplaceUnit {
  id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  square_feet: number | null;
  monthly_rent: number | null;
  has_master_bedroom: boolean;
  has_servant_quarters: boolean;
  description: string | null;
}

interface MarketplaceProperty {
  id: string;
  name: string;
  address: string;
  city: string | null;
  description: string | null;
  image_url: string | null;
  vacant_units: number;
  min_rent: number | null;
  max_rent: number | null;
  unit_types: string[];
  units: MarketplaceUnit[];
}

export default function AgentMarketplacePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<MarketplaceProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  const [totalVacantUnits, setTotalVacantUnits] = useState(0);

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await agentApi.getMarketplace();

        if (response.success && response.data) {
          const data = response.data;
          setProperties(data.properties || []);
          setTotalVacantUnits(data.total_vacant_units || 0);
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error('Failed to fetch marketplace:', err);
        setError('Failed to load marketplace properties');
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketplace();
  }, []);

  const filteredProperties = properties.filter(property => {
    const search = searchTerm.toLowerCase();
    return (
      property.name.toLowerCase().includes(search) ||
      property.address.toLowerCase().includes(search) ||
      (property.city && property.city.toLowerCase().includes(search))
    );
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return `KSh ${amount.toLocaleString()}`;
  };

  const toggleExpand = (propertyId: string) => {
    setExpandedProperty(expandedProperty === propertyId ? null : propertyId);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-tx-secondary">Loading marketplace...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/agent/properties"
              className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-tx-secondary" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-tx-primary">Property Marketplace</h1>
              <p className="text-tx-secondary mt-1">Browse available units for prospective tenants</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tx-secondary">Total Properties</p>
                <p className="text-2xl font-bold text-tx-primary">{properties.length}</p>
              </div>
              <Building2 className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tx-secondary">Vacant Units</p>
                <p className="text-2xl font-bold text-green-600">{totalVacantUnits}</p>
              </div>
              <Home className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tx-secondary">Ready to Show</p>
                <p className="text-2xl font-bold text-purple-600">{totalVacantUnits}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tx-muted" />
            <input
              type="text"
              placeholder="Search properties by name, address, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-bd-strong rounded-lg text-tx-primary bg-bg-card focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Properties List */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-lg border">
            <Building2 className="w-12 h-12 text-tx-muted mx-auto mb-4" />
            <p className="text-tx-muted mb-2">No available properties found</p>
            <p className="text-sm text-tx-muted">All units are currently occupied</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className="bg-bg-card rounded-lg shadow-sm border border-bd overflow-hidden"
              >
                {/* Property Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => toggleExpand(property.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-tx-primary text-lg">{property.name}</h3>
                          <div className="flex items-center gap-1 text-tx-secondary text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{property.address}{property.city && `, ${property.city}`}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <Home className="w-4 h-4" />
                          {property.vacant_units} Vacant Unit{property.vacant_units !== 1 ? 's' : ''}
                        </span>
                        {property.min_rent && (
                          <span className="text-sm text-tx-secondary">
                            <DollarSign className="w-4 h-4 inline" />
                            {formatCurrency(property.min_rent)}
                            {property.max_rent && property.max_rent !== property.min_rent && (
                              <> - {formatCurrency(property.max_rent)}</>
                            )}
                            /month
                          </span>
                        )}
                        {property.unit_types.length > 0 && (
                          <span className="text-sm text-tx-muted">
                            {property.unit_types.join(' • ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedProperty === property.id ? (
                        <ChevronUp className="w-5 h-5 text-tx-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-tx-muted" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Units */}
                {expandedProperty === property.id && (
                  <div className="border-t border-bd bg-bg-secondary p-4">
                    <h4 className="font-medium text-tx-primary mb-3">Available Units</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.units.map((unit) => (
                        <div
                          key={unit.id}
                          className="bg-bg-card rounded-lg border border-bd p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-tx-primary">{unit.unit_number}</h5>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Available
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1 text-tx-secondary">
                                <Bed className="w-4 h-4" />
                                {unit.bedrooms} Bed
                              </span>
                              <span className="flex items-center gap-1 text-tx-secondary">
                                <Bath className="w-4 h-4" />
                                {unit.bathrooms} Bath
                              </span>
                              {unit.toilets > 0 && (
                                <span className="text-tx-secondary">
                                  {unit.toilets} Toilet{unit.toilets !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            {unit.square_feet && (
                              <p className="text-tx-secondary">{unit.square_feet} sq ft</p>
                            )}

                            {(unit.has_master_bedroom || unit.has_servant_quarters) && (
                              <div className="flex flex-wrap gap-2">
                                {unit.has_master_bedroom && (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                    Master En-suite
                                  </span>
                                )}
                                {unit.has_servant_quarters && (
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                    Servant Quarters
                                  </span>
                                )}
                              </div>
                            )}

                            {unit.description && (
                              <p className="text-tx-muted text-xs line-clamp-2">{unit.description}</p>
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-bd">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-lg text-tx-primary">
                                {formatCurrency(unit.monthly_rent)}
                              </span>
                              <span className="text-tx-muted text-sm">/month</span>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/agent/viewings?unit=${unit.id}&property=${property.id}`);
                              }}
                            >
                              <Calendar className="w-4 h-4" />
                              Schedule Viewing
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
