'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequireAuth } from '@/app/lib/auth-context';
import { InspectionList } from '@/components/inspections/InspectionList';
import { Loader2, ClipboardCheck, FileText, LayoutTemplate, Smartphone, Plus, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { inspectionsApi } from '@/app/lib/api-services';

type Tab = 'inspections' | 'templates' | 'reports';

export default function OwnerInspectionsPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth('owner');
  const [tab, setTab] = useState<Tab>('inspections');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="space-y-0">
      {/* Tab header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-bg-card px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-tx-primary">Inspections</h1>
          </div>
          <a
            href="/inspect"
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Smartphone className="h-4 w-4" />
            PWA App
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex gap-0 -mb-px">
          {([
            { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
            { id: 'templates', label: 'Templates', icon: LayoutTemplate },
            { id: 'reports', label: 'Reports', icon: FileText },
          ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-tx-muted hover:text-tx-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tab === 'inspections' && (
          <InspectionList role="owner" userId={user.id} />
        )}
        {tab === 'templates' && (
          <TemplatesTab />
        )}
        {tab === 'reports' && (
          <ReportsTab />
        )}
      </div>
    </div>
  );
}

// ============================================================
// TEMPLATES TAB
// ============================================================

function TemplatesTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionsApi.listTemplates({});
      if (res.success) setTemplates(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await inspectionsApi.seedTemplates();
      if (res.success) {
        await load();
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await inspectionsApi.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-tx-muted">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-bg-hover"
          >
            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Seed Defaults
          </button>
          <a
            href="/owner/inspections/new"
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Template
          </a>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-bg-card rounded-xl border border-gray-200 dark:border-gray-800">
          <LayoutTemplate className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-tx-muted text-sm">No templates yet.</p>
          <button onClick={handleSeed} className="mt-3 text-blue-600 text-sm font-medium hover:underline">
            Seed default templates
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-tx-primary text-sm">{t.name}</h3>
                <button onClick={() => handleDelete(t.id)} className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {t.description && (
                <p className="text-xs text-tx-muted mb-2 line-clamp-2">{t.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 capitalize">
                  {t.inspection_type.replace('_', ' ')}
                </span>
                <span className="text-xs text-tx-muted">
                  {(t.default_items || []).length} items
                </span>
                {t.scoring_enabled && (
                  <span className="text-xs text-tx-muted">Scored</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// REPORTS TAB
// ============================================================

function ReportsTab() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await inspectionsApi.list({ status: 'submitted' });
        if (res.success) {
          const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
          setInspections(items.slice(0, 20));
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const generateReport = async (id: string | number) => {
    setGenerating(String(id));
    try {
      const res = await inspectionsApi.getReport(id);
      if (res.success && res.data) {
        setReportData((prev) => ({ ...prev, [String(id)]: res.data }));
      }
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-tx-muted">Generate printable reports for submitted inspections.</p>

      {inspections.length === 0 ? (
        <div className="text-center py-16 bg-bg-card rounded-xl border border-gray-200 dark:border-gray-800">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-tx-muted text-sm">No submitted inspections found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp: any) => {
            const report = reportData[String(insp.id)];
            return (
              <div key={insp.id} className="bg-bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-tx-primary">
                      {insp.property_name} — Unit {insp.unit_number}
                    </p>
                    <p className="text-xs text-tx-muted capitalize">
                      {(insp.inspection_type || '').replace('_', ' ')} ·{' '}
                      {new Date(insp.inspection_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {insp.overall_score && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        insp.pass_fail === 'pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {insp.overall_score}/5
                      </span>
                    )}
                    <button
                      onClick={() => generateReport(insp.id)}
                      disabled={generating === String(insp.id)}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {generating === String(insp.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      Report
                    </button>
                  </div>
                </div>

                {/* Inline report */}
                {report && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-tx-primary">{report.items_total}</div>
                        <div className="text-xs text-tx-muted">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{report.items_passed}</div>
                        <div className="text-xs text-tx-muted">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{report.items_failed}</div>
                        <div className="text-xs text-tx-muted">Failed</div>
                      </div>
                    </div>

                    {report.action_items?.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-orange-600">
                          {report.action_items.length} item(s) need attention:
                        </p>
                        {report.action_items.slice(0, 3).map((ai: any, idx: number) => (
                          <p key={idx} className="text-xs text-tx-muted">
                            · {ai.name} {ai.severity ? `(${ai.severity})` : ''}
                          </p>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => window.print()}
                      className="mt-2 text-xs text-blue-600 hover:underline"
                    >
                      Print / Save as PDF
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
