'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { listingsApi } from '@/lib/api-services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/app/lib/hooks';
import {
  ArrowLeft, ExternalLink, RefreshCw, CheckCircle, Clock,
  Eye, MessageSquare, TrendingUp, Copy, Share2, Pause,
  Play, Home, Building2, Megaphone, Loader2, ChevronDown,
  User, Phone, Mail, Calendar, AlertCircle, BarChart3,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Syndication {
  id: string; platform: string; status: string;
  share_url: string | null; external_url: string | null;
  published_at: string | null; error_message: string | null;
}

interface Lead {
  id: string; name: string; email: string | null; phone: string | null;
  message: string | null; source_platform: string | null;
  status: string; notes: string | null;
  created_at: string; updated_at: string;
}

interface Analytics {
  total_views: number; total_inquiries: number; total_shares: number;
  days_on_market: number | null; conversion_rate: number;
  views_by_platform: Record<string, number>;
  inquiries_by_platform: Record<string, number>;
  leads_by_status: Record<string, number>;
}

interface Listing {
  id: string; title: string; monthly_rent: number; deposit_amount: number | null;
  status: string; slug: string; view_count: number; lead_count: number;
  days_on_market: number | null; published_at: string | null; filled_at: string | null;
  property_name: string | null; unit_number: string | null;
  syndications: Syndication[]; description: string | null;
  amenities: string[]; photos: string[];
  available_from: string | null; created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, string> = {
  direct_link: '🔗', whatsapp: '💬', facebook: '📘',
  twitter: '🐦', buyrentkenya: '🏠', jiji: '🛒', property24: '🏗️',
};
const PLATFORM_LABELS: Record<string, string> = {
  direct_link: 'Direct Link', whatsapp: 'WhatsApp', facebook: 'Facebook',
  twitter: 'Twitter/X', buyrentkenya: 'BuyRentKenya', jiji: 'Jiji', property24: 'Property24',
};
const STATUS_COLOURS: Record<string, string> = {
  published: 'text-green-700 bg-green-100',
  pending: 'text-yellow-700 bg-yellow-100',
  failed: 'text-red-700 bg-red-100',
  expired: 'text-gray-600 bg-gray-100',
};
const LEAD_STATUS_OPTIONS = ['new', 'contacted', 'viewing_scheduled', 'approved', 'rejected'];
const LEAD_STATUS_COLOURS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  viewing_scheduled: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

type Tab = 'overview' | 'leads' | 'analytics';

// ── Lead Row ───────────────────────────────────────────────────────────────────

function LeadRow({ lead, onUpdate }: { lead: Lead; onUpdate: (id: string, status: string, notes: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdate(lead.id, status, notes);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{lead.name}</span>
            {lead.source_platform && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                via {lead.source_platform}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
            {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${LEAD_STATUS_COLOURS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
            {lead.status.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(lead.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
          {lead.message && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Message</p>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200">{lead.message}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Update Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {LEAD_STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { toasts, addToast, removeToast } = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'owner')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadListing = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listingsApi.get(listingId);
      if (res.success) setListing(res.data);
      else addToast('Failed to load listing', 'error');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const loadLeads = useCallback(async () => {
    const res = await listingsApi.getLeads(listingId);
    if (res.success && res.data?.leads) setLeads(res.data.leads);
  }, [listingId]);

  const loadAnalytics = useCallback(async () => {
    const res = await listingsApi.getAnalytics(listingId);
    if (res.success) setAnalytics(res.data);
  }, [listingId]);

  useEffect(() => {
    if (isAuthenticated && listingId) {
      loadListing();
      loadLeads();
      loadAnalytics();
    }
  }, [isAuthenticated, listingId, loadListing, loadLeads, loadAnalytics]);

  const handleAction = async (action: string, extra?: any) => {
    try {
      setActionLoading(action);
      let res;
      if (action === 'publish') {
        res = await listingsApi.publish(listingId, ['direct_link', 'whatsapp', 'facebook', 'twitter']);
      } else if (action === 'pause') {
        res = await listingsApi.pause(listingId);
      } else if (action === 'mark-filled') {
        res = await listingsApi.markFilled(listingId);
      } else if (action === 'resync') {
        res = await listingsApi.syndicate(listingId, extra);
      }
      if (res?.success) {
        addToast('Done!', 'success');
        loadListing();
      } else {
        addToast('Action failed', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const updateLead = async (leadId: string, status: string, notes: string) => {
    const res = await listingsApi.updateLead(listingId, leadId, { status, notes });
    if (res.success) {
      addToast('Lead updated', 'success');
      loadLeads();
    } else {
      addToast('Failed to update lead', 'error');
    }
  };

  const copyLink = (text: string) => {
    navigator.clipboard.writeText(text).then(() => addToast('Link copied!', 'success'));
  };

  if (authLoading || loading) {
    return <div className="p-6 flex items-center justify-center min-h-64"><LoadingSpinner text="Loading..." /></div>;
  }

  if (!listing) {
    return (
      <div className="p-6 text-center mt-16">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">Listing not found.</p>
        <Link href="/owner/listings" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Back to Listings</Link>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/listings/${listing.slug}`;
  const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-700',
    filled: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <Link href="/owner/listings" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg mt-0.5">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[listing.status] || STATUS_STYLES.draft}`}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
            {listing.property_name && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {listing.property_name}
                {listing.unit_number && ` · Unit ${listing.unit_number}`}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
          <p className="text-lg font-bold text-blue-600 mt-0.5">
            KES {Number(listing.monthly_rent).toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {listing.status === 'draft' && (
            <button
              onClick={() => handleAction('publish')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {actionLoading === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              Publish
            </button>
          )}
          {listing.status === 'active' && (
            <button
              onClick={() => handleAction('pause')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" /> Pause
            </button>
          )}
          {listing.status === 'paused' && (
            <button
              onClick={() => handleAction('publish')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> Resume
            </button>
          )}
          {listing.status === 'active' && (
            <button
              onClick={() => handleAction('mark-filled')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Mark Filled
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['overview', 'leads', 'analytics'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${tab === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'leads' ? `Leads (${leads.length})` : t === 'analytics' ? 'Analytics' : 'Overview'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <Eye className="w-4 h-4 text-blue-500" />, label: 'Views', value: listing.view_count },
              { icon: <MessageSquare className="w-4 h-4 text-green-500" />, label: 'Leads', value: listing.lead_count },
              { icon: <Clock className="w-4 h-4 text-orange-500" />, label: 'Days on Market', value: listing.days_on_market != null ? `${listing.days_on_market}d` : '—' },
              { icon: <CheckCircle className="w-4 h-4 text-purple-500" />, label: 'Status', value: listing.status.charAt(0).toUpperCase() + listing.status.slice(1) },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Share tools */}
          {listing.status === 'active' && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Share Listing</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyLink(publicUrl)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Open Public Page
                </a>
                {listing.syndications.find(s => s.platform === 'whatsapp')?.share_url && (
                  <a
                    href={listing.syndications.find(s => s.platform === 'whatsapp')!.share_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    💬 Share on WhatsApp
                  </a>
                )}
                {listing.syndications.find(s => s.platform === 'facebook')?.share_url && (
                  <a
                    href={listing.syndications.find(s => s.platform === 'facebook')!.share_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    📘 Share on Facebook
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Syndication status */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Platform Status</h3>
            <div className="space-y-3">
              {listing.syndications.length === 0 ? (
                <p className="text-sm text-gray-400">No platforms synced yet. Publish the listing to syndicate.</p>
              ) : (
                listing.syndications.map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xl w-7 flex-shrink-0">{PLATFORM_ICONS[s.platform] || '🌐'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{PLATFORM_LABELS[s.platform] || s.platform}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOURS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                          {s.status}
                        </span>
                      </div>
                      {s.error_message && <p className="text-xs text-red-500 mt-0.5">{s.error_message}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.share_url && (
                        <a
                          href={s.share_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleAction('resync', s.platform)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'resync' ? 'animate-spin' : ''}`} />
                        Re-sync
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Listing preview */}
          {listing.description && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{listing.description}</p>
            </div>
          )}
        </div>
      )}

      {/* ── LEADS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'leads' && (
        <div className="space-y-3">
          {leads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No leads yet</p>
              <p className="text-sm text-gray-400 mt-1">Share your listing to start receiving inquiries</p>
            </div>
          ) : (
            leads.map(lead => (
              <LeadRow key={lead.id} lead={lead} onUpdate={updateLead} />
            ))
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ──────────────────────────────────────────────────── */}
      {tab === 'analytics' && analytics && (
        <div className="space-y-5">
          {/* Funnel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Views', value: analytics.total_views, colour: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Inquiries', value: analytics.total_inquiries, colour: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Conversion Rate', value: `${(analytics.conversion_rate * 100).toFixed(1)}%`, colour: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Days on Market', value: analytics.days_on_market != null ? `${analytics.days_on_market}d` : '—', colour: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((card, i) => (
              <div key={i} className={`${card.bg} rounded-xl p-4 border border-white`}>
                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.colour}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Views by platform */}
          {Object.keys(analytics.views_by_platform).length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Views by Platform</h3>
              <div className="space-y-3">
                {Object.entries(analytics.views_by_platform)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => {
                    const maxViews = Math.max(...Object.values(analytics.views_by_platform));
                    const pct = maxViews > 0 ? (count / maxViews) * 100 : 0;
                    return (
                      <div key={platform} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-24 flex-shrink-0 capitalize">{platform.replace(/_/g, ' ')}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Lead status breakdown */}
          {Object.keys(analytics.leads_by_status).length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Pipeline</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(analytics.leads_by_status).map(([status, count]) => (
                  <div key={status} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{status.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.total_views === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No analytics data yet</p>
              <p className="text-sm text-gray-400 mt-1">Publish and share your listing to start tracking engagement</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
