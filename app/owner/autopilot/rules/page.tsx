'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Plus, ToggleLeft, ToggleRight, Trash2, Edit3, Copy,
  Play, ChevronRight, X, GripVertical, RefreshCw, Layers,
} from 'lucide-react';
import {
  automationRulesApi,
  automationTemplatesApi,
} from '@/app/lib/api/automation';
import {
  AutomationRule,
  AutomationTemplate,
  TemplateCategory,
  Condition,
  ActionStep,
} from '@/types/automation';

const TRIGGER_EVENTS = [
  'payment_received', 'payment_overdue_3d', 'payment_overdue_7d', 'payment_overdue_14d',
  'lease_expiring_60d', 'lease_expiring_30d', 'lease_expiring_7d', 'lease_expired',
  'unit_vacated', 'unit_vacant_7d', 'unit_vacant_30d',
  'maintenance_request_created', 'maintenance_overdue',
  'tenant_onboarded', 'manual',
];

const OPERATORS = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'contains'];
const CATEGORIES: TemplateCategory[] = ['payments', 'leases', 'vacancy', 'maintenance', 'onboarding'];

function EventBadge({ event }: { event: string }) {
  const colors: Record<string, string> = {
    payment: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    lease: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    unit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    tenant: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  const colorKey = Object.keys(colors).find(k => event.startsWith(k)) || 'payment';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[colorKey]}`}>
      {event.replace(/_/g, ' ')}
    </span>
  );
}

type DrawerMode = 'create' | 'edit';

const blankRule = {
  name: '',
  description: '',
  trigger_event: 'payment_received',
  trigger_conditions: [] as Condition[],
  action_chain: [] as ActionStep[],
  delay_minutes: 0,
  requires_approval: false,
  is_active: true,
};

export default function AutopilotRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState(blankRule);
  const [templateModal, setTemplateModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('payments');
  const [dryRunModal, setDryRunModal] = useState<AutomationRule | null>(null);
  const [dryRunPayload, setDryRunPayload] = useState('{}');
  const [dryRunResult, setDryRunResult] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [rulesRes, tmplRes] = await Promise.all([
      automationRulesApi.list(),
      automationTemplatesApi.list(),
    ]);
    if (rulesRes.success) setRules(rulesRes.data!);
    if (tmplRes.success) setTemplates(tmplRes.data!);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setForm(blankRule); setDrawerMode('create'); setEditingRule(null); setDrawerOpen(true); };
  const openEdit = (rule: AutomationRule) => {
    setForm({
      name: rule.name,
      description: rule.description || '',
      trigger_event: rule.trigger_event,
      trigger_conditions: (rule.trigger_conditions as Condition[]) || [],
      action_chain: (rule.action_chain as ActionStep[]) || [],
      delay_minutes: rule.delay_minutes,
      requires_approval: rule.requires_approval,
      is_active: rule.is_active,
    });
    setDrawerMode('edit');
    setEditingRule(rule);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (drawerMode === 'create') {
      await automationRulesApi.create(form);
    } else if (editingRule) {
      await automationRulesApi.update(editingRule.id, form);
    }
    setSaving(false);
    setDrawerOpen(false);
    fetchData();
  };

  const handleToggle = async (rule: AutomationRule) => {
    await automationRulesApi.toggle(rule.id);
    fetchData();
  };

  const handleDelete = async (rule: AutomationRule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    await automationRulesApi.delete(rule.id);
    fetchData();
  };

  const handleDuplicate = async (rule: AutomationRule) => {
    await automationRulesApi.create({
      ...rule,
      name: `${rule.name} (Copy)`,
      is_active: false,
    });
    fetchData();
  };

  const handleActivateTemplate = async (templateId: string) => {
    await automationTemplatesApi.activate(templateId);
    setTemplateModal(false);
    fetchData();
  };

  const handleDryRun = async () => {
    if (!dryRunModal) return;
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(dryRunPayload); } catch { alert('Invalid JSON'); return; }
    const res = await automationRulesApi.dryRun(dryRunModal.id, payload);
    if (res.success) setDryRunResult(res.data);
  };

  const addCondition = () => {
    setForm(f => ({
      ...f,
      trigger_conditions: [...f.trigger_conditions, { field: '', operator: 'eq', value: '' }],
    }));
  };

  const addActionStep = () => {
    setForm(f => ({
      ...f,
      action_chain: [...f.action_chain, { action_type: 'send_sms', params: {}, stop_on_failure: false }],
    }));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  const categoryTemplates = templates.filter(t =>
    t.is_system_template && t.category === activeCategory
  );

  return (
    <div className="p-6 space-y-6 bg-bg-secondary min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tx-primary">Automation Rules</h1>
          <p className="text-sm text-tx-secondary">{rules.length} rules · {rules.filter(r => r.is_active).length} active</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-bd text-tx-primary rounded-lg hover:bg-bg-hover text-sm transition-colors"
          >
            <Layers className="w-4 h-4" /> Templates
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      {rules.length === 0 ? (
        <div className="bg-bg-card border border-dashed border-bd rounded-xl p-12 text-center">
          <Zap className="w-10 h-10 text-tx-muted mx-auto mb-3" />
          <p className="text-tx-secondary font-medium">No automation rules yet</p>
          <p className="text-tx-muted text-sm mt-1">Activate a template or create your first rule.</p>
          <button onClick={() => setTemplateModal(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Browse Templates
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-bg-card border rounded-xl p-4 space-y-3 transition-all ${rule.is_active ? 'border-bd' : 'border-bd opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-tx-primary text-sm">{rule.name}</p>
                  {rule.description && <p className="text-xs text-tx-muted mt-0.5 line-clamp-2">{rule.description}</p>}
                </div>
                <button onClick={() => handleToggle(rule)} className="flex-shrink-0">
                  {rule.is_active
                    ? <ToggleRight className="w-6 h-6 text-blue-600" />
                    : <ToggleLeft className="w-6 h-6 text-tx-muted" />}
                </button>
              </div>
              <EventBadge event={rule.trigger_event} />
              <div className="flex items-center gap-2 text-xs text-tx-muted">
                <span>{rule.action_chain?.length || 0} actions</span>
                <span>·</span>
                <span>{rule.execution_count} runs</span>
                {rule.delay_minutes > 0 && <><span>·</span><span>{rule.delay_minutes}m delay</span></>}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-bd">
                {[
                  { icon: Edit3, onClick: () => openEdit(rule), title: 'Edit' },
                  { icon: Copy, onClick: () => handleDuplicate(rule), title: 'Duplicate' },
                  { icon: Play, onClick: () => { setDryRunModal(rule); setDryRunResult(null); }, title: 'Test (dry run)' },
                  { icon: Trash2, onClick: () => handleDelete(rule), title: 'Delete', danger: true },
                ].map(({ icon: Icon, onClick, title, danger }) => (
                  <button
                    key={title}
                    onClick={onClick}
                    title={title}
                    className={`p-1.5 rounded-lg transition-colors ${danger ? 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500' : 'hover:bg-bg-hover text-tx-secondary'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-lg bg-bg-card border-l border-bd shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-bd sticky top-0 bg-bg-card z-10">
              <h2 className="text-lg font-bold text-tx-primary">
                {drawerMode === 'create' ? 'Create Rule' : 'Edit Rule'}
              </h2>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5 text-tx-muted" />
              </button>
            </div>
            <div className="p-6 space-y-5 flex-1">
              <div>
                <label className="text-sm font-medium text-tx-secondary">Name *</label>
                <input
                  className="mt-1 w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-input-bg text-tx-primary focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Send receipt on payment"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-tx-secondary">Description</label>
                <textarea
                  className="mt-1 w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-input-bg text-tx-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-tx-secondary">Trigger Event *</label>
                <select
                  className="mt-1 w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-input-bg text-tx-primary"
                  value={form.trigger_event}
                  onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))}
                >
                  {TRIGGER_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-tx-secondary">Conditions (AND logic)</label>
                  <button onClick={addCondition} className="text-xs text-brand hover:underline">+ Add</button>
                </div>
                {form.trigger_conditions.map((cond, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      className="flex-1 border border-input-border rounded px-2 py-1.5 text-xs bg-input-bg text-tx-primary"
                      placeholder="field"
                      value={cond.field}
                      onChange={e => {
                        const c = [...form.trigger_conditions];
                        c[i] = { ...c[i], field: e.target.value };
                        setForm(f => ({ ...f, trigger_conditions: c }));
                      }}
                    />
                    <select
                      className="border border-input-border rounded px-2 py-1.5 text-xs bg-input-bg text-tx-primary"
                      value={cond.operator}
                      onChange={e => {
                        const c = [...form.trigger_conditions];
                        c[i] = { ...c[i], operator: e.target.value as Condition['operator'] };
                        setForm(f => ({ ...f, trigger_conditions: c }));
                      }}
                    >
                      {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input
                      className="flex-1 border border-input-border rounded px-2 py-1.5 text-xs bg-input-bg text-tx-primary"
                      placeholder="value"
                      value={String(cond.value)}
                      onChange={e => {
                        const c = [...form.trigger_conditions];
                        c[i] = { ...c[i], value: e.target.value };
                        setForm(f => ({ ...f, trigger_conditions: c }));
                      }}
                    />
                    <button onClick={() => setForm(f => ({ ...f, trigger_conditions: f.trigger_conditions.filter((_, j) => j !== i) }))}
                      className="text-red-400 hover:text-red-600 px-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Chain */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-tx-secondary">Action Chain</label>
                  <button onClick={addActionStep} className="text-xs text-brand hover:underline">+ Add Action</button>
                </div>
                {form.action_chain.map((step, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <GripVertical className="w-4 h-4 text-tx-muted flex-shrink-0" />
                    <input
                      className="flex-1 border border-input-border rounded px-2 py-1.5 text-xs bg-input-bg text-tx-primary font-mono"
                      placeholder="action_type"
                      value={step.action_type}
                      onChange={e => {
                        const c = [...form.action_chain];
                        c[i] = { ...c[i], action_type: e.target.value };
                        setForm(f => ({ ...f, action_chain: c }));
                      }}
                    />
                    <label className="flex items-center gap-1 text-xs text-tx-muted flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={step.stop_on_failure}
                        onChange={e => {
                          const c = [...form.action_chain];
                          c[i] = { ...c[i], stop_on_failure: e.target.checked };
                          setForm(f => ({ ...f, action_chain: c }));
                        }}
                      />
                      stop
                    </label>
                    <button onClick={() => setForm(f => ({ ...f, action_chain: f.action_chain.filter((_, j) => j !== i) }))}
                      className="text-red-400 hover:text-red-600 px-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-tx-secondary">Delay (minutes)</label>
                  <input
                    type="number"
                    className="mt-1 w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-input-bg text-tx-primary"
                    value={form.delay_minutes}
                    onChange={e => setForm(f => ({ ...f, delay_minutes: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-end gap-3 pb-2">
                  <label className="flex items-center gap-2 text-sm text-tx-secondary cursor-pointer">
                    <input type="checkbox" checked={form.requires_approval}
                      onChange={e => setForm(f => ({ ...f, requires_approval: e.target.checked }))} />
                    Requires Approval
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-bd flex gap-3 sticky bottom-0 bg-bg-card">
              <button onClick={() => setDrawerOpen(false)} className="flex-1 border border-bd text-tx-secondary rounded-lg py-2 text-sm hover:bg-bg-hover transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-card border border-bd rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-bd sticky top-0 bg-bg-card">
              <h2 className="text-lg font-bold text-tx-primary">Activate Template</h2>
              <button onClick={() => setTemplateModal(false)}>
                <X className="w-5 h-5 text-tx-muted" />
              </button>
            </div>
            {/* Category tabs */}
            <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                    activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-bg-secondary text-tx-secondary hover:bg-bg-hover'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="p-6 space-y-3">
              {categoryTemplates.length === 0 && (
                <p className="text-tx-muted text-sm text-center py-8">No templates in this category.</p>
              )}
              {categoryTemplates.map(tmpl => (
                <div key={tmpl.id} className="border border-bd rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-tx-primary text-sm">{tmpl.name}</p>
                      {tmpl.description && <p className="text-xs text-tx-muted mt-1">{tmpl.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        <EventBadge event={tmpl.trigger_event} />
                        <span className="text-xs text-tx-muted px-2 py-0.5 bg-bg-secondary rounded-full">
                          {tmpl.default_action_chain?.length || 0} actions
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleActivateTemplate(tmpl.id)}
                      className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      Activate <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dry Run Modal */}
      {dryRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-card border border-bd rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-bd">
              <div>
                <h2 className="font-bold text-tx-primary">Dry Run — {dryRunModal.name}</h2>
                <p className="text-xs text-status-success mt-0.5">Zero side-effects • No DB writes • No external calls</p>
              </div>
              <button onClick={() => setDryRunModal(null)}><X className="w-5 h-5 text-tx-muted" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-tx-secondary">Test Payload (JSON)</label>
                <textarea
                  className="mt-1 w-full border border-input-border rounded-lg px-3 py-2 text-xs font-mono bg-input-bg text-tx-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={6}
                  value={dryRunPayload}
                  onChange={e => setDryRunPayload(e.target.value)}
                />
              </div>
              <button onClick={handleDryRun} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors">
                Run Test
              </button>
              {dryRunResult && (
                <div className="bg-bg-secondary border border-bd rounded-lg p-3">
                  <p className="text-xs font-medium text-tx-secondary mb-2">Result:</p>
                  <pre className="text-xs text-tx-primary overflow-auto max-h-64 whitespace-pre-wrap">
                    {JSON.stringify(dryRunResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
