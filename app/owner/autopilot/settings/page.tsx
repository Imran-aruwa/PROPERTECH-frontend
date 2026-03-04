'use client';

import { useState, useEffect } from 'react';
import { Shield, Zap, Bell, RefreshCw, Save } from 'lucide-react';
import { autopilotSettingsApi } from '@/app/lib/api/automation';
import { AutopilotSettings, AutopilotMode } from '@/types/automation';

const MODE_CARDS: { mode: AutopilotMode; title: string; description: string; icon: React.ReactNode; color: string; border: string }[] = [
  {
    mode: 'full_auto',
    title: 'Full Auto',
    description: 'Autopilot executes every action automatically with no intervention required. Ideal when you trust your rules completely.',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-green-600',
    border: 'border-green-500',
  },
  {
    mode: 'approval_required',
    title: 'Approval Required',
    description: 'Every automation execution must be approved by you before it runs. Best for high-stakes situations.',
    icon: <Shield className="w-6 h-6" />,
    color: 'text-amber-600',
    border: 'border-amber-500',
  },
  {
    mode: 'notify_only',
    title: 'Notify Only',
    description: 'Autopilot watches events and notifies you, but takes no automatic actions. Safe for getting started.',
    icon: <Bell className="w-6 h-6" />,
    color: 'text-slate-600',
    border: 'border-slate-400',
  },
];

export default function AutopilotSettingsPage() {
  const [settings, setSettings] = useState<AutopilotSettings | null>(null);
  const [form, setForm] = useState({
    is_enabled: false,
    mode: 'notify_only' as AutopilotMode,
    quiet_hours_start: 21,
    quiet_hours_end: 7,
    max_actions_per_day: 50,
    excluded_property_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    autopilotSettingsApi.get().then(res => {
      if (res.success && res.data) {
        setSettings(res.data);
        setForm({
          is_enabled: res.data.is_enabled,
          mode: res.data.mode as AutopilotMode,
          quiet_hours_start: res.data.quiet_hours_start,
          quiet_hours_end: res.data.quiet_hours_end,
          max_actions_per_day: res.data.max_actions_per_day,
          excluded_property_ids: res.data.excluded_property_ids || [],
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await autopilotSettingsApi.update(form);
    if (res.success) { setSettings(res.data!); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="p-6 space-y-8 bg-bg-secondary min-h-screen max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-tx-primary">Autopilot Settings</h1>
        <p className="text-sm text-tx-secondary mt-1">Configure how the autonomous property manager behaves</p>
      </div>

      {/* Mode Selector */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-tx-secondary uppercase tracking-wide">Operating Mode</h2>
        <div className="space-y-3">
          {MODE_CARDS.map(card => (
            <button
              key={card.mode}
              onClick={() => setForm(f => ({ ...f, mode: card.mode }))}
              className={`w-full flex items-center gap-4 p-4 bg-bg-card rounded-xl border-2 text-left transition-all ${
                form.mode === card.mode ? `${card.border} shadow-sm` : 'border-bd hover:border-bd-strong'
              }`}
            >
              <div className={`${card.color} flex-shrink-0`}>{card.icon}</div>
              <div>
                <p className={`font-semibold text-sm ${form.mode === card.mode ? card.color : 'text-tx-primary'}`}>
                  {card.title}
                </p>
                <p className="text-xs text-tx-secondary mt-0.5">{card.description}</p>
              </div>
              {form.mode === card.mode && (
                <div className={`ml-auto w-4 h-4 rounded-full border-2 ${card.border} flex items-center justify-center flex-shrink-0`}>
                  <div className={`w-2 h-2 rounded-full ${
                    card.mode === 'full_auto' ? 'bg-green-500' :
                    card.mode === 'approval_required' ? 'bg-amber-500' : 'bg-slate-500'
                  }`} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Quiet Hours */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-tx-secondary uppercase tracking-wide">Quiet Hours (EAT — Africa/Nairobi)</h2>
        <p className="text-xs text-tx-muted">Autopilot will not act during these hours. Overnight windows (e.g. 21:00–07:00) are handled correctly.</p>
        <div className="grid grid-cols-2 gap-4 bg-bg-card p-4 rounded-xl border border-bd">
          <div>
            <label className="text-xs font-medium text-tx-secondary">Start</label>
            <input
              type="number"
              min={0} max={23}
              className="mt-1 w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-input-bg text-tx-primary"
              value={form.quiet_hours_start}
              onChange={e => setForm(f => ({ ...f, quiet_hours_start: parseInt(e.target.value) }))}
            />
            <p className="text-xs text-tx-muted mt-1">{form.quiet_hours_start}:00 EAT</p>
          </div>
          <div>
            <label className="text-xs font-medium text-tx-secondary">End</label>
            <input
              type="number"
              min={0} max={23}
              className="mt-1 w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-input-bg text-tx-primary"
              value={form.quiet_hours_end}
              onChange={e => setForm(f => ({ ...f, quiet_hours_end: parseInt(e.target.value) }))}
            />
            <p className="text-xs text-tx-muted mt-1">{form.quiet_hours_end}:00 EAT</p>
          </div>
        </div>
      </section>

      {/* Max Actions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-tx-secondary uppercase tracking-wide">Daily Action Cap</h2>
        <div className="bg-bg-card p-4 rounded-xl border border-bd">
          <label className="text-xs font-medium text-tx-secondary">Maximum actions per day</label>
          <input
            type="number"
            min={1} max={500}
            className="mt-2 w-full border border-input-border rounded-lg px-3 py-2 text-sm bg-input-bg text-tx-primary"
            value={form.max_actions_per_day}
            onChange={e => setForm(f => ({ ...f, max_actions_per_day: parseInt(e.target.value) || 50 }))}
          />
          <p className="text-xs text-tx-muted mt-1">Autopilot stops after this many actions in a single day</p>
        </div>
      </section>

      {/* Master Enable */}
      <section className="bg-bg-card border border-bd rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-tx-primary">Enable Autopilot</p>
            <p className="text-xs text-tx-secondary mt-0.5">Turn the autonomous property manager on or off</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, is_enabled: !f.is_enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
              form.is_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
            }`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
              form.is_enabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saved ? <><Shield className="w-4 h-4" /> Saved!</> : saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Settings</>}
      </button>

      {settings && (
        <p className="text-xs text-tx-muted text-center">
          Last updated {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
