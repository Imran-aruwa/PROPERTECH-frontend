'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Building2, DollarSign, Users, TrendingUp, Loader2 } from 'lucide-react';
import { agentApi } from '@/app/lib/api-services';

interface DashboardStats {
  propertiesManaged: number;
  totalEarnings: number;
  activeTenants: number;
  collectionRate: number;
}

interface Activity {
  id: string;
  description: string;
  amount: number;
  timestamp: string;
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both dashboard stats and properties in parallel
        const [dashboardResponse, propertiesResponse] = await Promise.all([
          agentApi.getDashboard().catch(() => ({ success: false, data: null })),
          agentApi.getProperties().catch(() => ({ success: false, data: null })),
        ]);

        // Extract dashboard data if available
        const dashData = dashboardResponse.success ? dashboardResponse.data : null;

        // Extract properties data to compute stats as fallback
        let propertiesList: any[] = [];
        if (propertiesResponse.success && propertiesResponse.data) {
          const raw = propertiesResponse.data;
          propertiesList = Array.isArray(raw) ? raw : (raw.properties || raw.results || []);
        }

        // Compute stats from properties if dashboard endpoint didn't provide them
        const totalUnits = propertiesList.reduce((sum: number, p: any) => sum + (p.total_units || p.totalUnits || 0), 0);
        const occupiedUnits = propertiesList.reduce((sum: number, p: any) => sum + (p.occupied_units || p.occupiedUnits || 0), 0);

        setStats({
          propertiesManaged: dashData?.properties_managed || dashData?.propertiesManaged || propertiesList.length || 0,
          totalEarnings: dashData?.total_earnings || dashData?.totalEarnings || 0,
          activeTenants: dashData?.active_tenants || dashData?.activeTenants || occupiedUnits || 0,
          collectionRate: dashData?.collection_rate || dashData?.collectionRate || 0,
        });
        setActivities(dashData?.recent_activities || dashData?.recentActivities || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        setStats({
          propertiesManaged: 0,
          totalEarnings: 0,
          activeTenants: 0,
          collectionRate: 0,
        });
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `KES ${(amount / 1000).toFixed(0)}K`;
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const statsCards = stats ? [
    {
      title: 'Properties Managed',
      label: 'Total properties',
      value: stats.propertiesManaged.toString(),
      icon: Building2,
      trend: "up" as const,
    },
    {
      title: 'Performance Earnings',
      label: 'Commission Earned',
      value: formatCurrency(stats.totalEarnings),
      icon: DollarSign,
      trend: "up" as const,
    },
    {
      title: 'Active Tenants',
      label: 'Current tenants',
      value: stats.activeTenants.toString(),
      icon: Users,
      trend: "up" as const,
    },
    {
      title: 'Rent Collection',
      label: 'Collection Rate',
      value: `${stats.collectionRate}%`,
      icon: TrendingUp,
      trend: "up" as const,
    },
  ] : [];

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your performance and commissions</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="font-medium text-gray-900 truncate">{activity.description}</p>
                    <p className="text-sm text-gray-600">{activity.timestamp}</p>
                  </div>
                  <span className="text-green-600 font-semibold whitespace-nowrap">
                    +{formatCurrency(activity.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
