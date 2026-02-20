'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { mpesaApi } from '@/app/lib/api-services';
import {
  ArrowLeft, TrendingUp, Clock, AlertTriangle, RefreshCw,
  BarChart3, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CollectionRate {
  month: string;
  expected_count: number;
  paid_count: number;
  partial_count: number;
  unpaid_count: number;
  collection_rate_pct: number;
  total_expected_kes: number;
  total_collected_kes: number;
  by_property: Array<{
    property_id: string;
    property_name: string;
    tenant_count: number;
    paid_count: number;
    expected_kes: number;
    collected_kes: number;
    rate_pct: number;
  }>;
}

interface PaymentTiming {
  month: string;
  distribution: Record<string, number>;
  avg_payment_day: number | null;
  on_time_pct: number;
  total_payments: number;
}

interface RiskTenant {
  tenant_id: string;
  tenant_name: string;
  unit_number: string | null;
  property_name: string | null;
  consecutive_late_months: number;
  total_overdue_kes: number;
  last_payment_date: string | null;
  risk_level: 'medium' | 'high' | 'critical';
}

interface RiskData {
  flagged_tenants: RiskTenant[];
  total_at_risk_kes: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-KE').format(Math.round(n));
}

function prevMonth(m: string): string {
  const d = new Date(m + '-01');
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}
function nextMonth(m: string): string {
  const d = new Date(m + '-01');
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7);
}
function monthLabel(m: string): string {
  return new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
}

const RISK_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
};

// ── Mini bar chart for payment timing ─────────────────────────────────────────

function TimingChart({ distribution }: { distribution: Record<string, number> }) {
  const maxVal = Math.max(...Object.values(distribution), 1);
  // Days 1-31
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  return (
    <div className="mt-4">
      <div className="flex items-end gap-0.5 h-20">
        {days.map(d => {
          const count = distribution[d] || 0;
          const h = Math.round((count / maxVal) * 80);
          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div
                className={`w-full rounded-t ${d <= '10' ? 'bg-emerald-400' : count > 0 ? 'bg-amber-400' : 'bg-slate-100'}`}
                style={{ height: `${Math.max(h, count > 0 ? 4 : 0)}px` }}
                title={`Day ${d}: ${count} payments`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
        <span>1</span>
        <span className="text-emerald-600 font-medium">Day 10</span>
        <span>31</span>
      </div>
      <div className="flex gap-3 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block"/> On time (≤ day 10)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block"/> Late</span>
      </div>
    </div>
  );
}

// ── Collection Donut ──────────────────────────────────────────────────────────

function CollectionDonut({ paid, partial, unpaid }: { paid: number; partial: number; unpaid: number }) {
  const total = paid + partial + unpaid;
  if (total === 0) return <div className="w-32 h-32 rounded-full bg-slate-100 mx-auto" />;

  const paidPct = (paid / total) * 100;
  const partialPct = (partial / total) * 100;
  const unpaidPct = (unpaid / total) * 100;

  // Build conic-gradient
  const gradient = `conic-gradient(
    #10b981 0% ${paidPct}%,
    #f59e0b ${paidPct}% ${paidPct + partialPct}%,
    #f1f5f9 ${paidPct + partialPct}% 100%
  )`;

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center"
        style={{ background: gradient }}
      >
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{Math.round(paidPct)}%</span>
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1 text-emerald-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Paid ({paid})
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Partial ({partial})
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> Unpaid ({unpaid})
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MpesaAnalyticsPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [collectionRate, setCollectionRate] = useState<CollectionRate | null>(null);
  const [timing, setTiming] = useState<PaymentTiming | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [crRes, tmRes, riskRes] = await Promise.all([
      mpesaApi.getCollectionRate(currentMonth),
      mpesaApi.getPaymentTiming(currentMonth),
      mpesaApi.getRisk(),
    ]);
    setLoading(false);
    if (crRes.success) setCollectionRate(crRes.data);
    if (tmRes.success) setTiming(tmRes.data);
    if (riskRes.success) setRisk(riskRes.data);
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  const isCurrentMonth = currentMonth === new Date().toISOString().slice(0, 7);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/owner/mpesa" className="p-2 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payment Analytics</h1>
          <p className="text-sm text-slate-400">Collection intelligence & risk overview</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Month navigation */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
            <button onClick={() => setCurrentMonth(prevMonth(currentMonth))} className="p-1 hover:bg-slate-50 rounded-lg">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-medium text-slate-700 px-2">{monthLabel(currentMonth)}</span>
            <button
              onClick={() => setCurrentMonth(nextMonth(currentMonth))}
              disabled={isCurrentMonth}
              className="p-1 hover:bg-slate-50 rounded-lg disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-400">Loading analytics…</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Collection Rate ── */}
          {collectionRate && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h2 className="font-semibold text-slate-800">Collection Rate — {monthLabel(currentMonth)}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <CollectionDonut
                  paid={collectionRate.paid_count}
                  partial={collectionRate.partial_count}
                  unpaid={collectionRate.unpaid_count}
                />

                <div className="space-y-3">
                  {[
                    { label: 'Total Expected', value: `KES ${fmt(collectionRate.total_expected_kes)}`, cls: 'text-slate-800' },
                    { label: 'Total Collected', value: `KES ${fmt(collectionRate.total_collected_kes)}`, cls: 'text-emerald-600 font-semibold' },
                    { label: 'Collection Rate', value: `${collectionRate.collection_rate_pct}%`, cls: 'text-slate-800 font-semibold text-lg' },
                    { label: 'Fully Paid Tenants', value: `${collectionRate.paid_count} / ${collectionRate.expected_count}`, cls: 'text-slate-600' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-sm text-slate-500">{r.label}</span>
                      <span className={`text-sm ${r.cls}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-property breakdown */}
              {collectionRate.by_property.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-slate-500 mb-3">By Property</p>
                  <div className="space-y-2">
                    {collectionRate.by_property.map(p => (
                      <div key={p.property_id} className="flex items-center gap-3">
                        <span className="text-sm text-slate-700 w-32 truncate">{p.property_name}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, p.rate_pct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-24 text-right">
                          {p.paid_count}/{p.tenant_count} · {Math.round(p.rate_pct)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Payment Timing ── */}
          {timing && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-slate-800">Payment Timing Distribution</h2>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {timing.total_payments} payments recorded — avg on day {timing.avg_payment_day ?? '—'} · {timing.on_time_pct}% on time
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total Payments', value: String(timing.total_payments) },
                  { label: 'Avg Payment Day', value: timing.avg_payment_day != null ? `Day ${timing.avg_payment_day}` : '—' },
                  { label: 'On Time (≤ Day 10)', value: `${timing.on_time_pct}%` },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-0.5">{s.label}</p>
                    <p className="text-lg font-bold text-slate-800">{s.value}</p>
                  </div>
                ))}
              </div>

              <TimingChart distribution={timing.distribution} />
            </div>
          )}

          {/* ── Risk Tenants ── */}
          {risk && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h2 className="font-semibold text-slate-800">Payment Risk Tenants</h2>
                  {risk.flagged_tenants.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {risk.flagged_tenants.length}
                    </span>
                  )}
                </div>
                {risk.total_at_risk_kes > 0 && (
                  <span className="text-sm font-medium text-red-600">KES {fmt(risk.total_at_risk_kes)} at risk</span>
                )}
              </div>

              {risk.flagged_tenants.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No payment risks detected. All tenants are in good standing.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-50 bg-slate-50/50">
                        <th className="px-4 py-3 text-left font-medium">Tenant</th>
                        <th className="px-4 py-3 text-left font-medium">Unit</th>
                        <th className="px-4 py-3 text-left font-medium">Risk</th>
                        <th className="px-4 py-3 text-center font-medium">Late Months</th>
                        <th className="px-4 py-3 text-right font-medium">Overdue</th>
                        <th className="px-4 py-3 text-left font-medium">Last Paid</th>
                        <th className="px-4 py-3 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {risk.flagged_tenants.map(t => (
                        <tr key={t.tenant_id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{t.tenant_name}</p>
                            {t.property_name && <p className="text-xs text-slate-400">{t.property_name}</p>}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{t.unit_number || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${RISK_COLORS[t.risk_level]}`}>
                              {t.risk_level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-red-600">{t.consecutive_late_months}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">
                            KES {fmt(t.total_overdue_kes)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {t.last_payment_date
                              ? new Date(t.last_payment_date).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/owner/mpesa/transactions?tenant_id=${t.tenant_id}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View History
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
