'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Building2, DollarSign, Users, Wrench, CreditCard, RefreshCw } from 'lucide-react';

interface DashboardStats {
  total_properties: number;
  total_units: number;
  total_tenants: number;
  occupancy_rate: number;
  monthly_revenue: number;
  pending_payments: number;
  maintenance_requests: number;
  recent_activities: Array<{ type: string; description: string; timestamp: string; }>;
}

export default function OwnerDashboard() {
  const { isAuthenticated, role, isLoading: authLoading, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = useCallback(async (showRefresh = false) => {
    // Get token from context or fallback to localStorage
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

    if (!authToken) {
      console.log("[Dashboard] No auth token available yet, skipping fetch");
      return;
    }

    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      console.log("[Dashboard] Fetching dashboard stats...");

      const response = await fetch("/api/owner/dashboard", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch dashboard data");
      }

      console.log("[Dashboard] Stats fetched successfully");
      setStats(data.data);
      setError(null);
    } catch (err: any) {
      console.error("[Dashboard] Error:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;

    // Check localStorage directly as fallback for auth check
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const hasAuth = isAuthenticated || storedToken;

    if (!hasAuth) {
      router.push("/login");
      return;
    }

    if (role && role !== "owner") {
      router.push("/unauthorized");
      return;
    }

    // Fetch stats - the function will get token from context or localStorage
    fetchDashboardStats();
  }, [authLoading, isAuthenticated, role, router, token, fetchDashboardStats]);

  useEffect(() => {
    const handleFocus = () => { if (isAuthenticated && token) fetchDashboardStats(true); };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isAuthenticated, token, fetchDashboardStats]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return "KES " + (amount / 1000000).toFixed(1) + "M";
    if (amount >= 1000) return "KES " + (amount / 1000).toFixed(0) + "K";
    return "KES " + amount.toLocaleString();
  };

  const getStatsArray = () => {
    if (!stats) return [];
    return [
      { title: "Total Properties", label: "Properties", value: stats.total_properties.toString(), change: stats.total_units + " units", icon: Building2, trend: "neutral" as const },
      { title: "Monthly Revenue", label: "Revenue", value: formatCurrency(stats.monthly_revenue), change: stats.pending_payments > 0 ? formatCurrency(stats.pending_payments) + " pending" : "All collected", icon: DollarSign, trend: "up" as const },
      { title: "Total Tenants", label: "Tenants", value: stats.total_tenants.toString(), change: stats.occupancy_rate.toFixed(0) + "% occupancy", icon: Users, trend: stats.occupancy_rate >= 80 ? "up" as const : "neutral" as const },
      { title: "Maintenance", label: "Requests", value: stats.maintenance_requests.toString(), change: "Pending requests", icon: Wrench, trend: stats.maintenance_requests > 5 ? "down" as const : "neutral" as const },
    ];
  };

  const getRevenueData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const baseRevenue = stats?.monthly_revenue || 0;
    return months.map((month, index) => ({ month, revenue: Math.round(baseRevenue * (0.8 + (index * 0.04))) }));
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout role="owner">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="owner">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md">
              <h3 className="font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-sm">{error}</p>
              <button onClick={() => fetchDashboardStats()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your property portfolio</p>
          </div>
          <button onClick={() => fetchDashboardStats(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={"w-4 h-4 " + (refreshing ? "animate-spin" : "")} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {getStatsArray().map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartWrapper title="Revenue Trend" data={getRevenueData()} dataKey="revenue" xAxisKey="month" type="line" />
          <ChartWrapper title="Property Performance" data={getRevenueData()} dataKey="revenue" xAxisKey="month" type="bar" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a href="/owner/properties/new" className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Building2 className="w-6 h-6 text-blue-600" /><span className="font-medium text-blue-900">Add New Property</span>
          </a>
          <a href="/owner/tenants" className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Users className="w-6 h-6 text-green-600" /><span className="font-medium text-green-900">Manage Tenants</span>
          </a>
          <a href="/owner/subscription" className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <CreditCard className="w-6 h-6 text-purple-600" /><span className="font-medium text-purple-900">Subscription</span>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
