'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lease, LeaseClause, LeasePaymentCycle, Property, Unit, Tenant } from '@/app/lib/types';
import { propertiesApi, unitsApi, tenantsApi, leasesApi } from '@/app/lib/api-services';
import { generateClausesFromTemplates, createCustomClause } from '@/app/lib/lease-templates';
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';

interface LeaseFormProps {
  mode: 'create' | 'edit';
  initialData?: Lease;
  leaseId?: number;
}

const CLAUSE_TYPE_COLORS: Record<string, string> = {
  rent: 'bg-green-100 text-green-700',
  termination: 'bg-red-100 text-red-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  pets: 'bg-purple-100 text-purple-700',
  utilities: 'bg-blue-100 text-blue-700',
  custom: 'bg-gray-100 text-gray-700',
};

const STEPS = ['Property & Tenant', 'Lease Terms', 'Clauses', 'Review & Send'];

export function LeaseForm({ mode, initialData, leaseId }: LeaseFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [propertyId, setPropertyId] = useState<number | ''>(initialData?.property_id || '');
  const [unitId, setUnitId] = useState<number | ''>(initialData?.unit_id || '');
  const [tenantId, setTenantId] = useState<number | ''>(initialData?.tenant_id || '');

  // Step 2
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [rentAmount, setRentAmount] = useState<number | ''>(initialData?.rent_amount || '');
  const [depositAmount, setDepositAmount] = useState<number | ''>(initialData?.deposit_amount || '');
  const [paymentCycle, setPaymentCycle] = useState<LeasePaymentCycle>(initialData?.payment_cycle || 'monthly');
  const [escalationRate, setEscalationRate] = useState<number | ''>(initialData?.escalation_rate || '');

  // Step 3
  const [clauses, setClauses] = useState<LeaseClause[]>(initialData?.clauses || []);
  const [clausesGenerated, setClausesGenerated] = useState(false);

  // Step 4
  const [channels, setChannels] = useState<Set<string>>(new Set(['email']));

  // Load properties on mount
  useEffect(() => {
    const load = async () => {
      const res = await propertiesApi.list();
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setProperties(data);
      }
    };
    load();
  }, []);

  // Load units when property changes
  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      return;
    }
    const load = async () => {
      const res = await unitsApi.list(propertyId.toString());
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setUnits(data);
      }
    };
    load();
  }, [propertyId]);

  // Load tenants
  useEffect(() => {
    const load = async () => {
      const res = await tenantsApi.list();
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setTenants(data);
      }
    };
    load();
  }, []);

  // Generate clauses when entering step 3
  useEffect(() => {
    if (step === 2 && !clausesGenerated && clauses.length === 0 && rentAmount && depositAmount) {
      setClauses(generateClausesFromTemplates(Number(rentAmount), Number(depositAmount)));
      setClausesGenerated(true);
    }
  }, [step, clausesGenerated, clauses.length, rentAmount, depositAmount]);

  const validateStep = (): boolean => {
    setError(null);
    switch (step) {
      case 0:
        if (!propertyId || !unitId || !tenantId) {
          setError('Please select a property, unit, and tenant');
          return false;
        }
        return true;
      case 1:
        if (!startDate || !endDate || !rentAmount || !depositAmount) {
          setError('Please fill in all required fields');
          return false;
        }
        if (new Date(endDate) <= new Date(startDate)) {
          setError('End date must be after start date');
          return false;
        }
        if (Number(rentAmount) <= 0 || Number(depositAmount) <= 0) {
          setError('Amounts must be greater than zero');
          return false;
        }
        return true;
      case 2:
        if (clauses.length === 0) {
          setError('At least one clause is required');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const buildPayload = () => ({
    property_id: Number(propertyId),
    unit_id: Number(unitId),
    tenant_id: Number(tenantId),
    start_date: startDate,
    end_date: endDate,
    rent_amount: Number(rentAmount),
    deposit_amount: Number(depositAmount),
    payment_cycle: paymentCycle,
    escalation_rate: escalationRate ? Number(escalationRate) : undefined,
    clauses,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      let res;
      if (mode === 'edit' && leaseId) {
        res = await leasesApi.update(leaseId, payload);
      } else {
        res = await leasesApi.create(payload);
      }
      if (res.success) {
        router.push('/owner/leases');
      } else {
        setError(res.error || 'Failed to save lease');
      }
    } catch {
      setError('Failed to save lease');
    } finally {
      setSaving(false);
    }
  };

  const handleSendForSigning = async () => {
    if (channels.size === 0) {
      setError('Select at least one delivery channel');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      let leaseRes;
      if (mode === 'edit' && leaseId) {
        leaseRes = await leasesApi.update(leaseId, payload);
      } else {
        leaseRes = await leasesApi.create(payload);
      }
      if (!leaseRes.success) {
        setError(leaseRes.error || 'Failed to save lease');
        return;
      }
      const createdId = leaseRes.data?.id || leaseId;
      if (createdId) {
        const sendRes = await leasesApi.send(createdId, Array.from(channels));
        if (!sendRes.success) {
          setError(sendRes.error || 'Lease saved but failed to send');
          return;
        }
      }
      router.push('/owner/leases');
    } catch {
      setError('Failed to send lease');
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  const updateClause = (id: string, text: string) => {
    setClauses((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  const removeClause = (id: string) => {
    setClauses((prev) => prev.filter((c) => c.id !== id));
  };

  const selectedProperty = properties.find((p) => p.id === Number(propertyId));
  const selectedUnit = units.find((u) => u.id === Number(unitId));
  const selectedTenant = tenants.find((t) => t.id === Number(tenantId));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`mt-1 text-xs hidden sm:block ${i === step ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Step 1: Property/Unit/Tenant */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Property, Unit & Tenant</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select
                value={propertyId}
                onChange={(e) => {
                  setPropertyId(e.target.value ? Number(e.target.value) : '');
                  setUnitId('');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.address}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                disabled={!propertyId}
              >
                <option value="">Select a unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>Unit {u.unit_number} — {u.status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="">Select a tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user?.full_name || t.user?.email || `Tenant #${t.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Lease Terms */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Lease Terms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount (KES)</label>
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 25000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (KES)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 25000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Cycle</label>
                <select
                  value={paymentCycle}
                  onChange={(e) => setPaymentCycle(e.target.value as LeasePaymentCycle)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Escalation (%)</label>
                <input
                  type="number"
                  value={escalationRate}
                  onChange={(e) => setEscalationRate(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Clauses */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lease Clauses</h2>
              <button
                type="button"
                onClick={() => setClauses((prev) => [...prev, createCustomClause()])}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Custom Clause
              </button>
            </div>
            {clauses.length === 0 && (
              <p className="text-gray-500 text-sm py-4 text-center">
                No clauses yet. They will be auto-generated when you enter lease terms.
              </p>
            )}
            <div className="space-y-3">
              {clauses.map((clause) => (
                <div key={clause.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      CLAUSE_TYPE_COLORS[clause.type] || CLAUSE_TYPE_COLORS.custom
                    }`}>
                      {clause.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeClause(clause.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {clause.editable ? (
                    <textarea
                      value={clause.text}
                      onChange={(e) => updateClause(clause.id, e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />
                  ) : (
                    <p className="text-sm text-gray-700">{clause.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review & Send */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Review & Send</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Property</p>
                <p className="font-medium text-gray-900">{selectedProperty?.name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Unit</p>
                <p className="font-medium text-gray-900">{selectedUnit?.unit_number || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Tenant</p>
                <p className="font-medium text-gray-900">
                  {selectedTenant?.user?.full_name || selectedTenant?.user?.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Payment Cycle</p>
                <p className="font-medium text-gray-900 capitalize">{paymentCycle}</p>
              </div>
              <div>
                <p className="text-gray-500">Lease Period</p>
                <p className="font-medium text-gray-900">{startDate} → {endDate}</p>
              </div>
              <div>
                <p className="text-gray-500">Rent</p>
                <p className="font-medium text-gray-900">KES {Number(rentAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Deposit</p>
                <p className="font-medium text-gray-900">KES {Number(depositAmount).toLocaleString()}</p>
              </div>
              {escalationRate && (
                <div>
                  <p className="text-gray-500">Escalation</p>
                  <p className="font-medium text-gray-900">{escalationRate}% per year</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">{clauses.length} clause(s) included</p>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {clauses.map((c) => (
                  <div key={c.id} className="p-3 text-sm text-gray-700">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize mr-2 ${
                      CLAUSE_TYPE_COLORS[c.type] || CLAUSE_TYPE_COLORS.custom
                    }`}>
                      {c.type}
                    </span>
                    {c.text.substring(0, 120)}{c.text.length > 120 ? '...' : ''}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Delivery Channels</p>
              <div className="flex gap-4">
                {['email', 'sms'].map((ch) => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.has(ch)}
                      onChange={() => toggleChannel(ch)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm capitalize text-gray-900">{ch}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex gap-2">
            {step === STEPS.length - 1 ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={handleSendForSigning}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send for Signing'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
