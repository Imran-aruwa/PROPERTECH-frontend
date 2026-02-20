'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { mpesaApi } from '@/app/lib/api-services';
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock,
  Upload, Phone, Download, Filter, RefreshCw, Search, Eye,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  mpesa_receipt_number: string;
  phone_number: string;
  amount: number;
  account_reference: string | null;
  transaction_date: string;
  transaction_type: string;
  reconciliation_status: string;
  reconciliation_confidence: number;
  tenant_name: string | null;
  unit_number: string | null;
  property_name: string | null;
  matched_payment_id: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-KE').format(Math.round(n));
}

const STATUS_COLORS: Record<string, string> = {
  matched: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  unmatched: 'text-red-700 bg-red-50 border-red-200',
  partial: 'text-amber-700 bg-amber-50 border-amber-200',
  duplicate: 'text-slate-600 bg-slate-100 border-slate-200',
  disputed: 'text-purple-700 bg-purple-50 border-purple-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || 'text-slate-600 bg-slate-100 border-slate-200';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Match Modal ───────────────────────────────────────────────────────────────

function MatchModal({
  txn,
  onClose,
  onDone,
}: {
  txn: Transaction;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tenantId, setTenantId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!tenantId || !unitId || !propertyId) { setError('All fields required'); return; }
    setLoading(true);
    const res = await mpesaApi.matchTransaction(txn.id, { tenant_id: tenantId, unit_id: unitId, property_id: propertyId });
    setLoading(false);
    if (res.success) { onDone(); onClose(); }
    else setError(res.error || 'Failed');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Match Transaction</h3>
        <p className="text-xs text-slate-500 mb-4">
          {txn.mpesa_receipt_number} · KES {fmt(txn.amount)} · {txn.phone_number}
        </p>
        {txn.tenant_name && (
          <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            Suggestion: <strong>{txn.tenant_name}</strong> ({txn.reconciliation_confidence}% confidence)
          </div>
        )}
        <div className="space-y-2.5">
          {[
            { label: 'Tenant ID (UUID)', val: tenantId, set: setTenantId },
            { label: 'Unit ID (UUID)', val: unitId, set: setUnitId },
            { label: 'Property ID (UUID)', val: propertyId, set: setPropertyId },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-slate-500 mb-1 block">{f.label}</label>
              <input type="text" value={f.val} onChange={e => f.set(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
            {loading ? 'Matching…' : 'Match'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dispute Modal ─────────────────────────────────────────────────────────────

function DisputeModal({ txn, onClose, onDone }: { txn: Transaction; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason) return;
    setLoading(true);
    await mpesaApi.disputeTransaction(txn.id, reason);
    setLoading(false);
    onDone(); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Flag as Disputed</h3>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Reason for dispute…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={loading || !reason}
            className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-60">
            {loading ? 'Flagging…' : 'Flag'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── STK Modal ─────────────────────────────────────────────────────────────────

function STKModal({ onClose }: { onClose: () => void }) {
  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit() {
    if (!tenantId) return;
    setLoading(true);
    const res = await mpesaApi.stkPush({ tenant_id: tenantId, amount: amount ? parseInt(amount) : undefined });
    setLoading(false);
    if (res.success) setMsg('✅ STK Push sent! Tenant should see a payment prompt.');
    else setMsg(`❌ ${res.error}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Send STK Push</h3>
        {msg ? (
          <>
            <p className="text-sm my-3">{msg}</p>
            <button onClick={onClose} className="w-full py-2 bg-slate-800 text-white rounded-xl text-sm">Close</button>
          </>
        ) : (
          <>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Tenant ID</label>
                <input type="text" value={tenantId} onChange={e => setTenantId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Amount (KES) — leave blank for rent amount</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={submit} disabled={loading || !tenantId}
                className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                {loading ? 'Sending…' : 'Send Push'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MpesaTransactionsPage() {
  const searchParams = useSearchParams();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const [matchingTxn, setMatchingTxn] = useState<Transaction | null>(null);
  const [disputingTxn, setDisputingTxn] = useState<Transaction | null>(null);
  const [showSTK, setShowSTK] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await mpesaApi.listTransactions({
      reconciliation_status: statusFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      skip: page * limit,
      limit,
    });
    setLoading(false);
    if (res.success) {
      setTxns(res.data.transactions || []);
      setTotal(res.data.total || 0);
      setUnmatchedCount(res.data.unmatched_count || 0);
      setMatchedCount(res.data.matched_count || 0);
    }
  }, [statusFilter, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const res = await mpesaApi.importCsv(file);
    setImporting(false);
    if (res.success) {
      const d = res.data;
      alert(`✅ Import complete!\nImported: ${d.imported}\nSkipped duplicates: ${d.skipped_duplicates}${d.errors?.length ? `\nErrors: ${d.errors.length}` : ''}`);
      load();
    } else {
      alert(`❌ Import failed: ${res.error}`);
    }
    e.target.value = '';
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/owner/mpesa" className="p-2 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mpesa Transactions</h1>
          <p className="text-sm text-slate-400">{total} total · {unmatchedCount} unmatched</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          <button
            onClick={() => setShowSTK(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
          >
            <Phone className="w-4 h-4" /> STK Push
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Status</label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All</option>
            <option value="unmatched">Unmatched</option>
            <option value="matched">Matched</option>
            <option value="partial">Partial</option>
            <option value="duplicate">Duplicate</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">From</label>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">To</label>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button onClick={load} className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : txns.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-50 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-medium">Receipt</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Account Ref</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Matched To</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {txns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{t.mpesa_receipt_number}</td>
                    <td className="px-4 py-3 text-slate-600">{t.phone_number}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">KES {fmt(t.amount)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">{t.account_reference || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(t.transaction_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.reconciliation_status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {t.tenant_name ? (
                        <span>{t.tenant_name}{t.unit_number ? ` · ${t.unit_number}` : ''}</span>
                      ) : t.reconciliation_confidence > 0 ? (
                        <span className="text-amber-600">~{t.reconciliation_confidence}% confident</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        {t.reconciliation_status === 'unmatched' && (
                          <button onClick={() => setMatchingTxn(t)}
                            className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded-lg hover:bg-slate-700">
                            Match
                          </button>
                        )}
                        {!['disputed', 'duplicate'].includes(t.reconciliation_status) && (
                          <button onClick={() => setDisputingTxn(t)}
                            className="text-xs border border-purple-200 text-purple-600 px-2.5 py-1 rounded-lg hover:bg-purple-50">
                            Dispute
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between text-sm text-slate-500">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {matchingTxn && <MatchModal txn={matchingTxn} onClose={() => setMatchingTxn(null)} onDone={load} />}
      {disputingTxn && <DisputeModal txn={disputingTxn} onClose={() => setDisputingTxn(null)} onDone={load} />}
      {showSTK && <STKModal onClose={() => setShowSTK(false)} />}
    </div>
  );
}
