'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Bed, Bath, MapPin, Calendar, DollarSign, CheckCircle,
  ChevronLeft, ChevronRight, Phone, Mail, MessageSquare,
  Wifi, Car, Droplets, Zap, Shield, Dumbbell, Waves,
  Wind, Sofa, Heart, Trees, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';

const API_BASE = '/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PublicListing {
  id: string;
  title: string;
  description: string | null;
  monthly_rent: number;
  deposit_amount: number | null;
  available_from: string | null;
  amenities: string[];
  photos: string[];
  slug: string;
  view_count: number;
  published_at: string | null;
  property_name: string | null;
  unit_number: string | null;
  area: string | null;
  city: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  water: <Droplets className="w-4 h-4" />,
  generator: <Zap className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  gym: <Dumbbell className="w-4 h-4" />,
  pool: <Waves className="w-4 h-4" />,
  balcony: <Wind className="w-4 h-4" />,
  furnished: <Sofa className="w-4 h-4" />,
  pet_friendly: <Heart className="w-4 h-4" />,
  garden: <Trees className="w-4 h-4" />,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi', parking: 'Parking', water: 'Water', generator: 'Generator/Backup Power',
  security: 'Security', gym: 'Gym', pool: 'Swimming Pool', balcony: 'Balcony/Terrace',
  furnished: 'Furnished', pet_friendly: 'Pet Friendly', garden: 'Garden',
  lift: 'Lift/Elevator',
};

// ── Inquiry Form ───────────────────────────────────────────────────────────────

function InquiryForm({ slug, sourcePlatform }: { slug: string; sourcePlatform?: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required');
    if (!form.email.trim() && !form.phone.trim()) return setError('Please provide an email or phone number');

    setSubmitting(true);
    setError(null);
    try {
      const refParam = sourcePlatform ? `?ref=${sourcePlatform}` : '';
      const res = await fetch(`${API_BASE}/listings/public/${slug}/inquiry${refParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source_platform: sourcePlatform || 'direct' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Submission failed');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Inquiry Sent!</h3>
        <p className="text-gray-600 text-sm">
          The landlord has been notified and will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="John Kamau"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="+254 7XX XXX XXX"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="john@example.com"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="I'm interested in viewing this property..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
        ) : (
          <><MessageSquare className="w-4 h-4" /> Send Inquiry</>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your contact details will only be shared with the property owner.
      </p>
    </form>
  );
}

// ── Photo Gallery ──────────────────────────────────────────────────────────────

function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [current, setCurrent] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-64 md:h-96 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center rounded-xl">
        <div className="text-center text-blue-400">
          <MapPin className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 md:h-96 bg-gray-900 rounded-xl overflow-hidden group">
      <img
        src={photos[current]}
        alt={`${title} - photo ${current + 1}`}
        className="w-full h-full object-cover"
        onError={(e: any) => { e.target.src = '/placeholder-property.jpg'; }}
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(c => (c - 1 + photos.length) % photos.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent(c => (c + 1) % photos.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/60'}`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {current + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PublicListingClient({ slug, ref: refProp }: { slug: string; ref?: string }) {
  const searchParams = useSearchParams();
  const ref = refProp || searchParams.get('ref') || undefined;

  const [listing, setListing] = useState<PublicListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const refParam = ref ? `?ref=${ref}` : '';
        const res = await fetch(`${API_BASE}/listings/public/${slug}${refParam}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('This listing is no longer available.');
          throw new Error('Failed to load listing.');
        }
        const data = await res.json();
        setListing(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [slug, ref]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'This property listing is no longer available.'}</p>
          <a href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
          </a>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Immediately';
    return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const locationParts = [listing.area, listing.city].filter(Boolean);
  const location = locationParts.join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold text-lg">PROPERTECH</span>
          </div>
          <span className="text-xs text-gray-500">Property Listing</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — listing details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Photo gallery */}
            <PhotoGallery photos={listing.photos} title={listing.title} />

            {/* Title + price */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
                  {location && (
                    <p className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" /> {location}
                    </p>
                  )}
                </div>
                <div className="text-right sm:text-left">
                  <p className="text-2xl font-bold text-blue-600">
                    KES {Number(listing.monthly_rent).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">per month</p>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {listing.bedrooms !== null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <Bed className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Bedrooms</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}
                      </p>
                    </div>
                  </div>
                )}
                {listing.bathrooms !== null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <Bath className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Bathrooms</p>
                      <p className="font-semibold text-gray-900 text-sm">{listing.bathrooms}</p>
                    </div>
                  </div>
                )}
                {listing.deposit_amount && listing.deposit_amount > 0 ? (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Deposit</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        KES {Number(listing.deposit_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(listing.available_from)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-3">About This Property</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {listing.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                        {AMENITY_ICONS[amenity] || <CheckCircle className="w-4 h-4" />}
                      </span>
                      <span>{AMENITY_LABELS[amenity] || amenity.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right column — inquiry form */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Book a Viewing
                </h2>
                <InquiryForm slug={slug} sourcePlatform={ref} />
              </div>

              {/* Quick contact chips */}
              <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-2">Interested? Contact via:</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`I'm interested in: ${listing.title}\n${window?.location?.href || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Phone className="w-3 h-3" /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* PROPERTECH Branding Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Listed on <span className="font-semibold text-blue-600">PROPERTECH</span> — Smart Property Management
          </p>
          <a
            href="https://propertechsoftware.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Manage your property <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
