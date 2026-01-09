import { Building2, Users, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PropertyCardProps {
  id: number | string;
  name: string;
  location: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  collectionRate: number;
  outstanding: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
  basePath?: string; // Base path for links (e.g., '/owner/properties', '/agent/properties')
}

export function PropertyCard({
  id,
  name,
  location,
  totalUnits,
  occupiedUnits,
  monthlyRevenue,
  collectionRate,
  outstanding,
  status,
  imageUrl,
  onClick,
  className = '',
  basePath = '/owner/properties',
}: PropertyCardProps) {
  // Normalize status to be type-safe (no behavior change)
  const normalizedStatus: 'active' | 'inactive' =
    status.toLowerCase() === 'active' ? 'active' : 'inactive';

  const occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      {/* Property Image */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-blue-600">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              normalizedStatus === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {normalizedStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-600 mb-4">{location}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Occupancy</p>
              <p className="text-lg font-bold text-gray-900">{occupancyRate}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600">Units</p>
              <p className="text-lg font-bold text-gray-900">
                {occupiedUnits}/{totalUnits}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Monthly Revenue</span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(monthlyRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Collection Rate</span>
            <span
              className={`text-sm font-bold ${
                collectionRate >= 95
                  ? 'text-green-600'
                  : collectionRate >= 85
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {collectionRate}%
            </span>
          </div>

          {outstanding > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Outstanding
              </span>
              <span className="text-sm font-bold text-red-600">
                {formatCurrency(outstanding)}
              </span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <Link
          href={`${basePath}/${id}`}
          className="block w-full mt-4 text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
