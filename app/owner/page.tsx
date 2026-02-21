'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { propertiesApi, analyticsApi } from '@/lib/api-services';
import { LoadingSpinner, CardSkeleton } from '@/components/ui/LoadingSpinner';
import { Building2, Home, Users, DollarSign, Wrench, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  total_properties: number;
  total_units: number;
  total_tenants: number;
  occupied_units?: number; // legacy alias
  occupancy_rate: number;
  vacancy_rate?: number; // legacy alias
  monthly_revenue: number;
  pending_payments: number;
  maintenance_requests: number;
}

export default function OwnerDashboard() {
  const { user, isLoading: authLoading, isAuthenticated, token, role } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [propertiesData, analyticsData] = await Promise.all([
        propertiesApi.getAll(),
        analyticsApi.getDashboardStats('owner')
      ]);

      // Handle properties response - ensure it's always an array
      if (propertiesData.success) {
        // Unwrap potential nested data structures
        let rawProps = propertiesData.data;
        if (rawProps && !Array.isArray(rawProps) && rawProps.data) {
          rawProps = rawProps.data;
        }
        if (rawProps && !Array.isArray(rawProps) && rawProps.results) {
          rawProps = rawProps.results;
        }
        const propsArray = Array.isArray(rawProps) ? rawProps : [];
        setProperties(propsArray);
      } else {
        console.error('Properties error:', propertiesData.error);
        setProperties([]);
      }

      // Handle analytics response
      if (analyticsData.success) {
        // Unwrap potential nested data: analyticsData.data might be { success, data: actualStats }
        let statsData = analyticsData.data;
        if (statsData && statsData.data && typeof statsData.data === 'object') {
          statsData = statsData.data;
        }
        setStats(statsData);
      } else {
        console.error('Analytics error:', analyticsData.error);
        // Set default stats if API fails
        setStats({
          total_properties: 0,
          total_units: 0,
          occupied_units: 0,
          vacancy_rate: 0,
          monthly_revenue: 0,
          pending_payments: 0,
          maintenance_requests: 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (role && role !== 'owner') { router.push('/unauthorized'); return; }
    if (!token) return;
    fetchDashboardData();
  }, [authLoading, isAuthenticated, role, router, token, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Properties',
      value: stats?.total_properties || 0,
      icon: Building2,
      color: 'bg-blue-500',
      link: '/owner/properties'
    },
    {
      title: 'Total Units',
      value: stats?.total_units || 0,
      icon: Home,
      color: 'bg-green-500',
      link: '/owner/units'
    },
    {
      title: 'Active Tenants',
      value: stats?.total_tenants ?? stats?.occupied_units ?? 0,
      icon: Users,
      color: 'bg-purple-500',
      link: '/owner/tenants'
    },
    {
      title: 'Monthly Revenue',
      value: `KSh ${(stats?.monthly_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      link: '/owner/payments'
    },
    {
      title: 'Pending Payments',
      value: stats?.pending_payments || 0,
      icon: AlertCircle,
      color: 'bg-orange-500',
      link: '/owner/payments?status=pending'
    },
    {
      title: 'Maintenance Requests',
      value: stats?.maintenance_requests || 0,
      icon: Wrench,
      color: 'bg-red-500',
      link: '/owner/maintenance'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name || 'Owner'}!
              </h1>
              <p className="text-gray-600 mt-1">Here&apos;s what&apos;s happening with your properties today</p>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              href={stat.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* Properties List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Properties</h2>
            <Link
              href="/owner/properties"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {!Array.isArray(properties) || properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first property</p>
              <Link
                href="/owner/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Property
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.slice(0, 6).filter(p => p && p.id).map((property) => (
                <Link
                  key={property.id}
                  href={`/owner/properties/${property.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{property.name || 'Unnamed Property'}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{property.address || 'No address'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {property.occupied_units || 0}/{property.total_units || 0} Occupied
                    </span>
                    <span className="text-blue-600 font-medium">
                      {property.total_units ? Math.round((property.occupied_units || 0) / property.total_units * 100) : 0}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/owner/tenants"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Tenants</h3>
            <p className="text-sm text-gray-600">View and manage all your tenants</p>
          </Link>

          <Link
            href="/owner/payments"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <DollarSign className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Track Payments</h3>
            <p className="text-sm text-gray-600">Monitor rent and utility payments</p>
          </Link>

          <Link
            href="/owner/maintenance"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Wrench className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Maintenance</h3>
            <p className="text-sm text-gray-600">Handle maintenance requests</p>
          </Link>
        </div>
      </div>
    </div>
  );
}