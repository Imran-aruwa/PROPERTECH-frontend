'use client';

import { useState, useEffect, useCallback } from 'react';
import { accountingApi } from '@/app/lib/api-services';
import {
  BookOpen, TrendingUp, Calculator, Download,
  Plus, RefreshCw, Filter, X, ChevronDown,
  FileText, FileSpreadsheet, Building2, AlertCircle,
  CheckCircle2, Clock, DollarSign, BarChart3,
  ArrowUpRight, ArrowDownRight, Loader2, Upload,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─────────────────────────── Types ───────────────────────────

type EntryType = 'income' | 'expense';
type LandlordType = 'resident_individual' | 'non_resident' | 'corporate';

interface AccountingEntry {
  id: string;
  entry_type: EntryType;
  category: string;
  amount: number;
  description?: string;
  reference_number?: string;
  entry_date: string;
  tax_period?: string;
  property_id?: string;
  is_reconciled: boolean;
  synced_from_payment_id?: string;
  created_at: string;
}

interface TaxRecord {
  id: string;
  tax_year: number;
  tax_period: string;
  gross_rental_income: number;
  allowable_deductions: number;
  net_taxable_income: number;
  tax_liability: number;
  tax_rate_applied: number;
  landlord_type: string;
  kra_pin?: string;
  above_threshold: boolean;
  status: 'draft' | 'filed' | 'paid';
  filed_at?: string;
  notes?: string;
  created_at: string;
}

interface WithholdingEntry {
  id: string;
  tenant_name?: string;
  period: string;
  amount_paid: number;
  withholding_rate: number;
  withholding_amount: number;
  certificate_number?: string;
}

interface PnLReport {
  period: string;
  gross_income: number;
  total_expenses: number;
  net_profit: number;
  net_margin_pct: number;
  income_breakdown: Record<string, number>;
  expense_breakdown: Record<string, number>;
}

interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface TaxSummary {
  period: string;
  gross_rental_income: number;
  allowable_deductions: number;
  net_taxable_income: number;
  tax_rate_applied: number;
  tax_liability: number;
  above_mri_threshold: boolean;
  calculation_method: string;
  breakdown: Record<string, any>;
  mri_threshold: number;
}

// ─────────────────────────── Constants ───────────────────────────

const INCOME_CATEGORIES = [
  { value: 'rental_income', label: 'Rental Income' },
  { value: 'deposit_received', label: 'Deposit Received' },
  { value: 'late_fee', label: 'Late Fee' },
  { value: 'service_charge', label: 'Service Charge' },
  { value: 'other_income', label: 'Other Income' },
];

const EXPENSE_CATEGORIES = [
  { value: 'mortgage_interest', label: 'Mortgage Interest' },
  { value: 'repairs_maintenance', label: 'Repairs & Maintenance' },
  { value: 'property_management_fees', label: 'Management Fees' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'land_rates', label: 'Land Rates' },
  { value: 'ground_rent', label: 'Ground Rent' },
  { value: 'legal_fees', label: 'Legal Fees' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'depreciation', label: 'Depreciation' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'caretaker_salary', label: 'Staff Salary' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other Expense' },
];

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const CHART_COLORS = ['#1a56db', '#7e3af2', '#057a55', '#c27803', '#e02424', '#1c64f2', '#6875f5', '#31c48d'];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmt(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${n.toFixed(0)}`;
}

// ─────────────────────────── Entry Form Modal ───────────────────────────

interface EntryModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function EntryModal({ onClose, onSaved }: EntryModalProps) {
  const [form, setForm] = useState({
    entry_type: 'income' as EntryType,
    category: 'rental_income',
    amount: '',
    description: '',
    reference_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    property_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = form.entry_type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (type: EntryType) => {
    setForm(f => ({
      ...f,
      entry_type: type,
      category: type === 'income' ? 'rental_income' : 'repairs_maintenance',
    }));
  };

  const handleSubmit = async () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      setError('Please enter a valid amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await accountingApi.createEntry({
        ...form,
        amount: parseFloat(form.amount),
        property_id: form.property_id || undefined,
      });
      if (res.success) {
        onSaved();
        onClose();
      } else {
        setError(res.error || 'Failed to save entry');
      }
    } catch {
      setError('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add Accounting Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {(['income', 'expense'] as EntryType[]).map(t => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.entry_type === t
                    ? t === 'income'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'income' ? '↑ Income' : '↓ Expense'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.entry_date}
                onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Brief description..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
              <input
                type="text"
                placeholder="Receipt / invoice ref"
                value={form.reference_number}
                onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.property_id}
                onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Withholding Modal ───────────────────────────

interface WhtModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function WhtModal({ onClose, onSaved }: WhtModalProps) {
  const [form, setForm] = useState({
    tenant_name: '',
    tenant_kra_pin: '',
    amount_paid: '',
    withholding_rate: '10',
    period: new Date().toISOString().slice(0, 7),
    certificate_number: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await accountingApi.createWithholdingEntry({
        ...form,
        amount_paid: parseFloat(form.amount_paid),
        withholding_rate: parseFloat(form.withholding_rate),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const whtAmount = form.amount_paid ? parseFloat(form.amount_paid) * parseFloat(form.withholding_rate || '0') / 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add Withholding Tax Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Record when a corporate tenant deducts withholding tax before remitting rent.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
              <input type="text" value={form.tenant_name} onChange={e => setForm(f => ({ ...f, tenant_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant KRA PIN</label>
              <input type="text" placeholder="P0123..." value={form.tenant_kra_pin} onChange={e => setForm(f => ({ ...f, tenant_kra_pin: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <input type="month" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount Received (KES)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WHT Rate (%)</label>
              <select value={form.withholding_rate} onChange={e => setForm(f => ({ ...f, withholding_rate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="10">10% (Resident Corporate)</option>
                <option value="30">30% (Non-Resident)</option>
              </select>
            </div>
            {whtAmount > 0 && (
              <div className="col-span-2 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                WHT Deducted: <strong>{fmt(whtAmount)}</strong> — Gross Rent Was: <strong>{fmt(parseFloat(form.amount_paid) + whtAmount)}</strong>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
              <input type="text" placeholder="WHT cert number" value={form.certificate_number} onChange={e => setForm(f => ({ ...f, certificate_number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Main Page ───────────────────────────

type Tab = 'ledger' | 'reports' | 'tax' | 'export';

export default function AccountingPage() {
  const [tab, setTab] = useState<Tab>('ledger');
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth() + 1;

  // ── Ledger state ──
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // ── Reports state ──
  const [reportYear, setReportYear] = useState(thisYear);
  const [reportMonth, setReportMonth] = useState(thisMonth);
  const [reportPeriod, setReportPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [pnl, setPnl] = useState<PnLReport | null>(null);
  const [cashflow, setCashflow] = useState<CashFlowMonth[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // ── Tax state ──
  const [taxYear, setTaxYear] = useState(thisYear);
  const [taxMonth, setTaxMonth] = useState(thisMonth);
  const [taxPeriodType, setTaxPeriodType] = useState<'monthly' | 'annual'>('monthly');
  const [landlordType, setLandlordType] = useState<LandlordType>('resident_individual');
  const [kraPin, setKraPin] = useState('');
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [loadingTax, setLoadingTax] = useState(false);
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [whtEntries, setWhtEntries] = useState<WithholdingEntry[]>([]);
  const [showWhtModal, setShowWhtModal] = useState(false);
  const [savingTaxRecord, setSavingTaxRecord] = useState(false);

  // ── Export state ──
  const [exportYear, setExportYear] = useState(thisYear);
  const [exportMonth, setExportMonth] = useState(thisMonth);
  const [exportPeriodType, setExportPeriodType] = useState<'monthly' | 'annual'>('monthly');
  const [exporting, setExporting] = useState<string>('');

  // ── Load entries ──
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const res = await accountingApi.listEntries({
        entry_type: filterType || undefined,
        category: filterCategory || undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        limit: 100,
      });
      if (res.success && res.data?.entries) {
        setEntries(res.data.entries);
        setEntriesTotal(res.data.total || res.data.entries.length);
      }
    } catch { /* silent */ }
    finally { setLoadingEntries(false); }
  }, [filterType, filterCategory, filterDateFrom, filterDateTo]);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const [pnlRes, cfRes] = await Promise.all([
        accountingApi.getPnL({ year: reportYear, month: reportPeriod === 'annual' ? undefined : reportMonth, period: reportPeriod }),
        accountingApi.getCashflow({ year: reportYear }),
      ]);
      if (pnlRes.success && pnlRes.data?.report) setPnl(pnlRes.data.report);
      if (cfRes.success && cfRes.data?.cashflow) setCashflow(cfRes.data.cashflow);
    } catch { /* silent */ }
    finally { setLoadingReports(false); }
  }, [reportYear, reportMonth, reportPeriod]);

  const loadTaxData = useCallback(async () => {
    setLoadingTax(true);
    try {
      const [summaryRes, recordsRes, whtRes] = await Promise.all([
        accountingApi.getTaxSummary({
          year: taxYear,
          month: taxPeriodType === 'monthly' ? taxMonth : undefined,
          period_type: taxPeriodType,
          landlord_type: landlordType,
        }),
        accountingApi.listTaxRecords({ year: taxYear }),
        accountingApi.listWithholding(),
      ]);
      if (summaryRes.success && summaryRes.data?.tax_summary) setTaxSummary(summaryRes.data.tax_summary);
      if (recordsRes.success && recordsRes.data?.records) setTaxRecords(recordsRes.data.records);
      if (whtRes.success && whtRes.data?.entries) setWhtEntries(whtRes.data.entries);
    } catch { /* silent */ }
    finally { setLoadingTax(false); }
  }, [taxYear, taxMonth, taxPeriodType, landlordType]);

  // Initial load
  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { if (tab === 'reports') loadReports(); }, [tab, loadReports]);
  useEffect(() => { if (tab === 'tax') loadTaxData(); }, [tab, loadTaxData]);

  // ── Sync payments ──
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult('');
    try {
      const res = await accountingApi.syncPayments();
      if (res.success) {
        setSyncResult(res.data?.message || `Synced ${res.data?.synced ?? 0} payments`);
        loadEntries();
      }
    } catch { setSyncResult('Sync failed'); }
    finally { setSyncing(false); }
  };

  // ── Save tax record ──
  const handleSaveTaxRecord = async (recordStatus: 'draft' | 'filed') => {
    if (!taxSummary) return;
    setSavingTaxRecord(true);
    try {
      await accountingApi.createTaxRecord({
        tax_year: taxYear,
        tax_period: taxPeriodType === 'monthly' ? `${taxYear}-${String(taxMonth).padStart(2, '0')}` : 'annual',
        gross_rental_income: taxSummary.gross_rental_income,
        allowable_deductions: taxSummary.allowable_deductions,
        net_taxable_income: taxSummary.net_taxable_income,
        tax_liability: taxSummary.tax_liability,
        tax_rate_applied: taxSummary.tax_rate_applied,
        landlord_type: landlordType,
        kra_pin: kraPin || undefined,
        above_threshold: taxSummary.above_mri_threshold,
        status: recordStatus,
      });
      loadTaxData();
    } catch { /* silent */ }
    finally { setSavingTaxRecord(false); }
  };

  // ── Update tax record status ──
  const handleMarkFiled = async (recordId: string) => {
    try {
      await accountingApi.updateTaxRecord(recordId, { status: 'filed' });
      loadTaxData();
    } catch { /* silent */ }
  };

  // ── Export handlers ──
  const handleExport = async (type: 'pdf' | 'excel' | 'kra-schedule') => {
    setExporting(type);
    try {
      const params = new URLSearchParams({
        year: String(exportYear),
        ...(exportPeriodType === 'monthly' && { month: String(exportMonth) }),
        period_type: exportPeriodType,
        landlord_type: landlordType,
      });

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const endpoint =
        type === 'pdf' ? `/api/accounting/export/pdf?${params}`
        : type === 'excel' ? `/api/accounting/export/excel?${params}`
        : `/api/accounting/export/kra-schedule?${params}`;

      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        type === 'pdf' ? `propertech_report_${exportYear}.pdf`
        : type === 'excel' ? `propertech_accounts_${exportYear}.xlsx`
        : `kra_schedule_${exportYear}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setExporting(''); }
  };

  // ─── Running balance ───
  const runningBalance = entries.reduce((acc, e) => {
    return e.entry_type === 'income' ? acc + e.amount : acc - e.amount;
  }, 0);

  // ─── Expense chart data ───
  const expenseChartData = pnl
    ? Object.entries(pnl.expense_breakdown).map(([cat, amt]) => ({
        name: cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: amt,
      }))
    : [];

  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);

  // ─────────────────── RENDER ───────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounting & Tax</h1>
            <p className="text-sm text-gray-500 mt-0.5">KRA-ready financial management for your portfolio</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
              <Calculator className="w-3.5 h-3.5" /> Premium
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {([
            { id: 'ledger', icon: BookOpen, label: 'Ledger' },
            { id: 'reports', icon: BarChart3, label: 'Reports' },
            { id: 'tax', icon: Calculator, label: 'Tax Centre' },
            { id: 'export', icon: Download, label: 'Export' },
          ] as { id: Tab; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ══════════════════ TAB 1: LEDGER ══════════════════ */}
        {tab === 'ledger' && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-lg">
                    <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Income</p>
                    <p className="text-lg font-bold text-gray-900">
                      {fmtShort(entries.filter(e => e.entry_type === 'income').reduce((s, e) => s + e.amount, 0))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-100 rounded-lg">
                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Expenses</p>
                    <p className="text-lg font-bold text-gray-900">
                      {fmtShort(entries.filter(e => e.entry_type === 'expense').reduce((s, e) => s + e.amount, 0))}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl p-5 border ${runningBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${runningBalance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                    <DollarSign className={`w-5 h-5 ${runningBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Running Balance</p>
                    <p className={`text-lg font-bold ${runningBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {fmtShort(runningBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowEntryModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Entry
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync Payments
              </button>
              {syncResult && (
                <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  ✓ {syncResult}
                </span>
              )}

              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">All Categories</option>
                  {ALL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                <button onClick={loadEntries} className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800">
                  <Filter className="w-3.5 h-3.5" /> Filter
                </button>
              </div>
            </div>

            {/* Entries table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Entries ({entriesTotal})</h3>
                {loadingEntries && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Date', 'Type', 'Category', 'Description', 'Reference', 'Amount (KES)', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {entries.length === 0 && !loadingEntries && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          No entries yet. Add one or sync payments.
                        </td>
                      </tr>
                    )}
                    {entries.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{e.entry_date?.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            e.entry_type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {e.entry_type === 'income' ? '↑' : '↓'} {e.entry_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{e.category.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{e.description || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{e.reference_number || '—'}</td>
                        <td className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${
                          e.entry_type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {e.entry_type === 'income' ? '+' : '-'}{fmt(e.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {e.synced_from_payment_id && (
                            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">synced</span>
                          )}
                          {e.is_reconciled && (
                            <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB 2: REPORTS ══════════════════ */}
        {tab === 'reports' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
                  <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                  <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {reportPeriod !== 'annual' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                    <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                )}
                <button
                  onClick={loadReports}
                  disabled={loadingReports}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingReports ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  Generate Report
                </button>
              </div>
            </div>

            {pnl && (
              <>
                {/* P&L Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Gross Income', value: pnl.gross_income, color: 'emerald' },
                    { label: 'Total Expenses', value: pnl.total_expenses, color: 'red' },
                    { label: 'Net Profit', value: pnl.net_profit, color: pnl.net_profit >= 0 ? 'blue' : 'red' },
                    { label: 'Net Margin', value: null, extra: `${pnl.net_margin_pct.toFixed(1)}%`, color: pnl.net_margin_pct >= 0 ? 'purple' : 'red' },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                      <p className={`text-xl font-bold text-${card.color}-600`}>
                        {card.extra || fmtShort(card.value!)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Cash Flow Chart */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Monthly Cash Flow ({reportYear})</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={cashflow} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtShort(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `Period: ${l}`} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#057a55" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#e02424" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Expense Breakdown Chart */}
                {expenseChartData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                      <ResponsiveContainer width={280} height={280}>
                        <PieChart>
                          <Pie
                            data={expenseChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {expenseChartData.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 flex-1">
                        {expenseChartData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                              <span className="text-gray-700">{item.name}</span>
                            </div>
                            <span className="font-medium text-gray-900">{fmt(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {!pnl && !loadingReports && (
              <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                Select a period and click <strong>Generate Report</strong>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ TAB 3: TAX CENTRE ══════════════════ */}
        {tab === 'tax' && (
          <div className="space-y-6">
            {/* Tax settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Tax Computation Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Landlord Type</label>
                  <select value={landlordType} onChange={e => setLandlordType(e.target.value as LandlordType)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="resident_individual">Resident Individual</option>
                    <option value="non_resident">Non-Resident</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Period Type</label>
                  <select value={taxPeriodType} onChange={e => setTaxPeriodType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                  <select value={taxYear} onChange={e => setTaxYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {taxPeriodType === 'monthly' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                    <select value={taxMonth} onChange={e => setTaxMonth(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">KRA PIN (saved to record)</label>
                  <input
                    type="text"
                    placeholder="e.g. A012345678Z"
                    value={kraPin}
                    onChange={e => setKraPin(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={loadTaxData}
                  disabled={loadingTax}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingTax ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  Compute Tax
                </button>
              </div>
            </div>

            {/* Tax computation result */}
            {taxSummary && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className={`px-6 py-4 border-b ${taxSummary.above_mri_threshold ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Tax Computation — {taxSummary.period}</h3>
                      <p className="text-sm text-gray-600 mt-0.5">{taxSummary.calculation_method}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      taxSummary.above_mri_threshold
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {taxSummary.above_mri_threshold
                        ? `Above KES ${(taxSummary.mri_threshold / 1_000_000).toFixed(0)}M Threshold`
                        : `Below KES ${(taxSummary.mri_threshold / 1_000_000).toFixed(0)}M Threshold`}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Gross Rental Income', value: fmt(taxSummary.gross_rental_income), highlight: false },
                      { label: 'Allowable Deductions', value: fmt(taxSummary.allowable_deductions), highlight: false },
                      { label: 'Net Taxable Income', value: fmt(taxSummary.net_taxable_income), highlight: false },
                      { label: 'Tax Rate Applied', value: `${(taxSummary.tax_rate_applied * 100).toFixed(2)}%`, highlight: false },
                      { label: 'Tax Liability', value: fmt(taxSummary.tax_liability), highlight: true },
                    ].map(item => (
                      <div key={item.label} className={`rounded-xl p-4 ${item.highlight ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className={`text-lg font-bold ${item.highlight ? 'text-red-700' : 'text-gray-900'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSaveTaxRecord('draft')}
                      disabled={savingTaxRecord}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      {savingTaxRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Save as Draft
                    </button>
                    <button
                      onClick={() => handleSaveTaxRecord('filed')}
                      disabled={savingTaxRecord}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingTaxRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Mark as Filed
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Withholding Tax section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">Withholding Tax</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Corporate tenants who deduct WHT before remitting rent</p>
                </div>
                <button
                  onClick={() => setShowWhtModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Certificate
                </button>
              </div>
              {whtEntries.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No withholding tax entries yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Period', 'Tenant', 'Net Received', 'WHT Rate', 'WHT Amount', 'Certificate'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {whtEntries.map(w => (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{w.period}</td>
                          <td className="px-4 py-3 text-sm">{w.tenant_name || '—'}</td>
                          <td className="px-4 py-3 text-sm font-medium">{fmt(w.amount_paid)}</td>
                          <td className="px-4 py-3 text-sm">{w.withholding_rate}%</td>
                          <td className="px-4 py-3 text-sm text-red-600 font-medium">{fmt(w.withholding_amount)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{w.certificate_number || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tax Records History */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Tax Filing History</h3>
              </div>
              {taxRecords.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No saved tax records yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Period', 'Gross Income', 'Tax Liability', 'Rate', 'Status', 'KRA PIN', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {taxRecords.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{r.tax_year} / {r.tax_period}</td>
                          <td className="px-4 py-3 text-sm">{fmt(r.gross_rental_income)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600">{fmt(r.tax_liability)}</td>
                          <td className="px-4 py-3 text-sm">{(r.tax_rate_applied * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.status === 'filed' ? 'bg-emerald-100 text-emerald-700'
                              : r.status === 'paid' ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{r.kra_pin || '—'}</td>
                          <td className="px-4 py-3">
                            {r.status === 'draft' && (
                              <button
                                onClick={() => handleMarkFiled(r.id)}
                                className="text-xs text-emerald-600 hover:underline font-medium"
                              >
                                Mark Filed
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
          </div>
        )}

        {/* ══════════════════ TAB 4: EXPORT ══════════════════ */}
        {tab === 'export' && (
          <div className="space-y-6">
            {/* Period selectors */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Export Settings</h3>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Period Type</label>
                  <select value={exportPeriodType} onChange={e => setExportPeriodType(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                  <select value={exportYear} onChange={e => setExportYear(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {exportPeriodType === 'monthly' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                    <select value={exportMonth} onChange={e => setExportMonth(Number(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Export cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  type: 'pdf',
                  icon: FileText,
                  title: 'P&L Report (PDF)',
                  desc: 'Profit & Loss statement + KRA tax computation. Professional format for accountants.',
                  color: 'red',
                  bg: 'bg-red-50',
                  border: 'border-red-200',
                },
                {
                  type: 'excel',
                  icon: FileSpreadsheet,
                  title: 'Full Accounts (Excel)',
                  desc: 'Multi-sheet workbook: Income, Expenses, P&L, Tax Summary, Withholding Tax.',
                  color: 'emerald',
                  bg: 'bg-emerald-50',
                  border: 'border-emerald-200',
                },
                {
                  type: 'kra-schedule',
                  icon: Building2,
                  title: 'KRA Rental Schedule (CSV)',
                  desc: 'iTax annual return format: Property | Annual Rent | Deductions | Net Income.',
                  color: 'blue',
                  bg: 'bg-blue-50',
                  border: 'border-blue-200',
                },
              ].map(({ type, icon: Icon, title, desc, color, bg, border }) => (
                <div key={type} className={`rounded-2xl border ${border} ${bg} p-6`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-white rounded-xl shadow-sm border ${border}`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{desc}</p>
                      <button
                        onClick={() => handleExport(type as any)}
                        disabled={!!exporting}
                        className={`flex items-center gap-2 px-4 py-2.5 bg-${color}-600 text-white rounded-xl text-sm font-medium hover:bg-${color}-700 disabled:opacity-50 transition-colors`}
                      >
                        {exporting === type
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                          : <><Download className="w-4 h-4" /> Download</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* KRA reference note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>KRA iTax Filing Reference</strong>
                  <p className="mt-1">The KRA Rental Schedule export matches the format of the rental income section in the KRA annual return form (rental income schedule). Use this when completing your iTax return. Always confirm figures with a licensed Kenyan tax advisor before filing.</p>
                  <p className="mt-2">Finance Act 2023 rates: <strong>10% MRI</strong> on gross rent for resident individuals with annual rent ≤ KES 15,000,000. <strong>30%</strong> for non-residents and corporates (on net for corporates).</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEntryModal && (
        <EntryModal onClose={() => setShowEntryModal(false)} onSaved={loadEntries} />
      )}
      {showWhtModal && (
        <WhtModal onClose={() => setShowWhtModal(false)} onSaved={loadTaxData} />
      )}
    </div>
  );
}
