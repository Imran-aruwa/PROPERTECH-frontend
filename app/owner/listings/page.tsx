'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { listingsApi } from '@/lib/api-services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/app/lib/hooks';
import {
  Plus, Home, Clock, CheckCircle,
  Eye, ExternalLink, MoreVertical, Search,
  Pause, Play, Building2, MessageSquare,
  Megaphone,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Syndication {
  id: string;
  platform: string;
  status: string;
  share_url: string | null;
  external_url: string | null;
}

interface Listing {
  id: string;
  title: string;
  monthly_rent: number;
  status: string;
  slug: string;
  view_count: number;
  lead_count: number;
  days_on_market: number | null;
  published_at: string | null;
  property_name: string | null;
  unit_number: string | null;
  syndications: Syndication[];
  created_at: string;
}

interface ListingListResponse {
  listings: Listing[];
  total: number;
  active_count: number;
  draft_count: number;
  filled_this_month: number;
  avg_days_on_market: number | null;
  total_leads_this_month: number;
}

// ── Platform badge colours ─────────────────────────────────────────────────────

const PLATFORM_COLOURS: Record<string, string> = {
  direct_link: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
  facebook: 'bg-indigo-100 text-indigo-700',
  twitter: 'bg-sky-100 text-sky-700',
  buyrentkenya: 'bg-orange-100 text-orange-700',
  jiji: 'bg-yellow-100 text-yellow-700',
  property24: 'bg-purple-100 text-purple-700',
};

const PLATFORM_LABELS: Record<string, string> = {
  direct_link: 'Link', whatsapp: 'WA', facebook: 'FB',
  twitter: 'X', buyrentkenya: 'BRK', jiji: 'Jiji', property24: 'P24',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active:  { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  draft:   { bg: 'bg-gray-50',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
  paused:  { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  filled:  { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
};

// ── Summary Card ───────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, colour }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; colour: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 ${colour} rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Listing Card ───────────────────────────────────────────────────────────────

function ListingCard({ listing, onAction }: {
  listing: Listing;
  onAction: (action: string, id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const st = STATUS_STYLES[listing.status] || STATUS_STYLES.draft;
  const activeSyndications = listing.syndications.filter(s => s.status === 'published');

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text} mb-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">{listing.title}</h3>

          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            {listing.property_name && (
              <>
                <Building2 className="w-3 h-3" />
                <span>{listing.property_name}</span>
                {listing.unit_number && <span>· Unit {listing.unit_number}</span>}
              </>
            )}
          </div>

          <p className="text-base font-bold text-blue-600 mt-2">
            KES {Number(listing.monthly_rent).toLocaleString()}<span className="text-xs font-normal text-gray-500">/mo</span>
          </p>
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-40 py-1 text-sm">
              <Link
                href={`/owner/listings/${listing.id}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="w-3.5 h-3.5" /> View Details
              </Link>
              {listing.status === 'draft' && (
                <button
                  onClick={() => { onAction('publish', listing.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Publish
                </button>
              )}
              {listing.status === 'active' && (
                <button
                  onClick={() => { onAction('pause', listing.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              )}
              {listing.status === 'paused' && (
                <button
                  onClick={() => { onAction('publish', listing.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </button>
              )}
              {listing.status === 'active' && (
                <button
                  onClick={() => { onAction('mark-filled', listing.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-green-600"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Mark Filled
                </button>
              )}
              {listing.status === 'active' && (
                <a
                  href={`/listings/${listing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Public Page
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.view_count} views</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {listing.lead_count} leads</span>
        {listing.days_on_market !== null && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {listing.days_on_market}d on market</span>
        )}
      </div>

      {/* Platform badges */}
      {activeSyndications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {activeSyndications.map(s => (
            <span
              key={s.id}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLOURS[s.platform] || 'bg-gray-100 text-gray-600'}`}
            >
              {PLATFORM_LABELS[s.platform] || s.platform}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/owner/listings/${listing.id}`}
          className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
        >
          Manage
        </Link>
        {listing.status === 'draft' && (
          <button
            onClick={() => onAction('publish', listing.id)}
            className="flex-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors"
          >
            Publish Now
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ListingsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [data, setData] = useState<ListingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isPremiumError, setIsPremiumError] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'owner')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listingsApi.list(statusFilter || undefined);
      if (!res.success) {
        if (typeof res.error === 'object' && (res.error as any)?.error === 'premium_required') {
          setIsPremiumError(true);
          return;
        }
        addToast(typeof res.error === 'string' ? res.error : 'Failed to load listings', 'error');
        return;
      }
      setData(res.data);
    } catch {
      addToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    if (isAuthenticated) fetchListings();
  }, [fetchListings, isAuthenticated]);

  const handleAction = async (action: string, id: string) => {
    try {
      let res;
      if (action === 'publish') {
        res = await listingsApi.publish(id, ['direct_link', 'whatsapp', 'facebook', 'twitter']);
      } else if (action === 'pause') {
        res = await listingsApi.pause(id);
      } else if (action === 'mark-filled') {
        res = await listingsApi.markFilled(id);
      }
      if (res?.success) {
        addToast(`Listing ${action === 'mark-filled' ? 'marked as filled' : action + 'd'} successfully`, 'success');
        fetchListings();
      } else {
        addToast('Action failed', 'error');
      }
    } catch {
      addToast('Action failed', 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading listings..." />
      </div>
    );
  }

  if (isPremiumError) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center mt-16">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Premium Feature</h2>
        <p className="text-gray-500 mb-6">
          Vacancy Listing Syndication is available on Professional and Enterprise plans.
          Publish to WhatsApp, Facebook, and property portals automatically.
        </p>
        <Link
          href="/owner/subscription"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  const filteredListings = (data?.listings || []).filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
    (l.property_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vacancy Listings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Publish vacant units to multiple platforms and track leads in one place
          </p>
        </div>
        <Link
          href="/owner/listings/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Create Listing
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={<Home className="w-5 h-5 text-green-600" />}
          label="Active Listings"
          value={data?.active_count ?? 0}
          colour="bg-green-100"
        />
        <SummaryCard
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          label="Leads This Month"
          value={data?.total_leads_this_month ?? 0}
          colour="bg-blue-100"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          label="Avg Days on Market"
          value={data?.avg_days_on_market != null ? `${Math.round(data.avg_days_on_market)}d` : '—'}
          colour="bg-orange-100"
        />
        <SummaryCard
          icon={<CheckCircle className="w-5 h-5 text-purple-600" />}
          label="Filled This Month"
          value={data?.filled_this_month ?? 0}
          colour="bg-purple-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
          <option value="filled">Filled</option>
        </select>
      </div>

      {/* Listings grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No listings yet</h3>
          <p className="text-sm text-gray-500 mb-5">
            {statusFilter ? `No ${statusFilter} listings found.` : 'Create your first listing to start attracting tenants.'}
          </p>
          <Link
            href="/owner/listings/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
