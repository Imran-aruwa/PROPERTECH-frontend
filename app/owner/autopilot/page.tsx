'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bot, Zap, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
  ChevronDown, ChevronRight, RotateCcw, Shield, Activity,
} from 'lucide-react';
import {
  autopilotHealthApi,
  autopilotSettingsApi,
  automationExecutionsApi,
} from '@/app/lib/api/automation';
import { AutopilotHealth, AutopilotSettings, AutomationExecution, AutopilotMode } from '@/types/automation';

const MODE_CONFIG: Record<AutopilotMode, { label: string; color: string; bg: string; description: string }> = {
  full_auto:         { label: 'FULL AUTO',         color: 'text-green-600',  bg: 'bg-green-100',  description: 'Engine acts autonomously on all events' },
  approval_required: { label: 'APPROVAL REQUIRED', color: 'text-amber-600',  bg: 'bg-amber-100',  description: 'Every action requires your approval first' },
  notify_only:       { label: 'NOTIFY ONLY',       color: 'text-slate-600',  bg: 'bg-slate-100',  description: 'Log events and notify — no automatic actions' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  completed:          { label: 'Completed',          icon: <CheckCircle className="w-4 h-4" />,  color: 'text-green-600' },
  failed:             { label: 'Failed',             icon: <XCircle className="w-4 h-4" />,      color: 'text-red-600' },
  rolled_back:        { label: 'Rolled Back',        icon: <RotateCcw className="w-4 h-4" />,    color: 'text-slate-600' },
  awaiting_approval:  { label: 'Needs Approval',     icon: <AlertCircle className="w-4 h-4" />,  color: 'text-amber-600' },
  running:            { label: 'Running',            icon: <RefreshCw className="w-4 h-4 animate-spin" />, color: 'text-blue-600' },
  pending:            { label: 'Pending',            icon: <Clock className="w-4 h-4" />,         color: 'text-slate-500' },
};

function formatEventName(event: string) {
  return event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function AutopilotCommandCentre() {
  const [health, setHealth] = useState<AutopilotHealth | null>(null);
  const [settings, setSettings] = useState<AutopilotSettings | null>(null);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AutomationExecution[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchAll = useCallback(async () => {
    const [healthRes, settingsRes, execRes, approvalRes] = await Promise.all([
      autopilotHealthApi.get(),
      autopilotSettingsApi.get(),
      automationExecutionsApi.list({ limit: 30 }),
      automationExecutionsApi.list({ status: 'awaiting_approval', limit: 20 }),
    ]);
    if (healthRes.success) setHealth(healthRes.data!);
    if (settingsRes.success) setSettings(settingsRes.data!);
    if (execRes.success) setExecutions(execRes.data!);
    if (approvalRes.success) setPendingApprovals(approvalRes.data!);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleToggle = async () => {
    if (!settings) return;
    setToggling(true);
    const res = await autopilotSettingsApi.update({ is_enabled: !settings.is_enabled });
    if (res.success) setSettings(res.data!);
    setToggling(false);
  };

  const handleApprove = async (id: string) => {
    const res = await automationExecutionsApi.approve(id);
    if (res.success) fetchAll();
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    const res = await automationExecutionsApi.reject(id, rejectReason);
    if (res.success) { setRejectingId(null); setRejectReason(''); fetchAll(); }
  };

  const handleRollback = async (id: string) => {
    const res = await automationExecutionsApi.rollback(id);
    if (res.success) fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const mode = (settings?.mode || 'notify_only') as AutopilotMode;
  const modeConfig = MODE_CONFIG[mode];

  return (
    <div className="p-6 space-y-6 bg-bg-secondary min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-tx-primary">Autopilot Command Centre</h1>
            <p className="text-sm text-tx-secondary">Your 24/7 autonomous property manager</p>
          </div>
        </div>
        <button
          onClick={fetchAll}
          className="p-2 rounded-lg bg-bg-card border border-bd hover:bg-bg-hover transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-tx-secondary" />
        </button>
      </div>

      {/* Master Toggle + Mode Badge */}
      <div className="bg-bg-card border border-bd rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none ${
                settings?.is_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
                  settings?.is_enabled ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <p className="font-semibold text-tx-primary text-lg">
                Autopilot {settings?.is_enabled ? 'ON' : 'OFF'}
              </p>
              <p className="text-sm text-tx-secondary">{modeConfig.description}</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${modeConfig.bg} ${modeConfig.color}`}>
            {modeConfig.label}
          </span>
        </div>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Rules', value: health?.active_rules ?? 0, icon: Zap, color: 'blue' },
          { label: 'Executions Today', value: health?.executions_today ?? 0, icon: Activity, color: 'green' },
          {
            label: 'Pending Approvals', value: health?.pending_approvals ?? 0,
            icon: AlertCircle, color: health?.pending_approvals ? 'red' : 'slate',
            badge: health?.pending_approvals ? true : false,
          },
          { label: 'Scheduled', value: health?.upcoming_scheduled_count ?? 0, icon: Clock, color: 'amber' },
        ].map(({ label, value, icon: Icon, color, badge }) => (
          <div key={label} className="bg-bg-card border border-bd rounded-xl p-4 relative">
            {badge && value > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {value}
              </span>
            )}
            <div className={`w-8 h-8 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-tx-primary">{value}</p>
            <p className="text-xs text-tx-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals Panel */}
      {pendingApprovals.length > 0 && (
        <div className="bg-bg-card border border-amber-300 dark:border-amber-700 rounded-xl p-4">
          <h2 className="font-semibold text-tx-primary mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pending Approvals ({pendingApprovals.length})
          </h2>
          <div className="space-y-3">
            {pendingApprovals.map(exec => (
              <div key={exec.id} className="bg-status-warningBg border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-tx-primary">{formatEventName(exec.trigger_event)}</p>
                    <p className="text-xs text-tx-secondary mt-1">
                      Triggered {timeAgo(exec.started_at)} · {(exec.trigger_payload as Record<string, string>)?.tenant_name || 'Unknown tenant'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {/* Preview actions from the payload context */}
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        {exec.trigger_event}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(exec.id)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    {rejectingId === exec.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          className="text-xs border border-bd rounded px-2 py-1 bg-input-bg text-tx-primary w-40"
                        />
                        <button
                          onClick={() => handleReject(exec.id)}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="text-xs text-tx-secondary hover:text-tx-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRejectingId(exec.id)}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingApprovals.length === 0 && (
        <div className="bg-bg-card border border-bd rounded-xl p-4 flex items-center gap-3 text-tx-secondary">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm">All clear — no pending approvals</span>
        </div>
      )}

      {/* Live Activity Feed */}
      <div className="bg-bg-card border border-bd rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-bd">
          <h2 className="font-semibold text-tx-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Live Activity Feed
          </h2>
          <Link href="/owner/autopilot/executions" className="text-xs text-brand hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-bd">
          {executions.length === 0 && (
            <div className="p-6 text-center text-tx-muted text-sm">
              No executions yet. Autopilot will act when events arrive.
            </div>
          )}
          {executions.map(exec => {
            const sc = STATUS_CONFIG[exec.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === exec.id;
            const canRollback = exec.status === 'completed' &&
              (exec.actions_taken || []).some((a: { reversible?: boolean }) => a.reversible);

            return (
              <div key={exec.id} className="hover:bg-bg-hover transition-colors">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                >
                  <div className={`flex-shrink-0 ${sc.color}`}>{sc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-tx-primary truncate">
                      {formatEventName(exec.trigger_event)}
                      {(exec.trigger_payload as Record<string, string>)?.tenant_name && (
                        <span className="text-tx-secondary font-normal">
                          {' — '}{(exec.trigger_payload as Record<string, string>).tenant_name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-tx-muted">{timeAgo(exec.started_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color} bg-bg-secondary`}>
                    {sc.label}
                  </span>
                  {canRollback && (
                    <button
                      onClick={e => { e.stopPropagation(); handleRollback(exec.id); }}
                      className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-tx-secondary rounded hover:bg-bg-hover transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Rollback
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-tx-muted flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-tx-muted flex-shrink-0" />
                  )}
                </div>
                {isExpanded && exec.actions_taken && (
                  <div className="px-4 pb-4 bg-bg-secondary border-t border-bd">
                    <p className="text-xs font-medium text-tx-muted mt-3 mb-2">Actions taken:</p>
                    <div className="space-y-2">
                      {exec.actions_taken.map((action: { action_type: string; status: string; reversible?: boolean }, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {action.status === 'success'
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            : action.status === 'failed'
                            ? <XCircle className="w-3.5 h-3.5 text-red-500" />
                            : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="text-tx-secondary font-mono">{action.action_type}</span>
                          {action.reversible && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded">
                              reversible
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {exec.error_message && (
                      <p className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                        {exec.error_message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/owner/autopilot/rules', label: 'Manage Rules', icon: Zap, desc: 'Create & edit automation rules' },
          { href: '/owner/autopilot/executions', label: 'All Executions', icon: Activity, desc: 'Full execution history' },
          { href: '/owner/autopilot/settings', label: 'Settings', icon: Shield, desc: 'Configure Autopilot behaviour' },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-bg-card border border-bd rounded-xl p-4 hover:border-brand hover:bg-bg-hover transition-colors group"
          >
            <Icon className="w-5 h-5 text-brand mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-tx-primary text-sm">{label}</p>
            <p className="text-xs text-tx-muted mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
