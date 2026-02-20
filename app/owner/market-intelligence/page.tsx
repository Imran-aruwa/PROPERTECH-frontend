'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Home,
  Users,
  Activity,
  Lock,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Star,
  Building2,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { marketApi, paymentsApi } from '@/lib/api-services';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AreaSummary {
  area_name: string;
  city: string | null;
  avg_rent_overall: number | null;
  vacancy_rate: number;
  avg_tenancy_months: number | null;
  area_health_score: number | null;
  total_units: number;
  data_points: number;
  last_computed_at: string | null;
}

interface AreaDetail extends AreaSummary {
  avg_rent_by_type: {
    studio: number | null;
    one_br: number | null;
    two_br: number | null;
    three_br: number | null;
    four_br_plus: number | null;
  };
  vacant_units: number;
  maintenance_rate: number | null;
  vacancy_trend: { month: string; rate: number }[];
}

interface UnitBenchmark {
  unit_id: string;
  unit_number: string;
  bedrooms: number;
  monthly_rent: number;
  area_avg_rent: number | null;
  delta: number | null;
  delta_pct: number | null;
}

interface PropertyBenchmark {
  property_id: string;
  property_name: string;
  area_name: string;
  city: string | null;
  area_health_score: number | null;
  units: UnitBenchmark[];
}

interface BenchmarkSummary {
  total_properties: number;
  total_units: number;
  properties_above_market: number;
  properties_below_market: number;
  avg_delta_pct: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, prefix = 'KES ') =>
  n != null ? `${prefix}${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` : '—';

const fmtPct = (n: number | null | undefined, multiply = false) =>
  n != null ? `${(multiply ? n * 100 : n).toFixed(1)}%` : '—';

const scoreColor = (score: number | null) => {
  if (score == null) return 'text-gray-500';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
};

const scoreBg = (score: number | null) => {
  if (score == null) return 'bg-gray-100';
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
};

const bedroomLabel = (key: string) => {
  const map: Record<string, string> = {
    studio: 'Studio',
    one_br: '1 BR',
    two_br: '2 BR',
    three_br: '3 BR',
    four_br_plus: '4+ BR',
  };
  return map[key] || key;
};

// ─── Premium Gate Component ───────────────────────────────────────────────────

function PremiumGate() {
  return (
    <div className="relative">
      {/* Blurred preview content */}
      <div className="blur-sm pointer-events-none select-none opacity-40" aria-hidden>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {['Avg Rent', 'Vacancy Rate', 'Avg Tenancy', 'Health Score'].map((t) => (
            <div key={t} className="bg-white rounded-lg border p-6 h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border h-64" />
          <div className="bg-white rounded-lg border h-64" />
        </div>
        <div className="bg-white rounded-lg border h-48" />
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 max-w-md text-center mx-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Premium Feature
          </h2>
          <p className="text-gray-600 mb-6">
            Market Intelligence is available on the{' '}
            <span className="font-semibold text-blue-600">Professional</span> and{' '}
            <span className="font-semibold text-blue-600">Enterprise</span> plans.
            Unlock data-driven insights on area rents, vacancy trends, and your
            portfolio&apos;s market position.
          </p>
          <div className="space-y-3 text-left mb-6">
            {[
              'Area rent benchmarks by bedroom type',
              '6-month vacancy trend charts',
              'My Properties vs Market comparison',
              'Area Health Scores (0–100)',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <Star className="w-4 h-4 text-blue-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <a
            href="/owner/subscription"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Upgrade Now
          </a>
          <p className="text-xs text-gray-400 mt-3">Cancel anytime · No setup fees</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumGated, setIsPremiumGated] = useState(false);

  // Data
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [areaDetail, setAreaDetail] = useState<AreaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [benchmark, setBenchmark] = useState<{
    properties: PropertyBenchmark[];
    summary: BenchmarkSummary;
  } | null>(null);

  // ── Premium check ─────────────────────────────────────────────────────────

  const isPremiumError = (err: string | unknown): boolean => {
    const s = typeof err === 'string' ? err : JSON.stringify(err);
    return s.toLowerCase().includes('premium') || s.toLowerCase().includes('subscription');
  };

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchOverview = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const res = await marketApi.getAreaOverview();

      if (!res.success) {
        if (isPremiumError(res.error)) {
          setIsPremiumGated(true);
          return;
        }
        setError(res.error || 'Failed to load market data.');
        return;
      }

      const data = res.data;
      const areaList: AreaSummary[] = Array.isArray(data?.areas)
        ? data.areas
        : Array.isArray(data)
        ? data
        : [];
      setAreas(areaList);

      setSelectedArea(prev => (areaList.length > 0 && !prev) ? areaList[0].area_name : prev);
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  const fetchBenchmark = useCallback(async () => {
    try {
      const res = await marketApi.getMyPropertiesBenchmark();
      if (res.success) {
        const d = res.data;
        setBenchmark({
          properties: d?.properties || [],
          summary: d?.summary || { total_properties: 0, total_units: 0, properties_above_market: 0, properties_below_market: 0, avg_delta_pct: null },
        });
      }
    } catch {}
  }, []);

  const fetchAreaDetail = useCallback(async (areaName: string) => {
    if (!areaName) return;
    try {
      setDetailLoading(true);
      const res = await marketApi.getAreaDetail(areaName);
      if (res.success) {
        setAreaDetail(res.data as AreaDetail);
      }
    } catch {}
    finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchBenchmark();
  }, [fetchOverview, fetchBenchmark]);

  useEffect(() => {
    if (selectedArea) {
      fetchAreaDetail(selectedArea);
    }
  }, [selectedArea, fetchAreaDetail]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const currentArea = areas.find(
    (a) => a.area_name.toLowerCase() === selectedArea.toLowerCase()
  );

  /** Bar chart: my properties avg vs area avg by bedroom type */
  const rentBenchmarkData = (() => {
    if (!areaDetail || !benchmark) return [];
    const areaRents = areaDetail.avg_rent_by_type;
    const myRents: Record<number, number[]> = {};
    benchmark.properties
      .filter((p) => p.area_name.toLowerCase() === selectedArea.toLowerCase())
      .forEach((p) =>
        p.units.forEach((u) => {
          if (u.monthly_rent > 0) {
            myRents[u.bedrooms] = myRents[u.bedrooms] || [];
            myRents[u.bedrooms].push(u.monthly_rent);
          }
        })
      );
    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    return [
      { type: 'Studio', area: areaRents.studio, mine: avg(myRents[0] || []) },
      { type: '1 BR', area: areaRents.one_br, mine: avg(myRents[1] || []) },
      { type: '2 BR', area: areaRents.two_br, mine: avg(myRents[2] || []) },
      { type: '3 BR', area: areaRents.three_br, mine: avg(myRents[3] || []) },
      { type: '4+ BR', area: areaRents.four_br_plus, mine: avg(myRents[4] || []) },
    ].filter((d) => d.area != null || d.mine != null);
  })();

  /** Line chart: 6-month vacancy trend */
  const vacancyTrendData = (areaDetail?.vacancy_trend || []).map((p) => ({
    month: p.month,
    'Vacancy %': parseFloat((p.rate * 100).toFixed(1)),
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading market data…</p>
        </div>
      </div>
    );
  }

  if (isPremiumGated) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1">
            Neighbourhood rent benchmarks, vacancy trends &amp; portfolio comparison
          </p>
        </div>
        <PremiumGate />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-gray-500 text-sm mt-1">
            Neighbourhood rent benchmarks, vacancy trends &amp; portfolio comparison
          </p>
        </div>
        <button
          onClick={() => { fetchOverview(true); if (selectedArea) fetchAreaDetail(selectedArea); fetchBenchmark(); }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Area Selector ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4 text-blue-500" />
            Select Neighbourhood
          </div>
          <div className="relative">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
            >
              {areas.map((a) => (
                <option key={a.area_name} value={a.area_name}>
                  {a.area_name}{a.city ? ` · ${a.city}` : ''}
                  {a.area_health_score != null ? ` — Score ${a.area_health_score}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {currentArea?.data_points === 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Reference data (no local properties yet)
            </span>
          )}
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Rent (Overall)"
          value={fmt(currentArea?.avg_rent_overall)}
          icon={Home}
          subtitle={selectedArea}
        />
        <StatCard
          title="Vacancy Rate"
          value={fmtPct(currentArea?.vacancy_rate, true)}
          icon={Building2}
          trend={
            (currentArea?.vacancy_rate ?? 0) > 0.15
              ? 'down'
              : (currentArea?.vacancy_rate ?? 0) < 0.08
              ? 'up'
              : 'neutral'
          }
          change={
            (currentArea?.vacancy_rate ?? 0) > 0.15
              ? 'High vacancy'
              : (currentArea?.vacancy_rate ?? 0) < 0.08
              ? 'Low vacancy'
              : 'Moderate'
          }
        />
        <StatCard
          title="Avg Tenancy"
          value={
            currentArea?.avg_tenancy_months != null
              ? `${currentArea.avg_tenancy_months.toFixed(1)} mo`
              : '—'
          }
          icon={Users}
          subtitle="Average lease duration"
        />
        <div className={`rounded-lg shadow-sm border p-6 ${scoreBg(currentArea?.area_health_score ?? null)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Area Health Score</p>
              <p className={`text-3xl font-bold ${scoreColor(currentArea?.area_health_score ?? null)}`}>
                {currentArea?.area_health_score != null
                  ? currentArea.area_health_score.toFixed(0)
                  : '—'}
                <span className="text-base font-normal text-gray-400"> / 100</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(currentArea?.area_health_score ?? 0) >= 80
                  ? 'Excellent market'
                  : (currentArea?.area_health_score ?? 0) >= 60
                  ? 'Good market'
                  : 'Challenging market'}
              </p>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      {detailLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rent Benchmark Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Rent Benchmark by Unit Type
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Area average vs your properties in {selectedArea}
            </p>
            {rentBenchmarkData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={rentBenchmarkData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`KES ${v.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="area" name="Area Avg" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mine" name="My Properties" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Building2 className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">
                  {areaDetail
                    ? 'No rent data for your properties in this area'
                    : 'Select an area to view rent benchmarks'}
                </p>
              </div>
            )}
          </div>

          {/* Vacancy Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Vacancy Trend
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Monthly vacancy rate over the last 6 months — {selectedArea}
            </p>
            {vacancyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={vacancyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Vacancy']} />
                  <Line
                    type="monotone"
                    dataKey="Vacancy %"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No trend data available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Area Metrics Detail ── */}
      {areaDetail && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Rent Breakdown by Bedroom Type — {areaDetail.area_name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(
              Object.entries(areaDetail.avg_rent_by_type) as [string, number | null][]
            ).map(([key, val]) => (
              <div
                key={key}
                className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100"
              >
                <p className="text-xs text-gray-500 mb-1">{bedroomLabel(key)}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {val != null ? `KES ${val.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` : '—'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Units</span>
              <p className="font-semibold text-gray-900">{areaDetail.total_units || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Vacant Units</span>
              <p className="font-semibold text-gray-900">{areaDetail.vacant_units ?? '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Maintenance Rate</span>
              <p className="font-semibold text-gray-900">
                {areaDetail.maintenance_rate != null
                  ? `${areaDetail.maintenance_rate.toFixed(2)} / unit`
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Data Points</span>
              <p className="font-semibold text-gray-900">
                {areaDetail.data_points === 0
                  ? 'Reference data'
                  : `${areaDetail.data_points} ${areaDetail.data_points === 1 ? 'property' : 'properties'}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── My Properties vs Market Table ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            My Properties vs Market
          </h3>
          {benchmark?.summary && (
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                <span className="font-medium text-gray-900">{benchmark.summary.total_properties}</span>{' '}
                propert{benchmark.summary.total_properties === 1 ? 'y' : 'ies'}
              </span>
              <span>
                <span className="font-medium text-gray-900">{benchmark.summary.total_units}</span> units
              </span>
              {benchmark.summary.avg_delta_pct != null && (
                <span className={benchmark.summary.avg_delta_pct >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                  Portfolio avg {benchmark.summary.avg_delta_pct >= 0 ? '+' : ''}
                  {benchmark.summary.avg_delta_pct.toFixed(1)}% vs market
                </span>
              )}
            </div>
          )}
        </div>

        {!benchmark || benchmark.properties.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No properties found for comparison.</p>
            <p className="text-xs mt-1">
              Add an <strong>area</strong> field to your properties to enable benchmark comparisons.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {benchmark.properties.map((prop) => (
              <div key={prop.property_id} className="p-4 md:p-6">
                {/* Property header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{prop.property_name}</p>
                      <p className="text-xs text-gray-400">
                        {prop.area_name}{prop.city ? ` · ${prop.city}` : ''}
                      </p>
                    </div>
                  </div>
                  {prop.area_health_score != null && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${scoreBg(prop.area_health_score)}`}>
                      <span className={scoreColor(prop.area_health_score)}>
                        Area Score: {prop.area_health_score.toFixed(0)}
                      </span>
                    </span>
                  )}
                </div>

                {/* Units table */}
                {prop.units.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2 font-medium">Unit</th>
                          <th className="text-left pb-2 font-medium">Bedrooms</th>
                          <th className="text-right pb-2 font-medium">My Rent</th>
                          <th className="text-right pb-2 font-medium">Area Avg</th>
                          <th className="text-right pb-2 font-medium">vs Market</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {prop.units.map((unit) => (
                          <tr key={unit.unit_id} className="text-gray-700">
                            <td className="py-2 font-medium">{unit.unit_number}</td>
                            <td className="py-2 text-gray-500">
                              {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} BR`}
                            </td>
                            <td className="py-2 text-right">
                              {fmt(unit.monthly_rent, 'KES ')}
                            </td>
                            <td className="py-2 text-right text-gray-400">
                              {unit.area_avg_rent != null ? fmt(unit.area_avg_rent, 'KES ') : '—'}
                            </td>
                            <td className="py-2 text-right">
                              {unit.delta == null || unit.area_avg_rent == null ? (
                                <span className="text-gray-300">—</span>
                              ) : unit.delta > 0 ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                  <ArrowUpRight className="w-3 h-3" />
                                  +{unit.delta_pct?.toFixed(1)}%
                                </span>
                              ) : unit.delta < 0 ? (
                                <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                                  <ArrowDownRight className="w-3 h-3" />
                                  {unit.delta_pct?.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                  <Minus className="w-3 h-3" />
                                  At market
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── All Areas Overview Table ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">All Areas Overview</h3>
          <p className="text-xs text-gray-400 mt-1">
            Click a row to switch the selected area
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-6 py-3 font-medium">Area</th>
                <th className="text-right px-4 py-3 font-medium">Avg Rent</th>
                <th className="text-right px-4 py-3 font-medium">Vacancy</th>
                <th className="text-right px-4 py-3 font-medium">Avg Tenancy</th>
                <th className="text-right px-6 py-3 font-medium">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {areas.map((area) => (
                <tr
                  key={area.area_name}
                  onClick={() => setSelectedArea(area.area_name)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                    area.area_name.toLowerCase() === selectedArea.toLowerCase()
                      ? 'bg-blue-50 border-l-2 border-blue-500'
                      : ''
                  }`}
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {area.area_name}
                      {area.city && (
                        <span className="text-xs text-gray-400">{area.city}</span>
                      )}
                      {area.data_points === 0 && (
                        <span className="text-xs bg-gray-100 text-gray-400 px-1 rounded">
                          ref
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {fmt(area.avg_rent_overall)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        area.vacancy_rate > 0.15
                          ? 'text-red-500 font-medium'
                          : area.vacancy_rate < 0.08
                          ? 'text-green-600 font-medium'
                          : 'text-gray-700'
                      }
                    >
                      {fmtPct(area.vacancy_rate, true)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {area.avg_tenancy_months != null
                      ? `${area.avg_tenancy_months.toFixed(1)} mo`
                      : '—'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`inline-block font-semibold ${scoreColor(area.area_health_score)}`}
                    >
                      {area.area_health_score != null
                        ? area.area_health_score.toFixed(0)
                        : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
