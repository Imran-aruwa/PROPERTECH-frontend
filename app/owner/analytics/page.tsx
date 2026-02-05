'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, DollarSign, Users, Building2, Download, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { paymentsApi, propertiesApi, tenantsApi, maintenanceApi, staffApi, unitsApi } from '@/lib/api-services';
import { Payment, Property, Unit, MaintenanceRequest } from '@/app/lib/types';

export default function FinancialAnalytics() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [staffSalaries, setStaffSalaries] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsRes, propertiesRes, unitsRes, maintenanceRes, staffRes] = await Promise.all([
        paymentsApi.getAll(),
        propertiesApi.getAll(),
        unitsApi.getAll(),
        maintenanceApi.getAll(),
        staffApi.getAll(),
      ]);

      const paymentsData = Array.isArray(paymentsRes.data) ? paymentsRes.data
        : paymentsRes.data?.data ? (Array.isArray(paymentsRes.data.data) ? paymentsRes.data.data : [])
        : [];
      setPayments(paymentsData);

      const propsData = Array.isArray(propertiesRes.data) ? propertiesRes.data
        : propertiesRes.data?.results ? propertiesRes.data.results
        : [];
      setProperties(propsData);

      const unitsData = Array.isArray(unitsRes.data) ? unitsRes.data
        : unitsRes.data?.data ? (Array.isArray(unitsRes.data.data) ? unitsRes.data.data : [])
        : [];
      setUnits(unitsData);

      const maintData = Array.isArray(maintenanceRes.data) ? maintenanceRes.data
        : maintenanceRes.data?.data ? (Array.isArray(maintenanceRes.data.data) ? maintenanceRes.data.data : [])
        : [];
      setMaintenanceRequests(maintData);

      const staffData = Array.isArray(staffRes.data) ? staffRes.data
        : staffRes.data?.data ? (Array.isArray(staffRes.data.data) ? staffRes.data.data : [])
        : [];
      const totalSalaries = staffData.reduce((sum: number, s: any) => sum + (s.salary || 0), 0);
      setStaffSalaries(totalSalaries);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute analytics from real data
  const analytics = useMemo(() => {
    const completedPayments = payments.filter(p => p.payment_status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Current month and previous month revenue
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthPayments = completedPayments.filter(p => {
      const d = new Date(p.payment_date || p.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const currentMonthRevenue = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthPayments = completedPayments.filter(p => {
      const d = new Date(p.payment_date || p.created_at);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });
    const prevMonthRevenue = prevMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const growth = prevMonthRevenue > 0
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0;

    // Expenses
    const maintenanceCost = maintenanceRequests
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalExpenses = staffSalaries + maintenanceCost;

    // Profit
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Collection rate
    const totalPaymentsCount = payments.filter(p => p.payment_type === 'rent').length;
    const completedRentCount = payments.filter(p => p.payment_type === 'rent' && p.payment_status === 'completed').length;
    const collectionRate = totalPaymentsCount > 0
      ? (completedRentCount / totalPaymentsCount) * 100
      : 0;

    // Occupancy
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u =>
      u.status === 'occupied' || u.status === 'rented'
    ).length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    return {
      totalRevenue,
      currentMonthRevenue,
      prevMonthRevenue,
      growth,
      profit,
      profitMargin,
      totalExpenses,
      maintenanceCost,
      collectionRate,
      occupancyRate,
    };
  }, [payments, maintenanceRequests, staffSalaries, units]);

  // Revenue trend: group completed payments by month (last 6 months)
  const revenueData = useMemo(() => {
    const completedPayments = payments.filter(p => p.payment_status === 'completed');
    const months: { name: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });

      const monthRevenue = completedPayments
        .filter(p => {
          const pd = new Date(p.payment_date || p.created_at);
          return pd.getMonth() === month && pd.getFullYear() === year;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      months.push({ name: monthName, revenue: monthRevenue });
    }

    return months;
  }, [payments]);

  // Revenue sources: group by payment_type
  const revenueSourcesData = useMemo(() => {
    const completedPayments = payments.filter(p => p.payment_status === 'completed');
    const byType: Record<string, number> = {};

    for (const p of completedPayments) {
      const type = p.payment_type || 'other';
      const label = type === 'rent' ? 'Rent'
        : type === 'water' ? 'Water Bills'
        : type === 'electricity' ? 'Electricity'
        : 'Other';
      byType[label] = (byType[label] || 0) + (p.amount || 0);
    }

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [payments]);

  // Expense breakdown
  const expensesData = useMemo(() => {
    const maintenanceCost = maintenanceRequests
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (m.cost || 0), 0);

    const items: { name: string; value: number }[] = [];
    if (staffSalaries > 0) items.push({ name: 'Staff Salaries', value: staffSalaries });
    if (maintenanceCost > 0) items.push({ name: 'Maintenance', value: maintenanceCost });

    if (items.length === 0) {
      items.push({ name: 'No expenses recorded', value: 0 });
    }

    return items;
  }, [maintenanceRequests, staffSalaries]);

  // Revenue by property
  const propertyProfitData = useMemo(() => {
    const completedPayments = payments.filter(p => p.payment_status === 'completed');

    // Build a unit → property mapping
    const unitToProperty: Record<number, string> = {};
    for (const u of units) {
      const propName = u.property?.name || properties.find(p => p.id === u.property_id)?.name || `Property ${u.property_id}`;
      unitToProperty[u.id] = propName;
    }

    // Group revenue by property
    const byProperty: Record<string, number> = {};
    for (const p of completedPayments) {
      const propName = unitToProperty[p.unit_id] || 'Unknown Property';
      byProperty[propName] = (byProperty[propName] || 0) + (p.amount || 0);
    }

    return Object.entries(byProperty)
      .map(([name, revenue]) => ({ name, profit: revenue }))
      .sort((a, b) => b.profit - a.profit);
  }, [payments, units, properties]);

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial insights and reports</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics.totalRevenue)}
          icon={DollarSign}
          trend={analytics.growth > 0 ? "up" : analytics.growth < 0 ? "down" : "neutral"}
          change={analytics.growth !== 0 ? `${analytics.growth.toFixed(1)}% vs last month` : undefined}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(analytics.profit)}
          icon={TrendingUp}
          subtitle={`${analytics.profitMargin.toFixed(1)}% margin`}
          valueClassName="text-green-600"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(analytics.totalExpenses)}
          icon={Users}
          label="All costs"
        />
        <StatCard
          title="Collection Rate"
          value={`${analytics.collectionRate.toFixed(1)}%`}
          icon={Building2}
          valueClassName="text-blue-600"
        />
      </div>

      {/* Revenue Trend */}
      <ChartWrapper
        type="line"
        data={revenueData}
        dataKey="revenue"
        xAxisKey="name"
        title="Revenue Trend (Last 6 Months)"
        height={300}
      />

      {/* Revenue Sources & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          type="pie"
          data={revenueSourcesData}
          dataKey="value"
          title="Revenue Sources Breakdown"
          height={300}
        />
        <ChartWrapper
          type="pie"
          data={expensesData}
          dataKey="value"
          title="Expense Breakdown"
          height={300}
        />
      </div>

      {/* Revenue by Property */}
      {propertyProfitData.length > 0 && (
        <ChartWrapper
          type="bar"
          data={propertyProfitData}
          dataKey="profit"
          xAxisKey="name"
          title="Revenue by Property"
          height={300}
        />
      )}

      {/* Detailed Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
            <p className="text-2xl font-bold text-green-600">{analytics.collectionRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Completed rent payments</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-blue-600">{analytics.profitMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Revenue minus expenses</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Occupancy</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.occupancyRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Across all properties</p>
          </div>
        </div>
      </div>
    </div>
  );
}
