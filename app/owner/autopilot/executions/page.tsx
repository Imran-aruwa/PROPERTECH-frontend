'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, Clock, AlertCircle, RotateCcw,
  RefreshCw, ChevronDown, ChevronRight, Filter, Download,
} from 'lucide-react';
import { automationExecutionsApi } from '@/app/lib/api/automation';
import { AutomationExecution, ExecutionStatus } from '@/types/automation';

const STATUS_OPTIONS: ExecutionStatus[] = [
  'completed', 'failed', 'running', 'pending', 'rolled_back', 'awaiting_approval',
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  completed:         { label: 'Completed',       icon: <CheckCircle className="w-4 h-4" />,  color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  failed:            { label: 'Failed',          icon: <XCircle className="w-4 h-4" />,      color: 'text-red-600',   bg: 'bg-red-100 dark:bg-red-900/30' },
  rolled_back:       { label: 'Rolled Back',     icon: <RotateCcw className="w-4 h-4" />,    color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-700' },
  awaiting_approval: { label: 'Needs Approval',  icon: <AlertCircle className="w-4 h-4" />,  color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  running:           { label: 'Running',         icon: <RefreshCw className="w-4 h-4 animate-spin" />, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  pending:           { label: 'Pending',         icon: <Clock className="w-4 h-4" />,         color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' },
};

function formatEvent(e: string) { return e.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}
function duration(start: string, end: string | null) {
  if (!end) return '—';
  const s = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${(s / 60).toFixed(1)}m`;
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const PAGE = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await automationExecutionsApi.list({
      status: statusFilter || undefined,
      trigger_event: eventFilter || undefined,
      limit: PAGE,
      offset,
    });
    if (res.success) setExecutions(res.data!);
    setLoading(false);
  }, [statusFilter, eventFilter, offset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRollback = async (id: string) => {
    if (!confirm('Rollback this execution? Reversible actions will be undone.')) return;
    await automationExecutionsApi.rollback(id);
    fetchData();
  };

  const handleBulkRollback = async () => {
    if (!confirm(`Rollback ${selectedIds.size} executions?`)) return;
    for (const id of selectedIds) {
      await automationExecutionsApi.rollback(id);
    }
    setSelectedIds(new Set());
    fetchData();
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Trigger Event', 'Status', 'Started At', 'Duration', 'Actions'],
      ...executions.map(e => [
        e.id, e.trigger_event, e.status, e.started_at,
        duration(e.started_at, e.completed_at),
        String(e.actions_taken?.length || 0),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = `autopilot-executions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-4 bg-bg-secondary min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-tx-primary">Execution History</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkRollback}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded-lg text-sm hover:bg-amber-200 transition-colors">
              <RotateCcw className="w-4 h-4" /> Rollback {selectedIds.size}
            </button>
          )}
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-bg-card border border-bd text-tx-secondary rounded-lg text-sm hover:bg-bg-hover transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-bg-card border border-bd rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-tx-muted" />
          <select
            className="text-sm bg-transparent text-tx-primary outline-none"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setOffset(0); }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
          </select>
        </div>
        <input
          className="border border-bd rounded-lg px-3 py-2 text-sm bg-bg-card text-tx-primary w-48 placeholder:text-tx-muted outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Filter by event..."
          value={eventFilter}
          onChange={e => { setEventFilter(e.target.value); setOffset(0); }}
        />
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-bd rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : executions.length === 0 ? (
          <div className="p-12 text-center text-tx-muted text-sm">
            No executions found with current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary border-b border-bd">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox"
                      checked={selectedIds.size === executions.length}
                      onChange={e => setSelectedIds(e.target.checked ? new Set(executions.map(ex => ex.id)) : new Set())}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tx-muted uppercase tracking-wide">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tx-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tx-muted uppercase tracking-wide">Actions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tx-muted uppercase tracking-wide">Started</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tx-muted uppercase tracking-wide">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-tx-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd">
                {executions.map(exec => {
                  const sc = STATUS_CONFIG[exec.status] || STATUS_CONFIG.pending;
                  const isExpanded = expandedId === exec.id;
                  const canRollback = exec.status === 'completed' &&
                    (exec.actions_taken || []).some((a: { reversible?: boolean }) => a.reversible);

                  return (
                    <>
                      <tr
                        key={exec.id}
                        className="hover:bg-bg-hover cursor-pointer transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                      >
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox"
                            checked={selectedIds.has(exec.id)}
                            onChange={e => {
                              const n = new Set(selectedIds);
                              e.target.checked ? n.add(exec.id) : n.delete(exec.id);
                              setSelectedIds(n);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-tx-primary">{formatEvent(exec.trigger_event)}</p>
                          <p className="text-xs text-tx-muted font-mono">{exec.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-tx-secondary">
                          {exec.actions_taken?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-tx-secondary text-xs">{timeAgo(exec.started_at)}</td>
                        <td className="px-4 py-3 text-tx-muted text-xs">{duration(exec.started_at, exec.completed_at)}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {canRollback && (
                              <button
                                onClick={() => handleRollback(exec.id)}
                                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-tx-secondary rounded hover:bg-bg-hover transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" /> Rollback
                              </button>
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-tx-muted" /> : <ChevronRight className="w-4 h-4 text-tx-muted" />}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${exec.id}-expand`} className="bg-bg-secondary">
                          <td colSpan={7} className="px-4 py-4">
                            {exec.actions_taken && exec.actions_taken.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-tx-muted uppercase tracking-wide mb-2">Action Log</p>
                                {exec.actions_taken.map((action: { action_type: string; status: string; reversible?: boolean; reversed_at?: string; data?: Record<string, unknown> }, i) => (
                                  <div key={i} className="flex items-start gap-3 text-xs p-2 bg-bg-card rounded-lg border border-bd">
                                    {action.status === 'success'
                                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                      : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                                    <div className="flex-1">
                                      <span className="font-mono font-medium text-tx-primary">{action.action_type}</span>
                                      <div className="flex gap-2 mt-1 flex-wrap">
                                        {action.reversible && (
                                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded">reversible</span>
                                        )}
                                        {action.reversed_at && (
                                          <span className="bg-slate-100 dark:bg-slate-700 text-tx-muted px-1.5 py-0.5 rounded">reversed</span>
                                        )}
                                      </div>
                                      {action.data && (
                                        <pre className="mt-1 text-tx-muted overflow-auto max-h-24 text-xs">
                                          {JSON.stringify(action.data, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-tx-muted text-xs">No action details.</p>
                            )}
                            {exec.error_message && (
                              <p className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                                {exec.error_message}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-tx-muted">Showing {executions.length} results</p>
        <div className="flex gap-2">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}
            className="px-3 py-1.5 bg-bg-card border border-bd rounded text-xs text-tx-secondary disabled:opacity-40 hover:bg-bg-hover transition-colors">
            Previous
          </button>
          <button disabled={executions.length < PAGE} onClick={() => setOffset(offset + PAGE)}
            className="px-3 py-1.5 bg-bg-card border border-bd rounded text-xs text-tx-secondary disabled:opacity-40 hover:bg-bg-hover transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
