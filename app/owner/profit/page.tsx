'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Building2, AlertTriangle,
  BarChart2, Sliders, FileText, Plus, Trash2, Edit2, Printer,
  RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink,
  ChevronDown, ChevronUp, Target,
} from 'lucide-react';
import { profitApi } from '@/app/lib/api-services';
import type {
  FinancialSnapshot, PropertyRanking, UnitProfitability,
  PortfolioPnl, TargetStatus, ExpenseRecord, FinancialReportSummary,
  FinancialReportDetail, ScenarioResult,
} from '@/app/lib/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const TABS = [
  { id: 'overview',  label: 'Overview',    icon: TrendingUp   },
  { id: 'rankings',  label: 'Rankings',    icon: BarChart2    },
  { id: 'whatif',    label: 'What-If',     icon: Sliders      },
  { id: 'expenses',  label: 'Expenses',    icon: DollarSign   },
  { id: 'reports',   label: 'Reports',     icon: FileText     },
] as const;

type TabId = typeof TABS[number]['id'];

const EXPENSE_CATEGORIES = [
  'maintenance', 'utilities', 'insurance', 'tax',
  'management_fee', 'loan_repayment', 'other',
];

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, variant = 'default' }: {
  label: string; value: string; sub?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const colors = {
    default: 'text-tx-primary',
    success: 'text-status-success',
    danger:  'text-status-danger',
    warning: 'text-status-warning',
  };
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs text-tx-muted font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${colors[variant]}`}>{value}</span>
      {sub && <span className="text-xs text-tx-muted">{sub}</span>}
    </div>
  );
}

// ── Target Progress Bar ────────────────────────────────────────────────────────

function TargetBar({ t }: { t: TargetStatus }) {
  const pctCapped = Math.min(t.pct_achieved, 100);
  const color = t.status === 'on_track' ? 'bg-status-success' : t.status === 'at_risk' ? 'bg-status-warning' : 'bg-status-danger';
  const label = t.property_name ? `${t.target_type} — ${t.property_name}` : t.target_type;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-tx-secondary capitalize">{label}</span>
        <span className="text-tx-muted">{pct(t.pct_achieved)} achieved</span>
      </div>
      <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pctCapped}%` }} />
      </div>
      <div className="flex justify-between text-xs text-tx-muted">
        <span>Actual: {fmt(t.actual_value)}</span>
        <span>Target: {fmt(t.target_value)}</span>
      </div>
    </div>
  );
}

// ── Issue Card ─────────────────────────────────────────────────────────────────

function IssueCard({ issue, onFix }: { issue: { severity: string; message: string; link?: string }; onFix: (link: string) => void }) {
  const icon = issue.severity === 'high'
    ? <XCircle className="h-5 w-5 text-status-danger flex-shrink-0" />
    : issue.severity === 'medium'
    ? <AlertCircle className="h-5 w-5 text-status-warning flex-shrink-0" />
    : <CheckCircle className="h-5 w-5 text-status-success flex-shrink-0" />;
  return (
    <div className="card p-3 flex items-start gap-3">
      {icon}
      <span className="text-sm text-tx-secondary flex-1">{issue.message}</span>
      {issue.link && (
        <button
          onClick={() => onFix(issue.link!)}
          className="text-xs btn btn-secondary whitespace-nowrap"
        >
          Fix It
        </button>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProfitEnginePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();

  const tabParam = (searchParams.get('tab') as TabId) || 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(tabParam);
  const [period, setPeriod] = useState(currentPeriod());

  // Chart colour palette (theme-aware)
  const isDark = resolvedTheme === 'dark';
  const C = {
    revenue:  '#3b82f6',   // blue-500
    expenses: '#ef4444',   // red-500
    noi:      '#22c55e',   // green-500
    muted:    isDark ? '#6b7280' : '#9ca3af',
    PIE: ['#3b82f6','#ef4444','#f59e0b','#22c55e','#8b5cf6','#ec4899','#06b6d4'],
  };

  // ── State ────────────────────────────────────────────────────────────────────

  const [snapshot, setSnapshot]             = useState<FinancialSnapshot | null>(null);
  const [pnl, setPnl]                       = useState<PortfolioPnl | null>(null);
  const [rankings, setRankings]             = useState<PropertyRanking[]>([]);
  const [targetsStatus, setTargetsStatus]   = useState<TargetStatus[]>([]);
  const [expenses, setExpenses]             = useState<ExpenseRecord[]>([]);
  const [reports, setReports]               = useState<FinancialReportSummary[]>([]);
  const [unitMap, setUnitMap]               = useState<Record<string, UnitProfitability[]>>({});
  const [expandedProp, setExpandedProp]     = useState<string | null>(null);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // What-If
  const [scenarios, setScenarios] = useState<Record<string, ScenarioResult | null>>({
    rent_increase: null, fill_vacancy: null,
    reduce_maintenance: null, expense_category_shift: null,
  });
  const [scenarioLoading, setScenarioLoading] = useState<Record<string, boolean>>({});
  const [scenarioParams, setScenarioParams] = useState<Record<string, Record<string, any>>>({
    rent_increase:         { increase_pct: 10 },
    fill_vacancy:          { estimated_rent: 0 },
    reduce_maintenance:    { reduction_pct: 20 },
    expense_category_shift:{ category: 'utilities', new_budget: 0 },
  });

  // Expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'utilities', description: '', amount: '', expense_date: '',
    property_id: '', receipt_url: '', notes: '',
  });
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // Reports
  const [reportPeriod, setReportPeriod]   = useState(currentPeriod());
  const [generating, setGenerating]       = useState(false);
  const [activeReport, setActiveReport]   = useState<FinancialReportDetail | null>(null);
  const [pollId, setPollId]               = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data loaders ─────────────────────────────────────────────────────────────

  const loadOverview = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [snapR, pnlR, rankR, targR] = await Promise.all([
        profitApi.getSnapshot({ period }),
        profitApi.getPortfolioPnl(12),
        profitApi.getPropertyRankings(period),
        profitApi.getTargetsStatus(),
      ]);
      if (snapR.success) setSnapshot(snapR.data);
      if (pnlR.success)  setPnl(pnlR.data);
      if (rankR.success) setRankings(rankR.data);
      if (targR.success) setTargetsStatus(targR.data);
    } catch { setError('Failed to load overview'); }
    setLoading(false);
  }, [period]);

  const loadExpenses = useCallback(async () => {
    const r = await profitApi.getExpenses();
    if (r.success) setExpenses(r.data);
  }, []);

  const loadReports = useCallback(async () => {
    const r = await profitApi.getReports();
    if (r.success) setReports(r.data);
  }, []);

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'rankings') loadOverview();
    if (activeTab === 'expenses') loadExpenses();
    if (activeTab === 'reports')  loadReports();
  }, [activeTab, period, loadOverview, loadExpenses, loadReports]);

  // Poll for report completion
  useEffect(() => {
    if (!pollId) return;
    pollRef.current = setInterval(async () => {
      const r = await profitApi.getReport(pollId);
      if (r.success && r.data.status !== 'generating') {
        clearInterval(pollRef.current!);
        setPollId(null);
        setGenerating(false);
        setActiveReport(r.data);
        setReports(prev => [r.data, ...prev.filter(x => x.id !== r.data.id)]);
      }
    }, 2500);
    return () => clearInterval(pollRef.current!);
  }, [pollId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    router.replace(`/owner/profit${id !== 'overview' ? `?tab=${id}` : ''}`, { scroll: false });
  };

  const handleRunScenario = async (type: string) => {
    setScenarioLoading(p => ({ ...p, [type]: true }));
    try {
      const r = await profitApi.runWhatIf({ scenario_type: type, params: scenarioParams[type] });
      if (r.success) setScenarios(p => ({ ...p, [type]: r.data }));
    } catch {}
    setScenarioLoading(p => ({ ...p, [type]: false }));
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    const r = await profitApi.generateReport({ period_str: reportPeriod });
    if (r.success) {
      setPollId(r.data.report_id);
    } else {
      setGenerating(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseSubmitting(true);
    const payload = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      property_id: expenseForm.property_id || undefined,
      receipt_url: expenseForm.receipt_url || undefined,
      notes: expenseForm.notes || undefined,
    };
    const r = await profitApi.createExpense(payload);
    if (r.success) {
      setShowExpenseForm(false);
      setExpenseForm({ category: 'utilities', description: '', amount: '', expense_date: '', property_id: '', receipt_url: '', notes: '' });
      loadExpenses();
    }
    setExpenseSubmitting(false);
  };

  const handleDeleteExpense = async (id: string) => {
    await profitApi.deleteExpense(id);
    loadExpenses();
  };

  const handleLoadUnitProfitability = async (propertyId: string) => {
    if (expandedProp === propertyId) { setExpandedProp(null); return; }
    const r = await profitApi.getUnitProfitability(propertyId, period);
    if (r.success) setUnitMap(p => ({ ...p, [propertyId]: r.data }));
    setExpandedProp(propertyId);
  };

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderOverview() {
    if (loading && !snapshot) return <div className="text-center py-16 text-tx-muted">Loading...</div>;
    if (error) return <div className="text-center py-16 text-status-danger">{error}</div>;

    const noi      = snapshot?.net_operating_income ?? 0;
    const prevNoi  = pnl?.months?.[pnl.months.length - 2]?.net_operating_income ?? noi;
    const noiDelta = prevNoi ? (noi - prevNoi) / Math.abs(prevNoi) * 100 : 0;

    // Issues from last generated report (or empty)
    const issues = activeReport?.data?.top_issues ?? [];

    return (
      <div className="space-y-6">
        {/* Hero NOI */}
        <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <p className="text-sm text-tx-muted font-medium uppercase tracking-wide">Net Operating Income</p>
            <p className="text-4xl font-bold text-tx-primary mt-1">{fmt(noi)}</p>
            <p className={`text-sm mt-1 flex items-center gap-1 ${noiDelta >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
              {noiDelta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {pct(noiDelta)} vs last month
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto no-print">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-bg-card text-tx-secondary"
            >
              {(pnl?.months ?? []).map(m => (
                <option key={m.period} value={m.period}>{m.period}</option>
              ))}
            </select>
            <button onClick={loadOverview} className="btn btn-secondary p-2 no-print">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Gross Revenue"   value={fmt(snapshot?.revenue_gross ?? 0)} />
          <StatCard label="Total Expenses"  value={fmt((snapshot?.maintenance_cost ?? 0) + (snapshot?.other_expenses ?? 0))} variant="danger" />
          <StatCard label="Vacancy Loss"    value={fmt(snapshot?.vacancy_loss ?? 0)} variant="warning" />
          <StatCard label="Collection Rate" value={`${(snapshot?.collection_rate ?? 0).toFixed(1)}%`} variant={((snapshot?.collection_rate ?? 0) >= 90) ? 'success' : 'warning'} />
          <StatCard label="Occupancy Rate"  value={`${(snapshot?.occupancy_rate ?? 0).toFixed(1)}%`} variant={((snapshot?.occupancy_rate ?? 0) >= 85) ? 'success' : 'warning'} />
        </div>

        {/* Targets */}
        {targetsStatus.length > 0 && (
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-tx-primary flex items-center gap-2"><Target className="h-5 w-5" /> Targets Progress</h3>
            <div className="space-y-4">
              {targetsStatus.map(t => <TargetBar key={t.id} t={t} />)}
            </div>
          </div>
        )}

        {/* P&L Trend Chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-tx-primary mb-4">Monthly P&L Trend (12 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={pnl?.months ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.revenue} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.revenue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.expenses} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.expenses} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNoi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.noi} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C.noi} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.muted} strokeOpacity={0.3} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Area type="monotone" dataKey="revenue_gross"       name="Revenue"  stroke={C.revenue}  fill="url(#gRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="total_expenses"      name="Expenses" stroke={C.expenses} fill="url(#gExp)" strokeWidth={2} />
              <Area type="monotone" dataKey="net_operating_income" name="NOI"     stroke={C.noi}      fill="url(#gNoi)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Issues */}
        {issues.length > 0 && (
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-tx-primary flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-status-warning" /> Top Issues</h3>
            {issues.map((iss, i) => (
              <IssueCard key={i} issue={iss} onFix={link => router.push(link)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderRankings() {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Rank</th>
                <th className="text-left">Property</th>
                <th className="text-right">Units</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Expenses</th>
                <th className="text-right">NOI</th>
                <th className="text-right">Yield %</th>
                <th className="text-right">Occupancy %</th>
                <th className="text-right">Collection %</th>
                <th className="text-right">vs Last Mo.</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map(r => (
                <>
                  <tr
                    key={r.property_id}
                    className="cursor-pointer hover:bg-bg-hover"
                    onClick={() => handleLoadUnitProfitability(r.property_id)}
                  >
                    <td className="font-bold text-tx-muted">#{r.rank}</td>
                    <td className="font-medium text-tx-primary flex items-center gap-1">
                      {r.property_name}
                      {expandedProp === r.property_id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </td>
                    <td className="text-right">{r.unit_count}</td>
                    <td className="text-right">{fmt(r.revenue_gross)}</td>
                    <td className="text-right text-status-danger">{fmt(r.maintenance_cost)}</td>
                    <td className={`text-right font-semibold ${r.noi >= 0 ? 'text-status-success' : 'text-status-danger'}`}>{fmt(r.noi)}</td>
                    <td className="text-right">{r.yield_pct.toFixed(1)}%</td>
                    <td className="text-right">{r.occupancy_rate.toFixed(1)}%</td>
                    <td className={`text-right ${r.collection_rate >= 80 ? 'text-status-success' : 'text-status-warning'}`}>{r.collection_rate.toFixed(1)}%</td>
                    <td className={`text-right text-sm ${r.vs_last_month_noi_change_pct >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                      {r.vs_last_month_noi_change_pct >= 0 ? '↑' : '↓'}{Math.abs(r.vs_last_month_noi_change_pct).toFixed(1)}%
                    </td>
                  </tr>
                  {expandedProp === r.property_id && unitMap[r.property_id] && (
                    <tr key={`${r.property_id}-units`}>
                      <td colSpan={10} className="bg-bg-hover p-0">
                        <div className="p-4">
                          <table className="table w-full text-xs">
                            <thead>
                              <tr>
                                <th className="text-left">Unit</th>
                                <th className="text-right">Rent</th>
                                <th className="text-right">Collected</th>
                                <th className="text-right">Maintenance</th>
                                <th className="text-right">NOI</th>
                                <th className="text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unitMap[r.property_id].map(u => {
                                const chip = u.recommendation === 'performing well'
                                  ? 'badge-success'
                                  : u.recommendation.includes('maintenance')
                                  ? 'badge-warning'
                                  : 'badge-danger';
                                return (
                                  <tr key={u.unit_id}>
                                    <td className="font-medium">{u.unit_number}</td>
                                    <td className="text-right">{fmt(u.monthly_rent)}</td>
                                    <td className="text-right">{fmt(u.revenue_collected)}</td>
                                    <td className="text-right text-status-danger">{fmt(u.maintenance_cost)}</td>
                                    <td className={`text-right font-semibold ${u.noi >= 0 ? 'text-status-success' : 'text-status-danger'}`}>{fmt(u.noi)}</td>
                                    <td>
                                      <span className={`badge ${chip} capitalize`}>{u.recommendation}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function WhatIfCard({ type, title, description, children }: {
    type: string; title: string; description: string; children: React.ReactNode;
  }) {
    const res = scenarios[type];
    const isLoading = scenarioLoading[type];
    return (
      <div className="card p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-tx-primary">{title}</h3>
          <p className="text-sm text-tx-muted mt-0.5">{description}</p>
        </div>
        {children}
        <button
          onClick={() => handleRunScenario(type)}
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? 'Running...' : 'Run Scenario'}
        </button>
        {res && (
          <div className="bg-bg-hover rounded-lg p-4 space-y-2">
            {Object.entries(res.result).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-tx-muted capitalize">{k.replace(/_/g, ' ')}</span>
                <span className={`font-semibold ${(v as number) >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                  {typeof v === 'number' ? fmt(v) : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderWhatIf() {
    const sp = scenarioParams;
    const set = (type: string, key: string, val: any) =>
      setScenarioParams(p => ({ ...p, [type]: { ...p[type], [key]: val } }));

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <WhatIfCard type="rent_increase" title="Rent Increase" description="Model the revenue impact of raising rents across a property.">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-tx-muted">Increase %</span>
              <input type="range" min={1} max={25} value={sp.rent_increase.increase_pct}
                onChange={e => set('rent_increase', 'increase_pct', Number(e.target.value))}
                className="w-full mt-1"
              />
              <span className="text-sm font-semibold text-tx-primary">{sp.rent_increase.increase_pct}%</span>
            </label>
          </div>
        </WhatIfCard>

        <WhatIfCard type="fill_vacancy" title="Fill Vacancy" description="Estimate gain from filling a vacant unit at a given rent.">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-tx-muted">Estimated Monthly Rent (KES)</span>
              <input type="number" value={sp.fill_vacancy.estimated_rent}
                onChange={e => set('fill_vacancy', 'estimated_rent', Number(e.target.value))}
                className="w-full mt-1 border border-border rounded-lg px-3 py-1.5 bg-bg-card text-tx-primary text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-tx-muted">Fit-Out Cost (KES, optional)</span>
              <input type="number" value={sp.fill_vacancy.fitout_cost ?? ''}
                onChange={e => set('fill_vacancy', 'fitout_cost', Number(e.target.value) || undefined)}
                className="w-full mt-1 border border-border rounded-lg px-3 py-1.5 bg-bg-card text-tx-primary text-sm"
              />
            </label>
          </div>
        </WhatIfCard>

        <WhatIfCard type="reduce_maintenance" title="Reduce Maintenance" description="Model savings from cutting maintenance costs by a given percentage.">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-tx-muted">Reduction %</span>
              <input type="range" min={5} max={50} value={sp.reduce_maintenance.reduction_pct}
                onChange={e => set('reduce_maintenance', 'reduction_pct', Number(e.target.value))}
                className="w-full mt-1"
              />
              <span className="text-sm font-semibold text-tx-primary">{sp.reduce_maintenance.reduction_pct}%</span>
            </label>
          </div>
        </WhatIfCard>

        <WhatIfCard type="expense_category_shift" title="Expense Budget Shift" description="Set a new monthly budget for an expense category and see the NOI impact.">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-tx-muted">Category</span>
              <select value={sp.expense_category_shift.category}
                onChange={e => set('expense_category_shift', 'category', e.target.value)}
                className="w-full mt-1 border border-border rounded-lg px-3 py-1.5 bg-bg-card text-tx-secondary text-sm"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-tx-muted">New Monthly Budget (KES)</span>
              <input type="number" value={sp.expense_category_shift.new_budget}
                onChange={e => set('expense_category_shift', 'new_budget', Number(e.target.value))}
                className="w-full mt-1 border border-border rounded-lg px-3 py-1.5 bg-bg-card text-tx-primary text-sm"
              />
            </label>
          </div>
        </WhatIfCard>
      </div>
    );
  }

  function renderExpenses() {
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });
    const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <h3 className="font-semibold text-tx-primary">Expense Records</h3>
          <button onClick={() => setShowExpenseForm(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-4">
            <h4 className="text-sm font-medium text-tx-secondary mb-3">By Category</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={C.PIE[i % C.PIE.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-4">
            <h4 className="text-sm font-medium text-tx-secondary mb-3">Monthly Trend</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pnl?.months?.slice(-6) ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.muted} strokeOpacity={0.3} />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total_expenses" name="Expenses" fill={C.expenses} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Date</th>
                <th className="text-left">Property</th>
                <th className="text-left">Category</th>
                <th className="text-left">Description</th>
                <th className="text-right">Amount</th>
                <th className="text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td className="text-tx-muted">{e.expense_date}</td>
                  <td>{e.property_name ?? '—'}</td>
                  <td><span className="badge badge-secondary capitalize">{e.category.replace('_',' ')}</span></td>
                  <td className="text-tx-secondary">{e.description}</td>
                  <td className="text-right font-semibold text-status-danger">{fmt(e.amount)}</td>
                  <td className="text-center no-print">
                    <button onClick={() => handleDeleteExpense(e.id)} className="text-status-danger hover:opacity-70">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={6} className="text-center text-tx-muted py-8">No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Expense Modal */}
        {showExpenseForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-bg-card rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="font-semibold text-tx-primary mb-4">Add Expense</h3>
              <form onSubmit={handleCreateExpense} className="space-y-3">
                <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-bg-card text-tx-secondary text-sm">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
                <input required placeholder="Description" value={expenseForm.description}
                  onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-bg-card text-tx-primary text-sm" />
                <input required type="number" placeholder="Amount (KES)" value={expenseForm.amount}
                  onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-bg-card text-tx-primary text-sm" />
                <input required type="date" value={expenseForm.expense_date}
                  onChange={e => setExpenseForm(p => ({ ...p, expense_date: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-bg-card text-tx-primary text-sm" />
                <input placeholder="Receipt URL (optional)" value={expenseForm.receipt_url}
                  onChange={e => setExpenseForm(p => ({ ...p, receipt_url: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 bg-bg-card text-tx-primary text-sm" />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowExpenseForm(false)} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={expenseSubmitting} className="btn btn-primary flex-1">
                    {expenseSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderReports() {
    return (
      <div className="space-y-6">
        {/* Generator */}
        <div className="card p-5 space-y-4 no-print">
          <h3 className="font-semibold text-tx-primary">Generate Monthly Report</h3>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={reportPeriod}
              onChange={e => setReportPeriod(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 bg-bg-card text-tx-secondary text-sm"
            />
            <button onClick={handleGenerateReport} disabled={generating} className="btn btn-primary flex items-center gap-2">
              {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</> : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Active Report */}
        {activeReport?.data && (
          <div className="card p-6 space-y-8" data-print-report>
            {/* Print button */}
            <div className="flex justify-end no-print">
              <button onClick={() => window.print()} className="btn btn-secondary flex items-center gap-2">
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
            </div>

            {/* Cover */}
            <div className="text-center border-b pb-6">
              <h1 className="text-2xl font-bold text-tx-primary">PROPERTECH Financial Report</h1>
              <p className="text-tx-muted mt-1">{activeReport.data.cover.owner_name} · {activeReport.data.cover.period}</p>
              <p className="text-xs text-tx-muted">Generated {new Date(activeReport.data.cover.generated_at).toLocaleString()}</p>
            </div>

            {/* Executive Summary */}
            <div>
              <h2 className="text-lg font-semibold text-tx-primary mb-4">Executive Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(activeReport.data.executive_summary).map(([k, v]) => (
                  <div key={k} className="bg-bg-hover rounded-lg p-3">
                    <p className="text-xs text-tx-muted capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className={`text-lg font-bold ${(Number(v) ?? 0) < 0 ? 'text-status-danger' : 'text-tx-primary'}`}>
                      {typeof v === 'number' ? (k.includes('rate') || k.includes('pct') || k.includes('pts') ? `${v.toFixed(1)}%` : fmt(v)) : v}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {activeReport.data.recommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-tx-primary mb-3">Recommendations</h2>
                <ol className="space-y-2">
                  {activeReport.data.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-tx-secondary">
                      <span className="font-bold text-tx-primary">{i + 1}.</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Top Issues */}
            {activeReport.data.top_issues.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-tx-primary mb-3">Top Issues</h2>
                <div className="space-y-2">
                  {activeReport.data.top_issues.map((iss, i) => (
                    <IssueCard key={i} issue={iss} onFix={link => router.push(link)} />
                  ))}
                </div>
              </div>
            )}

            {/* Property Rankings */}
            <div>
              <h2 className="text-lg font-semibold text-tx-primary mb-3">Property Rankings</h2>
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Rank</th>
                      <th className="text-left">Property</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">NOI</th>
                      <th className="text-right">Occupancy</th>
                      <th className="text-right">Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReport.data.property_rankings.map(r => (
                      <tr key={r.property_id}>
                        <td>#{r.rank}</td>
                        <td className="font-medium">{r.property_name}</td>
                        <td className="text-right">{fmt(r.revenue_gross)}</td>
                        <td className={`text-right font-semibold ${r.noi >= 0 ? 'text-status-success' : 'text-status-danger'}`}>{fmt(r.noi)}</td>
                        <td className="text-right">{r.occupancy_rate.toFixed(1)}%</td>
                        <td className={`text-right ${r.collection_rate >= 80 ? 'text-status-success' : 'text-status-warning'}`}>{r.collection_rate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Saved Reports */}
        <div className="card p-5">
          <h3 className="font-semibold text-tx-primary mb-4">Saved Reports</h3>
          {reports.length === 0 ? (
            <p className="text-tx-muted text-sm">No reports generated yet.</p>
          ) : (
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Period</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Generated</th>
                  <th className="text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.report_period}</td>
                    <td className="capitalize">{r.report_type}</td>
                    <td>
                      <span className={`badge ${r.status === 'complete' ? 'badge-success' : r.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-tx-muted">{r.generated_at ? new Date(r.generated_at).toLocaleDateString() : '—'}</td>
                    <td className="text-center no-print">
                      {r.status === 'complete' && (
                        <button
                          onClick={async () => { const res = await profitApi.getReport(r.id); if (res.success) setActiveReport(res.data); }}
                          className="btn btn-secondary text-xs flex items-center gap-1 mx-auto"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── Tab content map ───────────────────────────────────────────────────────────

  const tabContent: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    rankings: renderRankings,
    whatif:   renderWhatIf,
    expenses: renderExpenses,
    reports:  renderReports,
  };

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="page-header no-print">
        <div>
          <h1 className="text-2xl font-bold text-tx-primary flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-status-success" />
            Profit Engine
          </h1>
          <p className="text-tx-muted text-sm mt-0.5">Portfolio financial intelligence — P&L, rankings, what-if scenarios</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-bg-hover rounded-xl p-1 w-fit no-print">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-bg-card shadow text-tx-primary'
                  : 'text-tx-muted hover:text-tx-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>{tabContent[activeTab]()}</div>
    </div>
  );
}
