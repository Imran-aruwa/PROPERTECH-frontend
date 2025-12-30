'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Award, Download, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { ChartWrapper } from '@/components/ui/ChartWrapper';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { agentApi } from '@/app/lib/api-services';

interface EarningsData {
  thisMonth: number;
  lastMonth: number;
  ytd: number;
  nextPayout: string;
}

interface EarningsTrend {
  name: string;
  amount: number;
}

interface CommissionBreakdown {
  name: string;
  amount: number;
}

interface PropertyCommission {
  id: string;
  property: string;
  rent: number;
  bills: number;
  bonus: number;
  total: number;
}

interface Payout {
  date: string;
  amount: number;
  status: string;
}

export default function AgentEarningsPage() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [earningsTrend, setEarningsTrend] = useState<EarningsTrend[]>([]);
  const [commissionBreakdown, setCommissionBreakdown] = useState<CommissionBreakdown[]>([]);
  const [propertyCommissions, setPropertyCommissions] = useState<PropertyCommission[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await agentApi.getEarnings();

        if (response.success && response.data) {
          const data = response.data;
          setEarnings({
            thisMonth: data.this_month || data.thisMonth || 0,
            lastMonth: data.last_month || data.lastMonth || 0,
            ytd: data.ytd || data.year_to_date || 0,
            nextPayout: data.next_payout || data.nextPayout || '-',
          });
          setEarningsTrend(data.earnings_trend || data.earningsTrend || []);
          setCommissionBreakdown(data.commission_breakdown || data.commissionBreakdown || []);
          setPropertyCommissions((data.property_commissions || data.propertyCommissions || []).map((p: any, idx: number) => ({
            id: p.id?.toString() || idx.toString(),
            property: p.property || p.name || '',
            rent: p.rent || p.rent_commission || 0,
            bills: p.bills || p.bill_commission || 0,
            bonus: p.bonus || 0,
            total: p.total || 0,
          })));
          setPayoutHistory(data.payout_history || data.payoutHistory || []);
        } else {
          // Set empty state
          setEarnings({ thisMonth: 0, lastMonth: 0, ytd: 0, nextPayout: '-' });
          setEarningsTrend([]);
          setCommissionBreakdown([]);
          setPropertyCommissions([]);
          setPayoutHistory([]);
        }
      } catch (err) {
        console.error('Failed to fetch earnings:', err);
        setError('Failed to load earnings data');
        setEarnings({ thisMonth: 0, lastMonth: 0, ytd: 0, nextPayout: '-' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

  const columns = [
    { header: 'Property', accessor: 'property' as const },
    {
      header: 'Rent Commission',
      accessor: ((row: PropertyCommission) => formatCurrency(row.rent)) as any,
    },
    {
      header: 'Bill Commission',
      accessor: ((row: PropertyCommission) => formatCurrency(row.bills)) as any,
    },
    {
      header: 'Bonus',
      accessor: ((row: PropertyCommission) => formatCurrency(row.bonus)) as any,
    },
    {
      header: 'Total',
      accessor: ((row: PropertyCommission) => (
        <span className="font-bold text-green-600">
          {formatCurrency(row.total)}
        </span>
      )) as any,
    },
  ];

  // Mobile card view for property commissions
  const MobileCommissionsView = () => (
    <div className="space-y-4 md:hidden">
      {propertyCommissions.map((pc) => (
        <div key={pc.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-medium text-gray-900">{pc.property}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Rent</p>
              <p className="font-medium">{formatCurrency(pc.rent)}</p>
            </div>
            <div>
              <p className="text-gray-500">Bills</p>
              <p className="font-medium">{formatCurrency(pc.bills)}</p>
            </div>
            <div>
              <p className="text-gray-500">Bonus</p>
              <p className="font-medium">{formatCurrency(pc.bonus)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-bold text-green-600">{formatCurrency(pc.total)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout role="agent">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading earnings...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Commission Earnings</h1>
            <p className="text-gray-600 mt-1">Track your performance and earnings</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto">
            <Download className="w-4 h-4" />
            <span>Download Statement</span>
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="This Month"
            value={formatCurrency(earnings?.thisMonth || 0)}
            icon={DollarSign}
            trend="up"
          />
          <StatCard
            title="Year to Date"
            value={formatCurrency(earnings?.ytd || 0)}
            icon={Award}
            valueClassName="text-green-600"
          />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <p className="text-sm text-gray-600 mb-2">Next Payout</p>
            <p className="text-xl md:text-2xl font-bold text-blue-600">
              {earnings?.nextPayout || '-'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Pending: {formatCurrency(earnings?.thisMonth || 0)}
            </p>
          </div>
        </div>

        {/* Earnings Trend */}
        {earningsTrend.length > 0 && (
          <ChartWrapper
            type="line"
            data={earningsTrend}
            dataKey="amount"
            xAxisKey="name"
            title="Earnings Trend (Last 6 Months)"
            height={300}
          />
        )}

        {/* Commission Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {commissionBreakdown.length > 0 && (
            <ChartWrapper
              type="pie"
              data={commissionBreakdown}
              dataKey="amount"
              title="Commission Breakdown"
              height={300}
            />
          )}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Bonuses</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium text-gray-900">On-time Readings</p>
                  <p className="text-sm text-gray-600 truncate">All meter readings submitted on time</p>
                </div>
                <span className="text-green-600 font-bold whitespace-nowrap">+KES 1,500</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-50">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium text-gray-900">90% Occupancy</p>
                  <p className="text-sm text-gray-600">Target not met</p>
                </div>
                <span className="text-gray-400 whitespace-nowrap">KES 0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commission by Property */}
        {propertyCommissions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Commission by Property</h2>
            <MobileCommissionsView />
            <div className="hidden md:block">
              <DataTable data={propertyCommissions} columns={columns} />
            </div>
          </div>
        )}

        {/* Payout History */}
        {payoutHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payout History</h2>
            <div className="space-y-3">
              {payoutHistory.map((payout, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{payout.date}</p>
                    <p className="text-sm text-gray-600">{payout.status}</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(payout.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
