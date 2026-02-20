'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { mpesaApi } from '@/app/lib/api-services';
import {
  Smartphone, CheckCircle, AlertTriangle, Clock, XCircle,
  TrendingUp, DollarSign, Bell, RefreshCw, ChevronRight,
  ArrowUpRight, MoreHorizontal, Phone
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentStatusRow {
  tenant_id: string;
  tenant_name: string;
  unit_number: string | null;
  property_name: string | null;
  expected_rent: number;
  amount_collected: number;
  payment_status: 'paid' | 'partial' | 'overdue' | 'pending';
  days_overdue: number;
  last_payment_date: string | null;
}

interface UnmatchedTransaction {
  id: string;
  mpesa_receipt_number: string;
  phone_number: string;
  amount: number;
  account_reference: string | null;
  transaction_date: string;
  reconciliation_status: string;
  reconciliation_confidence: number;
  tenant_name: string | null;
  unit_number: string | null;
}

interface ActivityItem {
  type: 'payment' | 'reminder';
  timestamp: string;
  title: string;
  subtitle: string;
  status: string;
}

interface DashboardData {
  month: string;
  collection_rate_pct: number;
  total_collected_kes: number;
  unmatched_count: number;
  reminders_sent_this_month: number;
  payment_status_board: PaymentStatusRow[];
  unmatched_transactions: UnmatchedTransaction[];
  recent_activity: ActivityItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-KE').format(Math.round(n));
}

function statusBadge(status: string, days: number) {
  switch (status) {
    case 'paid':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" /> Paid
        </span>
      );
    case 'partial':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> Partial
        </span>
      );
    case 'overdue':
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> {days}d overdue
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
}

function rowBg(status: string) {
  if (status === 'paid') return 'bg-emerald-50/40';
  if (status === 'partial') return 'bg-amber-50/40';
  if (status === 'overdue') return 'bg-red-50/40';
  return '';
}

// ── Match Modal ───────────────────────────────────────────────────────────────

function MatchModal({
  transaction,
  onClose,
  onMatched,
}: {
  transaction: UnmatchedTransaction;
  onClose: () => void;
  onMatched: () => void;
}) {
  const [tenantId, setTenantId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleMatch() {
    if (!tenantId || !unitId || !propertyId) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const res = await mpesaApi.matchTransaction(transaction.id, {
      tenant_id: tenantId,
      unit_id: unitId,
      property_id: propertyId,
    });
    setLoading(false);
    if (res.success) {
      onMatched();
      onClose();
    } else {
      setError(res.error || 'Match failed');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Match Transaction</h3>
        <p className="text-sm text-slate-500 mb-4">
          Receipt <strong>{transaction.mpesa_receipt_number}</strong> · KES {fmt(transaction.amount)} from {transaction.phone_number}
        </p>

        {transaction.reconciliation_confidence > 0 && transaction.tenant_name && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Suggested:</strong> {transaction.tenant_name} (confidence {transaction.reconciliation_confidence}%)
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tenant ID</label>
            <input
              type="text"
              placeholder="UUID of tenant"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Unit ID</label>
            <input
              type="text"
              placeholder="UUID of unit"
              value={unitId}
              onChange={e => setUnitId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Property ID</label>
            <input
              type="text"
              placeholder="UUID of property"
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMatch}
            disabled={loading}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Matching…' : 'Confirm Match'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MpesaDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchingTxn, setMatchingTxn] = useState<UnmatchedTransaction | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await mpesaApi.getDashboard();
    setLoading(false);
    if (res.success) {
      setData(res.data);
    } else {
      setError(res.error || 'Failed to load dashboard');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSTKPush(tenantId: string, name: string) {
    setSending(tenantId);
    const res = await mpesaApi.stkPush({ tenant_id: tenantId });
    setSending(null);
    if (res.success) {
      alert(`✅ STK Push sent to ${name}. They should receive a prompt on their phone.`);
    } else {
      alert(`❌ STK Push failed: ${res.error}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading Mpesa dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <Smartphone className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-800 mb-1">Mpesa Not Configured</h3>
          <p className="text-amber-700 text-sm mb-4">
            {error || 'Set up your Mpesa credentials to start collecting payments intelligently.'}
          </p>
          <Link
            href="/owner/mpesa/settings"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700"
          >
            <Smartphone className="w-4 h-4" /> Configure Mpesa
          </Link>
        </div>
      </div>
    );
  }

  const monthLabel = new Date(data.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-green-600" />
            Mpesa Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{monthLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link
            href="/owner/mpesa/settings"
            className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 font-medium">Collection Rate</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.collection_rate_pct.toFixed(0)}%</p>
          <p className="text-xs text-slate-400 mt-1">{monthLabel}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 font-medium">Total Collected</p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">KES {fmt(data.total_collected_kes)}</p>
          <p className="text-xs text-slate-400 mt-1">This month</p>
        </div>

        <div className={`bg-white rounded-2xl border shadow-sm p-4 ${data.unmatched_count > 0 ? 'border-red-200' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 font-medium">Unmatched Txns</p>
            <AlertTriangle className={`w-4 h-4 ${data.unmatched_count > 0 ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
          <p className={`text-3xl font-bold ${data.unmatched_count > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {data.unmatched_count}
          </p>
          <Link href="/owner/mpesa/transactions?status=unmatched" className="text-xs text-red-500 mt-1 hover:underline flex items-center gap-0.5">
            Resolve <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 font-medium">Reminders Sent</p>
            <Bell className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{data.reminders_sent_this_month}</p>
          <Link href="/owner/mpesa/reminders" className="text-xs text-blue-500 mt-1 hover:underline flex items-center gap-0.5">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Payment Status Board */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Payment Status Board</h2>
            <span className="text-xs text-slate-400">{data.payment_status_board.length} tenants</span>
          </div>

          {data.payment_status_board.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No active tenants found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-50">
                    <th className="px-4 py-3 text-left font-medium">Tenant</th>
                    <th className="px-4 py-3 text-left font-medium">Unit</th>
                    <th className="px-4 py-3 text-right font-medium">Expected</th>
                    <th className="px-4 py-3 text-right font-medium">Collected</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.payment_status_board.map((row) => (
                    <tr key={row.tenant_id} className={`${rowBg(row.payment_status)} hover:bg-slate-50/60 transition-colors`}>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.tenant_name}</td>
                      <td className="px-4 py-3 text-slate-500">{row.unit_number || '—'}</td>
                      <td className="px-4 py-3 text-right text-slate-600">KES {fmt(row.expected_rent)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        KES {fmt(row.amount_collected)}
                      </td>
                      <td className="px-4 py-3">{statusBadge(row.payment_status, row.days_overdue)}</td>
                      <td className="px-4 py-3 text-right">
                        {row.payment_status !== 'paid' && (
                          <button
                            onClick={() => handleSTKPush(row.tenant_id, row.tenant_name)}
                            disabled={sending === row.tenant_id}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-40 ml-auto"
                          >
                            <Phone className="w-3 h-3" />
                            {sending === row.tenant_id ? 'Sending…' : 'STK Push'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {data.recent_activity.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No activity yet.</div>
            ) : (
              data.recent_activity.map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.type === 'payment' ? 'bg-emerald-100' : 'bg-blue-100'
                  }`}>
                    {item.type === 'payment'
                      ? <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      : <Bell className="w-3.5 h-3.5 text-blue-600" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Unmatched Transactions Panel */}
      {data.unmatched_transactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-red-50 flex items-center justify-between bg-red-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-red-800">Unmatched Transactions</h2>
              <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {data.unmatched_count}
              </span>
            </div>
            <Link
              href="/owner/mpesa/transactions?status=unmatched"
              className="text-xs text-red-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-50">
                  <th className="px-4 py-3 text-left font-medium">Receipt</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Ref</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Confidence</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.unmatched_transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{txn.mpesa_receipt_number}</td>
                    <td className="px-4 py-3 text-slate-600">{txn.phone_number}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">KES {fmt(txn.amount)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{txn.account_reference || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(txn.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {txn.tenant_name ? (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          ~{txn.tenant_name} ({txn.reconciliation_confidence}%)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No suggestion</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setMatchingTxn(txn)}
                        className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 font-medium"
                      >
                        Match Manually
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/owner/mpesa/transactions', label: 'All Transactions', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { href: '/owner/mpesa/reminders', label: 'Reminders', icon: Bell, color: 'text-blue-600 bg-blue-50' },
          { href: '/owner/mpesa/analytics', label: 'Analytics', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          { href: '/owner/mpesa/settings', label: 'Mpesa Settings', icon: Smartphone, color: 'text-slate-600 bg-slate-100' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-shadow"
          >
            <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Match Modal */}
      {matchingTxn && (
        <MatchModal
          transaction={matchingTxn}
          onClose={() => setMatchingTxn(null)}
          onMatched={load}
        />
      )}
    </div>
  );
}
