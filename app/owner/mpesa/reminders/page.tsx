'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { mpesaApi } from '@/app/lib/api-services';
import {
  ArrowLeft, Bell, CheckCircle, XCircle, Clock, MessageSquare,
  RefreshCw, Send, Settings, ToggleLeft, ToggleRight, Edit3, Save
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReminderRule {
  is_active: boolean;
  pre_due_days: number;
  channels: Record<string, string>;
  escalation_rules: Record<string, string>;
  enabled_types: Record<string, boolean>;
}

interface Reminder {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  tenant_phone: string | null;
  reminder_type: string;
  channel: string;
  message: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  reference_month: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const REMINDER_TYPES = [
  { key: 'pre_due',      label: 'Pre-Due',       desc: 'Days before rent is due' },
  { key: 'due_today',    label: 'Due Today',      desc: 'Morning of due date' },
  { key: 'day_1',        label: 'Day 1 Overdue',  desc: '1 day after due date' },
  { key: 'day_3',        label: 'Day 3 Overdue',  desc: '3 days after due date' },
  { key: 'day_7',        label: 'Day 7 Overdue',  desc: '7 days after due date' },
  { key: 'day_14',       label: 'Day 14 Overdue', desc: '14 days after due date' },
  { key: 'final_notice', label: 'Final Notice',   desc: '30 days overdue' },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  sent:     <CheckCircle className="w-4 h-4 text-emerald-500" />,
  pending:  <Clock className="w-4 h-4 text-amber-500" />,
  failed:   <XCircle className="w-4 h-4 text-red-500" />,
  delivered:<CheckCircle className="w-4 h-4 text-green-600" />,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MpesaRemindersPage() {
  const [tab, setTab] = useState<'history' | 'rules'>('history');

  // ── History state ──────────────────────────────────────────────────────────
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // ── Rules state ────────────────────────────────────────────────────────────
  const [rules, setRules] = useState<ReminderRule | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateDraft, setTemplateDraft] = useState('');
  const [rulesDirty, setRulesDirty] = useState(false);

  // ── Manual trigger ─────────────────────────────────────────────────────────
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const res = await mpesaApi.listReminders({ status: statusFilter || undefined, limit: 100 });
    setLoadingHistory(false);
    if (res.success) {
      setReminders(res.data.reminders || []);
      setTotal(res.data.total || 0);
      setPendingCount(res.data.pending_count || 0);
      setSentCount(res.data.sent_count || 0);
    }
  }, [statusFilter]);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    const res = await mpesaApi.getReminderRules();
    setLoadingRules(false);
    if (res.success) setRules(res.data);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => { if (tab === 'rules' && !rules) loadRules(); }, [tab, rules, loadRules]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function updateRule<K extends keyof ReminderRule>(key: K, val: ReminderRule[K]) {
    if (!rules) return;
    setRules({ ...rules, [key]: val });
    setRulesDirty(true);
  }

  function updateChannel(type: string, channel: string) {
    if (!rules) return;
    const channels = { ...rules.channels, [type]: channel };
    setRules({ ...rules, channels });
    setRulesDirty(true);
  }

  function toggleType(type: string) {
    if (!rules) return;
    const enabled_types = { ...rules.enabled_types, [type]: !rules.enabled_types[type] };
    setRules({ ...rules, enabled_types });
    setRulesDirty(true);
  }

  function saveTemplate(type: string) {
    if (!rules) return;
    const escalation_rules = { ...rules.escalation_rules, [type]: templateDraft };
    setRules({ ...rules, escalation_rules });
    setEditingTemplate(null);
    setRulesDirty(true);
  }

  async function saveRules() {
    if (!rules) return;
    setSavingRules(true);
    await mpesaApi.saveReminderRules(rules);
    setSavingRules(false);
    setRulesDirty(false);
  }

  async function triggerReminders() {
    setTriggering(true);
    setTriggerMsg('');
    const res = await mpesaApi.triggerReminders();
    setTriggering(false);
    if (res.success) {
      const r = res.data;
      setTriggerMsg(`✅ Triggered ${r.triggered} reminder(s).`);
      loadHistory();
    } else {
      setTriggerMsg(`❌ ${res.error}`);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/owner/mpesa" className="p-2 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reminders</h1>
          <p className="text-sm text-slate-400">{total} total · {sentCount} sent this month</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={triggerReminders}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {triggering ? 'Sending…' : 'Send All Overdue'}
          </button>
        </div>
      </div>

      {triggerMsg && (
        <div className={`text-sm px-4 py-3 rounded-xl ${triggerMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {triggerMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          History
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'rules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Rules & Templates
        </button>
      </div>

      {/* ── HISTORY TAB ────────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 flex flex-wrap gap-2 items-center">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="delivered">Delivered</option>
            </select>
            <button onClick={loadHistory} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No reminders found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-50 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-medium">Tenant</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Month</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reminders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.tenant_name || '—'}</p>
                      <p className="text-xs text-slate-400">{r.tenant_phone || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {r.reminder_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.channel === 'sms' ? 'bg-slate-100 text-slate-600' : 'bg-green-50 text-green-700'}`}>
                        {r.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.reference_month || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICON[r.status] || <Clock className="w-4 h-4 text-slate-300" />}
                        <span className="text-xs text-slate-600 capitalize">{r.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── RULES TAB ──────────────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div className="space-y-4">
          {loadingRules ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !rules ? (
            <div className="text-center text-slate-400 text-sm">Failed to load rules.</div>
          ) : (
            <>
              {/* Master toggle + pre-due days */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">Reminder Engine</h3>
                    <p className="text-xs text-slate-400">Automatically send reminders based on rent due dates</p>
                  </div>
                  <button onClick={() => updateRule('is_active', !rules.is_active)}>
                    {rules.is_active
                      ? <ToggleRight className="w-10 h-6 text-green-600" />
                      : <ToggleLeft className="w-10 h-6 text-slate-300" />
                    }
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600">Days before due for pre-due reminder:</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={rules.pre_due_days}
                    onChange={e => updateRule('pre_due_days', parseInt(e.target.value))}
                    className="w-20 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-xs text-slate-400">days</span>
                </div>
              </div>

              {/* Per-type config */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                  <h3 className="font-semibold text-slate-800">Reminder Types</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure which reminders to send and how</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {REMINDER_TYPES.map((rt) => {
                    const enabled = rules.enabled_types[rt.key] ?? true;
                    const channel = rules.channels[rt.key] || 'sms';
                    const template = rules.escalation_rules[rt.key] || '';
                    const isEditing = editingTemplate === rt.key;

                    return (
                      <div key={rt.key} className="p-4">
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleType(rt.key)} className="mt-0.5">
                            {enabled
                              ? <ToggleRight className="w-8 h-5 text-green-600" />
                              : <ToggleLeft className="w-8 h-5 text-slate-300" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div>
                                <p className="font-medium text-slate-800 text-sm">{rt.label}</p>
                                <p className="text-xs text-slate-400">{rt.desc}</p>
                              </div>
                              {enabled && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <span className="text-xs text-slate-500">Channel:</span>
                                  <select
                                    value={channel}
                                    onChange={e => updateChannel(rt.key, e.target.value)}
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="sms">SMS</option>
                                    <option value="whatsapp">WhatsApp</option>
                                  </select>
                                  <button
                                    onClick={() => { setEditingTemplate(rt.key); setTemplateDraft(template); }}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-2 py-1"
                                  >
                                    <Edit3 className="w-3 h-3" /> Edit Template
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Template editor */}
                            {isEditing && (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={templateDraft}
                                  onChange={e => setTemplateDraft(e.target.value)}
                                  rows={4}
                                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder="Use {name}, {amount}, {unit}, {date}, {shortcode}, {reference}, {late_fee}, {total}, {days}"
                                />
                                <div className="flex flex-wrap gap-1">
                                  {['{name}','{amount}','{unit}','{date}','{shortcode}','{reference}','{late_fee}','{total}','{days}'].map(v => (
                                    <button key={v} onClick={() => setTemplateDraft(d => d + v)}
                                      className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-200">
                                      {v}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingTemplate(null)}
                                    className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                                    Cancel
                                  </button>
                                  <button onClick={() => saveTemplate(rt.key)}
                                    className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                                    <Save className="w-3 h-3" /> Save Template
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Template preview (non-editing) */}
                            {!isEditing && enabled && template && (
                              <p className="mt-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 italic truncate">
                                {template}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save button */}
              {rulesDirty && (
                <div className="flex justify-end">
                  <button
                    onClick={saveRules}
                    disabled={savingRules}
                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {savingRules ? 'Saving…' : 'Save Rules'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
