'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft, Plus, CheckCircle, AlertCircle, Camera,
  Send, Loader2, Trash2, Edit3
} from 'lucide-react';
import { getDraft, saveDraft, deleteDraft } from '@/app/lib/inspection-db';
import { useInspectionSync } from '@/app/lib/inspection-hooks';
import { generateUUID } from '@/app/lib/inspection-types';
import { ITEM_CATEGORY_CONFIG, CONDITION_CONFIG, SEVERITY_CONFIG } from '@/app/lib/inspection-types';
import type { InspectionDraft, InspectionItem, ItemCategory, ItemCondition, SeverityLevel } from '@/app/lib/inspection-types';

export default function InspectionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { syncOne, syncing } = useInspectionSync();

  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'structure' as ItemCategory,
    condition: 'good' as ItemCondition,
    score: 3,
    severity: 'low' as SeverityLevel,
    comment: '',
    requires_followup: false,
    requires_maintenance: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const d = await getDraft(id);
        setDraft(d);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const save = async (updated: InspectionDraft) => {
    setSaving(true);
    try {
      await saveDraft(updated);
      setDraft(updated);
    } finally {
      setSaving(false);
    }
  };

  const addItem = async () => {
    if (!draft || !newItem.name.trim()) return;
    const item: InspectionItem = {
      client_uuid: generateUUID(),
      inspection_client_uuid: draft.client_uuid,
      name: newItem.name.trim(),
      category: newItem.category,
      condition: newItem.condition,
      score: newItem.score,
      severity: newItem.severity,
      comment: newItem.comment,
      requires_followup: newItem.requires_maintenance || newItem.requires_followup,
    };
    const updated = { ...draft, items: [...draft.items, item] };
    await save(updated);
    setNewItem({ name: '', category: 'structure', condition: 'good', score: 3, severity: 'low', comment: '', requires_followup: false, requires_maintenance: false });
    setShowAddItem(false);
  };

  const removeItem = async (uuid: string) => {
    if (!draft) return;
    const updated = { ...draft, items: draft.items.filter((i) => i.client_uuid !== uuid) };
    await save(updated);
  };

  const updateItemCondition = async (uuid: string, condition: ItemCondition, score: number) => {
    if (!draft) return;
    const updated = {
      ...draft,
      items: draft.items.map((i) =>
        i.client_uuid === uuid ? { ...i, condition, score } : i
      ),
    };
    await save(updated);
  };

  const submitInspection = async () => {
    if (!draft) return;
    const updated = { ...draft, inspection: { ...draft.inspection, status: 'submitted' as const }, sync_status: 'pending' as const };
    await save(updated);

    // Try immediate sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await syncOne(draft.client_uuid);
        router.push('/inspect');
      } catch {
        router.push('/inspect');
      }
    } else {
      router.push('/inspect');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600">Inspection not found</p>
        <button onClick={() => router.push('/inspect')} className="text-blue-600 font-medium">
          Back to list
        </button>
      </div>
    );
  }

  const submitted = draft.inspection.status !== 'draft';
  const passItems = draft.items.filter((i) => i.score && i.score >= 3).length;
  const failItems = draft.items.filter((i) => i.score && i.score < 3).length;
  const avgScore = draft.items.filter((i) => i.score).length > 0
    ? (draft.items.reduce((s, i) => s + (i.score || 0), 0) / draft.items.filter((i) => i.score).length).toFixed(1)
    : '—';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 pt-12">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/inspect')} className="p-1 -ml-1">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold capitalize">
              {draft.inspection.inspection_type.replace('_', ' ')} Inspection
            </h1>
            <p className="text-xs text-gray-500">
              {new Date(draft.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
              {saving && <span className="ml-2 text-blue-500">Saving…</span>}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            submitted ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {submitted ? 'Submitted' : 'Draft'}
          </span>
        </div>

        {/* Score summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{draft.items.length}</div>
            <div className="text-xs text-gray-500">Items</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-600">{passItems}</div>
            <div className="text-xs text-gray-500">Pass</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-red-600">{failItems}</div>
            <div className="text-xs text-gray-500">Fail</div>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {draft.items.length === 0 && !showAddItem && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">No items yet. Tap below to add.</p>
          </div>
        )}

        {draft.items.map((item) => (
          <ItemCard
            key={item.client_uuid}
            item={item}
            disabled={submitted}
            onConditionChange={(cond, score) => updateItemCondition(item.client_uuid, cond, score)}
            onRemove={() => removeItem(item.client_uuid)}
          />
        ))}

        {/* Add item form */}
        {showAddItem && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-4 space-y-3">
            <input
              autoFocus
              value={newItem.name}
              onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))}
              placeholder="Item name (e.g. Bathroom faucet)"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem((n) => ({ ...n, category: e.target.value as ItemCategory }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800"
                >
                  {Object.entries(ITEM_CATEGORY_CONFIG).map(([cat, cfg]) => (
                    <option key={cat} value={cat}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Score (1-5)</label>
                <input
                  type="number"
                  min={1} max={5}
                  value={newItem.score}
                  onChange={(e) => setNewItem((n) => ({ ...n, score: parseInt(e.target.value) || 3 }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Condition</label>
              <div className="flex gap-2">
                {(['good', 'fair', 'poor'] as ItemCondition[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewItem((n) => ({ ...n, condition: c }))}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      newItem.condition === c
                        ? `${CONDITION_CONFIG[c].bgColor} ${CONDITION_CONFIG[c].color} border-transparent`
                        : 'border-gray-200 dark:border-gray-700 text-gray-600'
                    }`}
                  >
                    {CONDITION_CONFIG[c].label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={newItem.comment}
              onChange={(e) => setNewItem((n) => ({ ...n, comment: e.target.value }))}
              placeholder="Comment (optional)"
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={newItem.requires_maintenance}
                onChange={(e) => setNewItem((n) => ({ ...n, requires_maintenance: e.target.checked }))}
                className="rounded"
              />
              Requires maintenance
            </label>

            <div className="flex gap-2">
              <button
                onClick={addItem}
                disabled={!newItem.name.trim()}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
              >
                Add Item
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                className="px-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {!submitted && (
          <>
            <button
              onClick={() => setShowAddItem(true)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
            <button
              onClick={submitInspection}
              disabled={draft.items.length === 0 || syncing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3.5 text-sm font-semibold disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Inspection
            </button>
          </>
        )}
        {submitted && (
          <button
            onClick={() => router.push('/inspect')}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3.5 text-sm font-semibold"
          >
            <CheckCircle className="h-4 w-4" />
            Done
          </button>
        )}
      </div>
    </div>
  );
}

function ItemCard({
  item, disabled, onConditionChange, onRemove
}: {
  item: InspectionItem;
  disabled: boolean;
  onConditionChange: (cond: ItemCondition, score: number) => void;
  onRemove: () => void;
}) {
  const catConfig = ITEM_CATEGORY_CONFIG[item.category] || { label: item.category, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  const condConfig = CONDITION_CONFIG[item.condition] || { label: item.condition, color: 'text-gray-600', bgColor: 'bg-gray-50' };

  const scoreToCondition = (score: number): { cond: ItemCondition; score: number } => {
    if (score >= 4) return { cond: 'good', score };
    if (score >= 3) return { cond: 'fair', score };
    return { cond: 'poor', score };
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border p-3 ${
      item.requires_followup ? 'border-orange-200 dark:border-orange-800' : 'border-gray-200 dark:border-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${catConfig.bgColor} ${catConfig.color}`}>
              {catConfig.label}
            </span>
            {item.requires_followup && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Needs attention</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{item.name}</p>
          {item.comment && <p className="text-xs text-gray-500 mt-0.5">{item.comment}</p>}
        </div>
        {!disabled && (
          <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Condition selector */}
      {!disabled && (
        <div className="flex gap-1.5">
          {([
            { cond: 'good' as ItemCondition, score: 5, label: 'Good' },
            { cond: 'fair' as ItemCondition, score: 3, label: 'Fair' },
            { cond: 'poor' as ItemCondition, score: 1, label: 'Poor' },
          ]).map(({ cond, score, label }) => (
            <button
              key={cond}
              onClick={() => onConditionChange(cond, score)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                item.condition === cond
                  ? `${CONDITION_CONFIG[cond].bgColor} ${CONDITION_CONFIG[cond].color} border-transparent`
                  : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {disabled && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${condConfig.bgColor} ${condConfig.color}`}>
          {condConfig.label} {item.score ? `(${item.score}/5)` : ''}
        </span>
      )}
    </div>
  );
}
