'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Building2, Home, Loader2 } from 'lucide-react';
import { saveDraft } from '@/app/lib/inspection-db';
import { getCachedProperties, getCachedUnits } from '@/app/lib/inspection-db';
import { generateUUID } from '@/app/lib/inspection-types';
import { inspectionsApi } from '@/app/lib/api-services';
import type { InspectionDraft, InspectionType } from '@/app/lib/inspection-types';
import { INSPECTION_TYPE_CONFIG } from '@/app/lib/inspection-types';
import { useDeviceId } from '@/app/lib/inspection-hooks';

export default function NewInspectionPage() {
  const router = useRouter();
  const deviceId = useDeviceId();

  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    property_id: '',
    unit_id: '',
    inspection_type: 'routine' as InspectionType,
    template_id: '',
    notes: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Try cache first, then network
        const cached = await getCachedProperties();
        if (cached.length > 0) {
          setProperties(cached);
        } else {
          // Fetch from API
          const { default: api } = await import('@/app/lib/api-services');
        }

        // Load templates
        try {
          const tplRes = await inspectionsApi.seedTemplates();
          if (tplRes.success && tplRes.data) {
            setTemplates(tplRes.data.templates || []);
          } else {
            const listRes = await inspectionsApi.listTemplates({});
            if (listRes.success) setTemplates(listRes.data || []);
          }
        } catch { /* non-fatal */ }

        // Fetch properties from API
        try {
          const res = await fetch('/api/properties/', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
          });
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          const items = data.items || data.data?.items || data.properties || [];
          setProperties(items);
        } catch { /* offline — use cached */ }

      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Load units when property changes
  useEffect(() => {
    if (!form.property_id) return;
    const loadUnits = async () => {
      try {
        const res = await fetch(`/api/properties/${form.property_id}/units/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const items = data.units || data.data || data.items || [];
        setUnits(items);
      } catch {
        const cached = await getCachedUnits(parseInt(form.property_id));
        setUnits(cached);
      }
    };
    loadUnits();
  }, [form.property_id]);

  const handleCreate = async () => {
    if (!form.property_id || !form.unit_id) {
      alert('Please select a property and unit');
      return;
    }

    setCreating(true);
    try {
      const clientUuid = generateUUID();
      const now = new Date().toISOString();

      // Pre-populate items from template if selected
      const template = templates.find((t) => t.id === form.template_id);
      const items = (template?.default_items || []).map((item: any) => ({
        client_uuid: generateUUID(),
        inspection_client_uuid: clientUuid,
        name: item.name,
        category: item.category,
        condition: 'good' as const,
        score: undefined,
        requires_followup: false,
        photo_required: item.required_photo || false,
      }));

      const draft: InspectionDraft = {
        client_uuid: clientUuid,
        inspection: {
          client_uuid: clientUuid,
          property_id: parseInt(form.property_id),
          unit_id: parseInt(form.unit_id),
          performed_by_role: 'owner',
          inspection_type: form.inspection_type,
          status: 'draft',
          inspection_date: now,
          device_id: deviceId,
          offline_created_at: now,
          notes: form.notes,
          template_id: form.template_id || undefined,
        },
        items,
        media: [],
        meter_readings: [],
        sync_status: 'pending',
        last_modified: now,
        created_at: now,
      };

      await saveDraft(draft);
      router.push(`/inspect/${clientUuid}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create inspection draft');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center gap-3 pt-12">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold">New Inspection</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Inspection Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Inspection Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(INSPECTION_TYPE_CONFIG) as [InspectionType, any][])
              .filter(([, c]) => !c.isExternal)
              .map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setForm((f) => ({ ...f, inspection_type: type }))}
                  className={`p-3 rounded-xl border text-left text-sm transition-colors ${
                    form.inspection_type === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{config.description}</div>
                </button>
              ))}
          </div>
        </div>

        {/* Property */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Building2 className="h-4 w-4 inline mr-1" />
            Property
          </label>
          <select
            value={form.property_id}
            onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value, unit_id: '' }))}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select property…</option>
            {properties.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Unit */}
        {form.property_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Home className="h-4 w-4 inline mr-1" />
              Unit
            </label>
            <select
              value={form.unit_id}
              onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select unit…</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
              ))}
            </select>
          </div>
        )}

        {/* Template */}
        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template (optional)
            </label>
            <select
              value={form.template_id}
              onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No template (start blank)</option>
              {templates
                .filter((t: any) => t.inspection_type === form.inspection_type)
                .map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Any initial notes…"
            rows={3}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleCreate}
          disabled={creating || !form.property_id || !form.unit_id}
          className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-base disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          Start Inspection
        </button>
      </div>
    </div>
  );
}
