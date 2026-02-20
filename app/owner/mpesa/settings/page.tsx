'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { mpesaApi } from '@/app/lib/api-services';
import {
  ArrowLeft, Smartphone, Save, TestTube, Link2, CheckCircle,
  AlertTriangle, Eye, EyeOff, Copy, Info
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MpesaConfig {
  id: string;
  shortcode: string;
  shortcode_type: string;
  account_reference_format: string;
  environment: string;
  callback_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MpesaSettingsPage() {
  const [config, setConfig] = useState<MpesaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [shortcode, setShortcode] = useState('');
  const [shortcodeType, setShortcodeType] = useState<'paybill' | 'till'>('paybill');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [passkey, setPasskey] = useState('');
  const [refFormat, setRefFormat] = useState('UNIT-{unit_number}');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [testPhone, setTestPhone] = useState('');

  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [regResult, setRegResult] = useState<{ confirmation_url: string; validation_url: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await mpesaApi.getConfig();
    setLoading(false);
    if (res.success && res.data) {
      const c: MpesaConfig = res.data;
      setConfig(c);
      setShortcode(c.shortcode);
      setShortcodeType(c.shortcode_type as 'paybill' | 'till');
      setRefFormat(c.account_reference_format || 'UNIT-{unit_number}');
      setEnvironment(c.environment as 'sandbox' | 'production');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!shortcode || !consumerKey || !consumerSecret) {
      setMsg({ type: 'error', text: 'Shortcode, Consumer Key and Consumer Secret are required.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await mpesaApi.saveConfig({
      shortcode,
      shortcode_type: shortcodeType,
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      passkey: passkey || undefined,
      account_reference_format: refFormat,
      environment,
    });
    setSaving(false);
    if (res.success) {
      setMsg({ type: 'success', text: 'Configuration saved! Your Mpesa credentials are active.' });
      load();
      // Clear secrets from state for security
      setConsumerKey('');
      setConsumerSecret('');
      setPasskey('');
    } else {
      setMsg({ type: 'error', text: res.error || 'Failed to save configuration.' });
    }
  }

  async function testConnection() {
    if (!testPhone) {
      setMsg({ type: 'error', text: 'Enter a phone number to receive the test STK push.' });
      return;
    }
    setTesting(true);
    setMsg(null);
    const res = await mpesaApi.testConnection(testPhone);
    setTesting(false);
    if (res.success) {
      if (res.data?.success) {
        setMsg({ type: 'success', text: `✅ Test STK push sent to ${testPhone}. Check your phone for a KES 1 payment prompt.` });
      } else {
        setMsg({ type: 'error', text: `STK Push failed: ${res.data?.message || 'Unknown error'}` });
      }
    } else {
      setMsg({ type: 'error', text: res.error || 'Test failed.' });
    }
  }

  async function registerUrls() {
    setRegistering(true);
    setMsg(null);
    const res = await mpesaApi.registerUrls();
    setRegistering(false);
    if (res.success) {
      setRegResult({
        confirmation_url: res.data.confirmation_url,
        validation_url: res.data.validation_url,
      });
      setMsg({ type: 'success', text: 'C2B URLs registered with Safaricom successfully!' });
    } else {
      setMsg({ type: 'error', text: res.error || 'Registration failed.' });
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/owner/mpesa" className="p-2 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mpesa Settings</h1>
          <p className="text-sm text-slate-400">Configure your Safaricom Daraja integration</p>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {msg.text}
        </div>
      )}

      {/* Environment banner */}
      {config && config.environment === 'sandbox' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <Info className="w-4 h-4 flex-shrink-0" />
          You're in <strong>Sandbox</strong> mode. Switch to Production when ready to go live.
        </div>
      )}

      {/* Credentials form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Daraja API Credentials</h2>
        <p className="text-xs text-slate-400">
          Get these from <a href="https://developer.safaricom.co.ke" target="_blank" rel="noopener" className="text-green-600 hover:underline">developer.safaricom.co.ke</a>. Keep them confidential.
        </p>

        {/* Shortcode */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Shortcode</label>
            <input
              type="text"
              value={shortcode}
              onChange={e => setShortcode(e.target.value)}
              placeholder="174379"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Type</label>
            <select
              value={shortcodeType}
              onChange={e => setShortcodeType(e.target.value as 'paybill' | 'till')}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="paybill">Paybill</option>
              <option value="till">Till Number</option>
            </select>
          </div>
        </div>

        {/* Consumer Key */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Consumer Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={consumerKey}
              onChange={e => setConsumerKey(e.target.value)}
              placeholder={config ? '••••••••••••••••' : 'Paste consumer key'}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Consumer Secret */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Consumer Secret</label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={consumerSecret}
              onChange={e => setConsumerSecret(e.target.value)}
              placeholder={config ? '••••••••••••••••' : 'Paste consumer secret'}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Passkey (STK push only) */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Passkey <span className="font-normal text-slate-400">(required for STK Push)</span>
          </label>
          <div className="relative">
            <input
              type={showPasskey ? 'text' : 'password'}
              value={passkey}
              onChange={e => setPasskey(e.target.value)}
              placeholder={config ? '••••••••••••••••' : 'Paste Lipa Na Mpesa passkey'}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={() => setShowPasskey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Account Reference Format */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Account Reference Format</label>
          <input
            type="text"
            value={refFormat}
            onChange={e => setRefFormat(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Available variables: <code className="bg-slate-50 px-1 rounded">{'{unit_number}'}</code>, <code className="bg-slate-50 px-1 rounded">{'{tenant_name}'}</code>
          </p>
        </div>

        {/* Environment */}
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">Environment</label>
          <div className="flex gap-3">
            {(['sandbox', 'production'] as const).map((env) => (
              <label key={env} className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 cursor-pointer transition-all ${
                environment === env ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input type="radio" checked={environment === env} onChange={() => setEnvironment(env)} className="accent-green-600" />
                <span className="text-sm font-medium capitalize text-slate-700">{env}</span>
              </label>
            ))}
          </div>
          {environment === 'production' && (
            <p className="text-xs text-amber-600 mt-1.5">
              ⚠ Production mode — real money will be processed.
            </p>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Configuration'}
        </button>
      </div>

      {/* Test Connection */}
      {config && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Test Connection</h2>
          <p className="text-xs text-slate-400">
            Send a KES 1 STK push to your phone to verify your credentials work.
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="0712345678"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={testConnection}
              disabled={testing || !testPhone}
              className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-60"
            >
              <TestTube className="w-4 h-4" />
              {testing ? 'Sending…' : 'Test'}
            </button>
          </div>
        </div>
      )}

      {/* Register C2B URLs */}
      {config && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Register Callback URLs</h2>
          <p className="text-xs text-slate-400">
            Click once to register your PROPERTECH callback URLs with Safaricom. Required for receiving Paybill payments automatically.
          </p>

          {regResult && (
            <div className="space-y-2">
              {[
                { label: 'Confirmation URL', url: regResult.confirmation_url },
                { label: 'Validation URL', url: regResult.validation_url },
              ].map(({ label, url }) => (
                <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-xs font-mono text-slate-700 truncate">{url}</p>
                  </div>
                  <button onClick={() => copyToClipboard(url)} className="text-slate-400 hover:text-slate-600">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!regResult && config.callback_url && (
            <div className="space-y-2">
              {[
                { label: 'Confirmation URL', url: `${config.callback_url}/api/mpesa/callbacks/c2b/confirmation` },
                { label: 'Validation URL', url: `${config.callback_url}/api/mpesa/callbacks/c2b/validation` },
              ].map(({ label, url }) => (
                <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-xs font-mono text-slate-700 truncate">{url}</p>
                  </div>
                  <button onClick={() => copyToClipboard(url)} className="text-slate-400 hover:text-slate-600">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={registerUrls}
            disabled={registering}
            className="flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            <Link2 className="w-4 h-4" />
            {registering ? 'Registering…' : 'Register with Safaricom'}
          </button>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/owner/mpesa" className="text-slate-500 hover:text-slate-700">← Dashboard</Link>
        <Link href="/owner/mpesa/transactions" className="text-slate-500 hover:text-slate-700">Transactions</Link>
        <Link href="/owner/mpesa/reminders" className="text-slate-500 hover:text-slate-700">Reminders</Link>
      </div>
    </div>
  );
}
