'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, Users, Building2, PieChart as PieChartIcon, Download } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { apiClient } from '@/lib/api-services';

export default function FinancialAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    revenue: { current: 1631350, previous: 1602100, growth: 1.8 },
    profit: { amount: 1362250, margin: 83.5, roi: 406 },
    expenses: { total: 269100, breakdown: [] },
    collection: { rate: 95.2, trend: "up"  },
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/owner/analytics');
      if (response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const revenueData = [
    { name: 'Jan', revenue: 1450000 },
    { name: 'Feb', revenue: 1480000 },
    { name: 'Mar', revenue: 1520000 },
    { name: 'Apr', revenue: 1490000 },
    { name: 'May', revenue: 1550000 },
    { name: 'Jun', revenue: 1580000 },
    { name: 'Jul', revenue: 1600000 },
    { name: 'Aug', revenue: 1590000 },
    { name: 'Sep', revenue: 1620000 },
    { name: 'Oct', revenue: 1602100 },
    { name: 'Nov', revenue: 1631350 },
  ];

  const revenueSourcesData = [
    { name: 'Rent', value: 1380250 },
    { name: 'Water Bills', value: 94300 },
    { name: 'Electricity', value: 156800 },
  ];

  const expensesData = [
    { name: 'Staff', value: 185000 },
    { name: 'Commissions', value: 52400 },
    { name: 'Maintenance', value: 18500 },
    { name: 'Subscription', value: 5000 },
    { name: 'Other', value: 8200 },
  ];

  const propertyProfitData = [
    { name: 'Property 1', profit: 365000, margin: 85 },
    { name: 'Property 2', profit: 395250, margin: 86 },
    { name: 'Property 3', profit: 312500, margin: 82 },
    { name: 'Property 4', profit: 258300, margin: 80 },
    { name: 'Property 5', profit: 175200, margin: 78 },
  ];

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  const handleDownloadReport = () => {
    // Generate and download PDF report
    alert('Downloading financial report...');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial insights and reports</p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(analytics.revenue.current)}
          icon={DollarSign}
          trend={analytics.revenue.growth > 0 ? "up" : "down"}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(analytics.profit.amount)}
          icon={TrendingUp}
          subtitle={`${analytics.profit.margin}% margin`}
          valueClassName="text-green-600"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(analytics.expenses.total)}
          icon={Users}
          label="All costs"
        />
        <StatCard
          title="ROI"
          value={`${analytics.profit.roi}%`}
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
        title="Revenue Trend (Last 11 Months)"
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

      {/* Profit by Property */}
      <ChartWrapper
        type="bar"
        data={propertyProfitData}
        dataKey="profit"
        xAxisKey="name"
        title="Profit by Property"
        height={300}
      />

      {/* Detailed Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
            <p className="text-2xl font-bold text-green-600">95.2%</p>
            <p className="text-xs text-gray-500 mt-1">↑ 1.4% from last month</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-blue-600">83.5%</p>
            <p className="text-xs text-gray-500 mt-1">Excellent performance</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Occupancy</p>
            <p className="text-2xl font-bold text-gray-900">91.2%</p>
            <p className="text-xs text-gray-500 mt-1">Across all properties</p>
          </div>
        </div>
      </div>
    </div>
  );
}
