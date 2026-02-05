'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Building2, DollarSign, Users, Wrench, CreditCard, RefreshCw, ShieldAlert, Eye } from 'lucide-react';
import { tenantsApi, paymentsApi, maintenanceApi } from '@/lib/api-services';
import { Tenant, Payment, MaintenanceRequest } from '@/app/lib/types';
import { calculateAllTenantRiskScores, TenantRiskScore, RISK_LEVEL_CONFIG, getRiskBgClass } from '@/app/lib/risk-score';
import Link from 'next/link';

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
  const [riskTenants, setRiskTenants] = useState<TenantRiskScore[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);

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
        // Dashboard endpoint failed - try to build stats from properties endpoint
        console.log("[Dashboard] Dashboard endpoint failed, trying properties fallback...");

        const propertiesResponse = await fetch("/api/properties", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          cache: "no-store",
        });
        const propertiesData = await propertiesResponse.json();

        if (propertiesResponse.ok && propertiesData.success) {
          // Unwrap potential nested data structures
          let rawProps = propertiesData.data;
          if (rawProps && !Array.isArray(rawProps) && rawProps.data) {
            rawProps = rawProps.data;
          }
          if (rawProps && !Array.isArray(rawProps) && rawProps.results) {
            rawProps = rawProps.results;
          }
          const properties = Array.isArray(rawProps) ? rawProps : [];
          console.log("[Dashboard] Properties fallback successful, found", properties.length, "properties");

          // Calculate stats from properties data
          let totalUnits = 0;
          let totalTenants = 0;
          let monthlyRevenue = 0;

          properties.forEach((prop: any) => {
            totalUnits += prop.total_units || prop.units?.length || 0;
            totalTenants += prop.occupied_units || 0;
            // Estimate monthly revenue if available
            if (prop.units && Array.isArray(prop.units)) {
              prop.units.forEach((unit: any) => {
                if (unit.status === 'occupied' && unit.monthly_rent) {
                  monthlyRevenue += unit.monthly_rent;
                }
              });
            }
          });

          const occupancyRate = totalUnits > 0 ? (totalTenants / totalUnits) * 100 : 0;

          setStats({
            total_properties: properties.length,
            total_units: totalUnits,
            total_tenants: totalTenants,
            occupancy_rate: occupancyRate,
            monthly_revenue: monthlyRevenue,
            pending_payments: 0,
            maintenance_requests: 0,
            recent_activities: []
          });
          setError(null);
          return;
        }

        throw new Error(data.error || "Failed to fetch dashboard data");
      }

      console.log("[Dashboard] Stats fetched successfully, raw data:", JSON.stringify(data).substring(0, 200));
      // Unwrap potential nested data: data.data might still be wrapped as { success, data: actualStats }
      let statsData = data.data;
      if (statsData && statsData.data && typeof statsData.data === 'object' && !Array.isArray(statsData.data)) {
        statsData = statsData.data;
      }
      setStats(statsData);
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

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchRiskData = async () => {
      try {
        const [tenantsRes, paymentsRes, maintenanceRes] = await Promise.all([
          tenantsApi.getAll(),
          paymentsApi.getAll(),
          maintenanceApi.getAll(),
        ]);

        const tenants: Tenant[] = Array.isArray(tenantsRes.data) ? tenantsRes.data : [];
        const payments: Payment[] = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
        const maintenance: MaintenanceRequest[] = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : [];

        setAllPayments(payments);
        const scores = calculateAllTenantRiskScores(tenants, payments, maintenance);
        const atRisk = scores.filter(s => s.level === 'medium' || s.level === 'high').slice(0, 5);
        setRiskTenants(atRisk);
      } catch (err) {
        console.error('[Dashboard] Failed to load risk data:', err);
      }
    };

    fetchRiskData();
  }, [authLoading, isAuthenticated]);

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

  const revenueData = useMemo(() => {
    const completedPayments = allPayments.filter(p => p.payment_status === 'completed');
    const now = new Date();
    const months: { month: string; revenue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });

      const monthRevenue = completedPayments
        .filter(p => {
          const pd = new Date(p.payment_date || p.created_at);
          return pd.getMonth() === m && pd.getFullYear() === y;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      months.push({ month: monthName, revenue: monthRevenue });
    }

    return months;
  }, [allPayments]);

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
          <ChartWrapper title="Revenue Trend" data={revenueData} dataKey="revenue" xAxisKey="month" type="line" />
          <ChartWrapper title="Property Performance" data={revenueData} dataKey="revenue" xAxisKey="month" type="bar" />
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

        {/* Tenants Requiring Attention */}
        {riskTenants.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Tenants Requiring Attention
              </h2>
              <Link
                href="/owner/risk-scores"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Scores
              </Link>
            </div>
            <div className="space-y-3">
              {riskTenants.map((rs) => {
                const tenantUser = (rs.tenant as any).user;
                return (
                  <Link
                    key={rs.tenantId}
                    href={`/owner/tenants/${rs.tenantId}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">
                          {tenantUser?.full_name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{tenantUser?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{rs.tenant.unit?.unit_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 rounded-full h-2 w-16">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${rs.score}%`, backgroundColor: RISK_LEVEL_CONFIG[rs.level].color }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-6">{rs.score}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskBgClass(rs.level)}`}>
                        {RISK_LEVEL_CONFIG[rs.level].label}
                      </span>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
