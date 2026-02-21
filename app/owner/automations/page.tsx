'use client';

import { useState, useEffect, useCallback } from 'react';
import { workflowsApi } from '@/app/lib/api-services';
import {
  Zap, Plus, Play, Pause, Trash2, Eye, ChevronRight,
  Clock, CheckCircle2, XCircle, SkipForward,
  LayoutTemplate, RefreshCw, X, Settings2, ChevronDown,
} from 'lucide-react';

// ─────────────────────────── Types ───────────────────────────

type TriggerEvent =
  | 'rent_overdue'
  | 'lease_expiring_soon'
  | 'maintenance_request_opened'
  | 'maintenance_request_resolved'
  | 'unit_vacated'
  | 'tenant_onboarded';

type ActionType =
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'update_field'
  | 'escalate';

type WorkflowStatus = 'active' | 'inactive' | 'draft';
type LogStatus = 'success' | 'failed' | 'skipped';

interface WorkflowAction {
  id?: string;
  order: number;
  action_type: ActionType;
  config: string; // raw JSON
  delay_minutes: number;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_event: TriggerEvent;
  conditions?: string;
  status: WorkflowStatus;
  is_template: boolean;
  run_count: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
  actions: WorkflowAction[];
}

interface WorkflowLog {
  id: string;
  workflow_id: string;
  triggered_by: string;
  context?: string;
  status: LogStatus;
  actions_run: number;
  error_message?: string;
  triggered_at: string;
  completed_at?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  trigger_event: TriggerEvent;
  conditions?: Record<string, any>;
  actions: Array<{
    order: number;
    action_type: ActionType;
    config: Record<string, any>;
    delay_minutes?: number;
  }>;
}

// ─────────────────────────── Constants ───────────────────────────

const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  rent_overdue: 'Rent Overdue',
  lease_expiring_soon: 'Lease Expiring Soon',
  maintenance_request_opened: 'Maintenance Request Opened',
  maintenance_request_resolved: 'Maintenance Request Resolved',
  unit_vacated: 'Unit Vacated',
  tenant_onboarded: 'Tenant Onboarded',
};

const ACTION_LABELS: Record<ActionType, string> = {
  send_notification: 'Send Notification',
  send_email: 'Send Email',
  create_task: 'Create Task',
  update_field: 'Update Field',
  escalate: 'Escalate',
};

const TRIGGER_COLORS: Record<TriggerEvent, string> = {
  rent_overdue: 'bg-red-100 text-red-700',
  lease_expiring_soon: 'bg-amber-100 text-amber-700',
  maintenance_request_opened: 'bg-blue-100 text-blue-700',
  maintenance_request_resolved: 'bg-green-100 text-green-700',
  unit_vacated: 'bg-purple-100 text-purple-700',
  tenant_onboarded: 'bg-teal-100 text-teal-700',
};

const EMPTY_ACTION = (): Omit<WorkflowAction, 'id'> => ({
  order: 0,
  action_type: 'send_notification',
  config: JSON.stringify({ title: '', body: '' }),
  delay_minutes: 0,
});

// ─────────────────────────── Helpers ───────────────────────────

function parseConfig(raw: string | Record<string, any>): Record<string, any> {
  if (typeof raw === 'object' && raw !== null) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────── Sub-components ───────────────────────────

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const map: Record<WorkflowStatus, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    draft: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LogStatusIcon({ s }: { s: LogStatus }) {
  if (s === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  if (s === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
  return <SkipForward className="w-4 h-4 text-gray-400" />;
}

// ─────────────────────────── Action Config Editor ───────────────────────────

function ActionConfigEditor({
  actionType,
  config,
  onChange,
}: {
  actionType: ActionType;
  config: Record<string, any>;
  onChange: (cfg: Record<string, any>) => void;
}) {
  const field = (
    key: string,
    label: string,
    placeholder: string,
    multiline = false,
  ) => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>
      {multiline ? (
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          rows={3}
          placeholder={placeholder}
          value={config[key] ?? ''}
          onChange={(e) => onChange({ ...config, [key]: e.target.value })}
        />
      ) : (
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder={placeholder}
          value={config[key] ?? ''}
          onChange={(e) => onChange({ ...config, [key]: e.target.value })}
        />
      )}
    </div>
  );

  switch (actionType) {
    case 'send_notification':
      return (
        <div className="space-y-2 mt-2">
          {field('title', 'Title', 'e.g. Rent Overdue – {{tenant_name}}')}
          {field('body', 'Body', 'e.g. {{tenant_name}} owes KES {{amount_due}}', true)}
        </div>
      );

    case 'send_email':
      return (
        <div className="space-y-2 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Send To</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={config.to ?? 'owner'}
              onChange={(e) => onChange({ ...config, to: e.target.value })}
            >
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
              <option value="caretaker">Staff</option>
            </select>
          </div>
          {field('subject', 'Subject', 'e.g. Rent Overdue – {{tenant_name}}')}
          {field('body', 'Body', 'e.g. Hi,\n\n{{tenant_name}} owes KES {{amount_due}}.', true)}
        </div>
      );

    case 'create_task':
      return (
        <div className="space-y-2 mt-2">
          {field('title', 'Task Title', 'e.g. Follow up – {{tenant_name}}')}
          {field('description', 'Description', 'e.g. Tenant {{tenant_name}} is overdue on rent.', true)}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Due In (days)</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={config.due_in_days ?? 1}
              onChange={(e) => onChange({ ...config, due_in_days: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Assign To</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={config.assigned_to ?? 'owner'}
              onChange={(e) => onChange({ ...config, assigned_to: e.target.value })}
            >
              <option value="owner">Owner</option>
              <option value="caretaker">Staff</option>
            </select>
          </div>
        </div>
      );

    case 'update_field':
      return (
        <div className="space-y-2 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Model</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={config.model ?? 'unit'}
              onChange={(e) => onChange({ ...config, model: e.target.value })}
            >
              <option value="unit">Unit</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
          {field('field', 'Field Name', 'e.g. status')}
          {field('value', 'New Value', 'e.g. vacant')}
        </div>
      );

    case 'escalate':
      return (
        <div className="space-y-2 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Notify Role</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={config.notify_role ?? 'owner'}
              onChange={(e) => onChange({ ...config, notify_role: e.target.value })}
            >
              <option value="owner">Owner</option>
              <option value="caretaker">Staff</option>
            </select>
          </div>
          {field('message', 'Escalation Message', 'e.g. {{tenant_name}} is 14 days overdue. Urgent action needed.', true)}
        </div>
      );
  }
}

// ─────────────────────────── Workflow Builder Modal ───────────────────────────

interface BuilderProps {
  initial?: Workflow | null;
  templates: Template[];
  onSave: (wf: Workflow) => void;
  onClose: () => void;
}

function WorkflowBuilderModal({ initial, templates, onSave, onClose }: BuilderProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [triggerEvent, setTriggerEvent] = useState<TriggerEvent>(
    initial?.trigger_event ?? 'rent_overdue',
  );
  const [wfStatus, setWfStatus] = useState<WorkflowStatus>(initial?.status ?? 'active');
  const [actions, setActions] = useState<Array<Omit<WorkflowAction, 'id'>>>(
    initial?.actions.map((a) => ({
      order: a.order,
      action_type: a.action_type,
      config: a.config,
      delay_minutes: a.delay_minutes,
    })) ?? [EMPTY_ACTION()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showTemplates, setShowTemplates] = useState(!initial);

  const applyTemplate = (tpl: Template) => {
    setName(tpl.name);
    setDescription(tpl.description);
    setTriggerEvent(tpl.trigger_event);
    setActions(
      tpl.actions.map((a) => ({
        order: a.order,
        action_type: a.action_type,
        config: JSON.stringify(a.config),
        delay_minutes: a.delay_minutes ?? 0,
      })),
    );
    setShowTemplates(false);
  };

  const addAction = () =>
    setActions((prev) => [...prev, { ...EMPTY_ACTION(), order: prev.length }]);

  const removeAction = (idx: number) =>
    setActions((prev) => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order: i })));

  const updateAction = (idx: number, patch: Partial<Omit<WorkflowAction, 'id'>>) =>
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));

  const handleSave = async () => {
    if (!name.trim()) { setError('Workflow name is required.'); return; }
    if (actions.length === 0) { setError('Add at least one action.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        trigger_event: triggerEvent,
        status: wfStatus,
        actions: actions.map((a) => ({
          order: a.order,
          action_type: a.action_type,
          config: parseConfig(a.config),
          delay_minutes: a.delay_minutes,
        })),
      };
      const res = initial
        ? await workflowsApi.update(initial.id, payload)
        : await workflowsApi.create(payload);

      if (!res.success) {
        setError(res.error || (res as any).data?.detail || 'Save failed.');
        return;
      }
      onSave(res.data);
    } catch (e: any) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? 'Edit Workflow' : 'New Workflow'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Template picker */}
          {!initial && (
            <div>
              <button
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                onClick={() => setShowTemplates((v) => !v)}
              >
                <LayoutTemplate className="w-4 h-4" />
                {showTemplates ? 'Hide templates' : 'Start from a template'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>
              {showTemplates && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      className="text-left border border-gray-200 rounded-xl p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      onClick={() => applyTemplate(tpl)}
                    >
                      <p className="text-sm font-medium text-gray-900 leading-snug">{tpl.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tpl.description}</p>
                      <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${TRIGGER_COLORS[tpl.trigger_event]}`}>
                        {TRIGGER_LABELS[tpl.trigger_event]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Send rent reminder at 7 days overdue"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger Event <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value as TriggerEvent)}
            >
              {(Object.keys(TRIGGER_LABELS) as TriggerEvent[]).map((k) => (
                <option key={k} value={k}>{TRIGGER_LABELS[k]}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={wfStatus}
              onChange={(e) => setWfStatus(e.target.value as WorkflowStatus)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Actions ({actions.length})
              </label>
              <button
                onClick={addAction}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Action
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((action, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                      {idx + 1}
                    </span>
                    <select
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                      value={action.action_type}
                      onChange={(e) => {
                        const at = e.target.value as ActionType;
                        const defaultConfigs: Record<ActionType, Record<string, any>> = {
                          send_notification: { title: '', body: '' },
                          send_email: { to: 'owner', subject: '', body: '' },
                          create_task: { title: '', description: '', due_in_days: 1, assigned_to: 'owner' },
                          update_field: { model: 'unit', field: '', value: '' },
                          escalate: { notify_role: 'owner', message: '' },
                        };
                        updateAction(idx, {
                          action_type: at,
                          config: JSON.stringify(defaultConfigs[at]),
                        });
                      }}
                    >
                      {(Object.keys(ACTION_LABELS) as ActionType[]).map((k) => (
                        <option key={k} value={k}>{ACTION_LABELS[k]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeAction(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <ActionConfigEditor
                    actionType={action.action_type}
                    config={parseConfig(action.config)}
                    onChange={(cfg) => updateAction(idx, { config: JSON.stringify(cfg) })}
                  />

                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-gray-500">Delay (min):</label>
                    <input
                      type="number"
                      min={0}
                      className="w-20 border border-gray-200 rounded px-2 py-1 text-xs"
                      value={action.delay_minutes}
                      onChange={(e) =>
                        updateAction(idx, { delay_minutes: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Logs Drawer ───────────────────────────

function LogsDrawer({
  logs,
  workflowName,
  onClose,
}: {
  logs: WorkflowLog[];
  workflowName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/30">
      <div className="bg-white w-full sm:w-[480px] h-full sm:h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Execution Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{workflowName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No executions yet</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <LogStatusIcon s={log.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-700 capitalize">
                        {log.status}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(log.triggered_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Actions executed: {log.actions_run}
                    </p>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 rounded p-1.5">
                        {log.error_message}
                      </p>
                    )}
                    {log.context && (() => {
                      try {
                        const ctx = JSON.parse(log.context);
                        const keys = ['tenant_name', 'unit_number', 'amount_due', 'days_overdue'];
                        const visible = keys.filter((k) => ctx[k] !== undefined && ctx[k] !== '');
                        if (visible.length === 0) return null;
                        return (
                          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                            {visible.map((k) => (
                              <span key={k} className="inline-block mr-2">
                                <span className="font-medium">{k.replace(/_/g, ' ')}</span>: {ctx[k]}
                              </span>
                            ))}
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Workflow Card ───────────────────────────

function WorkflowCard({
  wf,
  onToggle,
  onEdit,
  onDelete,
  onViewLogs,
}: {
  wf: Workflow;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{wf.name}</h3>
            <StatusBadge status={wf.status} />
          </div>
          {wf.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{wf.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIGGER_COLORS[wf.trigger_event]}`}>
              {TRIGGER_LABELS[wf.trigger_event]}
            </span>
            <span className="text-xs text-gray-400">
              {wf.actions.length} action{wf.actions.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-400">
              {wf.run_count} run{wf.run_count !== 1 ? 's' : ''}
            </span>
            {wf.last_triggered_at && (
              <span className="text-xs text-gray-400">
                Last: {formatDate(wf.last_triggered_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            title={wf.status === 'active' ? 'Pause' : 'Activate'}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {wf.status === 'active'
              ? <Pause className="w-4 h-4" />
              : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={onViewLogs}
            title="View Logs"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action chips */}
      {wf.actions.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {wf.actions.map((a, i) => (
            <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
              {ACTION_LABELS[a.action_type]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Premium Gate ───────────────────────────

function PremiumGate() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Workflow Automation</h2>
      <p className="text-gray-500 max-w-sm text-sm mb-6">
        Automate your property management workflows with triggers and actions.
        Available on Professional and Enterprise plans.
      </p>
      <a
        href="/owner/settings?tab=billing"
        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Upgrade Your Plan
      </a>
    </div>
  );
}

// ─────────────────────────── Main Page ───────────────────────────

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWf, setEditingWf] = useState<Workflow | null>(null);
  const [logsWf, setLogsWf] = useState<Workflow | null>(null);
  const [scheduledChecking, setScheduledChecking] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wfRes, tplRes] = await Promise.all([
        workflowsApi.list(),
        workflowsApi.getTemplates(),
      ]);

      if (!wfRes.success) {
        const msg = wfRes.error || (wfRes as any).data?.detail || '';
        if (
          msg.toLowerCase().includes('premium') ||
          msg.toLowerCase().includes('subscription') ||
          msg.toLowerCase().includes('403')
        ) {
          setIsPremium(false);
        }
        setLoading(false);
        return;
      }

      setIsPremium(true);
      const wfData = Array.isArray(wfRes.data) ? wfRes.data : wfRes.data?.data ?? [];
      setWorkflows(wfData);

      if (tplRes.success) {
        const tplData = Array.isArray(tplRes.data) ? tplRes.data : tplRes.data?.data ?? [];
        setTemplates(tplData);
      }
    } catch (e: any) {
      if (e?.status === 403 || e?.message?.includes('403')) {
        setIsPremium(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openLogs = async (wf: Workflow) => {
    setLogsWf(wf);
    try {
      const res = await workflowsApi.getLogs(wf.id);
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setLogs(data);
    } catch {
      setLogs([]);
    }
  };

  const toggleStatus = async (wf: Workflow) => {
    const next: WorkflowStatus = wf.status === 'active' ? 'inactive' : 'active';
    const res = await workflowsApi.update(wf.id, { status: next });
    if (res.success) {
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, status: next } : w)),
      );
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!window.confirm('Delete this workflow? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await workflowsApi.delete(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (wf: Workflow) => {
    setWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === wf.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = wf;
        return next;
      }
      return [wf, ...prev];
    });
    setShowBuilder(false);
    setEditingWf(null);
  };

  const runScheduledCheck = async () => {
    setScheduledChecking(true);
    setScheduledResult(null);
    try {
      const res = await workflowsApi.checkScheduled();
      if (res.success) {
        const d = res.data;
        const fired = d?.workflows_fired ?? {};
        const total = Object.values(fired).reduce((a: number, b: any) => a + Number(b), 0);
        setScheduledResult(
          total > 0
            ? `${total} workflow run(s) triggered. Rent overdue: ${fired.rent_overdue ?? 0}, Lease expiry: ${fired.lease_expiring_soon ?? 0}.`
            : 'Check complete — no conditions matched active workflows.',
        );
        loadData();
      } else {
        setScheduledResult('Check failed: ' + (res.error || 'unknown error'));
      }
    } catch (e: any) {
      setScheduledResult('Check failed: ' + e.message);
    } finally {
      setScheduledChecking(false);
    }
  };

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return <PremiumGate />;
  }

  const activeCount = workflows.filter((w) => w.status === 'active').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Workflow Automations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automate actions when events happen in your properties.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runScheduledCheck}
            disabled={scheduledChecking}
            title="Check rent overdue & lease expiry conditions now"
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${scheduledChecking ? 'animate-spin' : ''}`} />
            Run Checks
          </button>
          <button
            onClick={() => { setEditingWf(null); setShowBuilder(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Scheduled check result */}
      {scheduledResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-start justify-between gap-3">
          <span>{scheduledResult}</span>
          <button onClick={() => setScheduledResult(null)} className="shrink-0">
            <X className="w-4 h-4 text-blue-400 hover:text-blue-600" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Workflows', value: workflows.length },
          { label: 'Active', value: activeCount, color: 'text-green-600' },
          {
            label: 'Total Runs',
            value: workflows.reduce((s, w) => s + w.run_count, 0),
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color ?? 'text-gray-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Workflow list */}
      {workflows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-20 text-center">
          <Zap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No workflows yet.</p>
          <p className="text-gray-400 text-xs mt-1 mb-4">
            Create one manually or start from a template.
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Create First Workflow
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf.id} className={deleting === wf.id ? 'opacity-50 pointer-events-none' : ''}>
              <WorkflowCard
                wf={wf}
                onToggle={() => toggleStatus(wf)}
                onEdit={() => { setEditingWf(wf); setShowBuilder(true); }}
                onDelete={() => deleteWorkflow(wf.id)}
                onViewLogs={() => openLogs(wf)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Builder modal */}
      {showBuilder && (
        <WorkflowBuilderModal
          initial={editingWf}
          templates={templates}
          onSave={handleSaved}
          onClose={() => { setShowBuilder(false); setEditingWf(null); }}
        />
      )}

      {/* Logs drawer */}
      {logsWf && (
        <LogsDrawer
          logs={logs}
          workflowName={logsWf.name}
          onClose={() => setLogsWf(null)}
        />
      )}
    </div>
  );
}
