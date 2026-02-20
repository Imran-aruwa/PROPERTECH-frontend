'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';
import { listingsApi, unitsApi } from '@/lib/api-services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/app/lib/hooks';
import {
  ArrowLeft, ArrowRight, Check,
  Loader2, Plus, X, Megaphone,
  Wifi, Car, Droplets, Zap, Shield, Dumbbell,
  Waves, Wind, Sofa, Heart, Trees,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const AMENITIES = [
  { key: 'wifi', label: 'WiFi / Internet', icon: <Wifi className="w-4 h-4" /> },
  { key: 'parking', label: 'Parking', icon: <Car className="w-4 h-4" /> },
  { key: 'water', label: 'Water (Borehole)', icon: <Droplets className="w-4 h-4" /> },
  { key: 'generator', label: 'Generator / Backup Power', icon: <Zap className="w-4 h-4" /> },
  { key: 'security', label: 'Security / CCTV', icon: <Shield className="w-4 h-4" /> },
  { key: 'gym', label: 'Gym / Fitness', icon: <Dumbbell className="w-4 h-4" /> },
  { key: 'pool', label: 'Swimming Pool', icon: <Waves className="w-4 h-4" /> },
  { key: 'balcony', label: 'Balcony / Terrace', icon: <Wind className="w-4 h-4" /> },
  { key: 'furnished', label: 'Furnished', icon: <Sofa className="w-4 h-4" /> },
  { key: 'pet_friendly', label: 'Pet Friendly', icon: <Heart className="w-4 h-4" /> },
  { key: 'garden', label: 'Garden / Compound', icon: <Trees className="w-4 h-4" /> },
];

const PLATFORMS = [
  { key: 'direct_link', label: 'Direct Link', description: 'A public URL for your listing — always included', instant: true, icon: '🔗' },
  { key: 'whatsapp', label: 'WhatsApp', description: 'Generate a pre-filled share message', instant: true, icon: '💬' },
  { key: 'facebook', label: 'Facebook', description: 'Open Facebook Sharer with your listing', instant: true, icon: '📘' },
  { key: 'twitter', label: 'Twitter / X', description: 'Post a tweet with listing details and link', instant: true, icon: '🐦' },
  { key: 'buyrentkenya', label: 'BuyRentKenya', description: 'Portal integration — requires API key in settings', instant: false, icon: '🏠' },
  { key: 'jiji', label: 'Jiji.co.ke', description: 'Portal integration — requires API key in settings', instant: false, icon: '🛒' },
  { key: 'property24', label: 'Property24', description: 'Portal integration — requires API key in settings', instant: false, icon: '🏗️' },
];

// ── Step indicators ────────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={i} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {isDone ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────

interface FormData {
  title: string;
  description: string;
  monthly_rent: string;
  deposit_amount: string;
  available_from: string;
  amenities: string[];
  photos: string[];
  property_id: string;
  unit_id: string;
  platforms: string[];
}

export default function NewListingPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillUnitId = searchParams.get('unit_id') || '';
  const { toasts, addToast, removeToast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [autoPopulating, setAutoPopulating] = useState(false);

  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState<FormData>({
    title: '', description: '', monthly_rent: '', deposit_amount: '',
    available_from: '', amenities: [], photos: [],
    property_id: '', unit_id: prefillUnitId,
    platforms: ['direct_link', 'whatsapp', 'facebook', 'twitter'],
  });
  const [photoInput, setPhotoInput] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'owner')) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const res = await unitsApi?.getAll?.() || { success: false, data: [] };
        if (res.success && Array.isArray(res.data)) {
          setUnits(res.data);
        }
      } catch {}
    };
    if (isAuthenticated) loadUnits();
  }, [isAuthenticated]);

  // Auto-populate when unit is selected
  const handleUnitSelect = useCallback(async (unitId: string) => {
    setForm(f => ({ ...f, unit_id: unitId }));
    if (!unitId) return;

    try {
      setAutoPopulating(true);
      const res = await listingsApi.autoPopulate(unitId);
      if (res.success && res.data) {
        const d = res.data;
        setForm(f => ({
          ...f,
          unit_id: unitId,
          title: d.title || f.title,
          description: d.description || f.description,
          monthly_rent: d.monthly_rent ? String(d.monthly_rent) : f.monthly_rent,
          deposit_amount: d.deposit_amount ? String(d.deposit_amount) : f.deposit_amount,
          amenities: d.amenities?.length ? d.amenities : f.amenities,
          photos: d.photos?.length ? d.photos : f.photos,
        }));
        addToast('Unit data loaded automatically', 'success');
      }
    } catch {
      addToast('Could not auto-populate from unit', 'error');
    } finally {
      setAutoPopulating(false);
    }
  }, [addToast]);

  // Auto-populate on mount if unit_id was in URL
  useEffect(() => {
    if (prefillUnitId && isAuthenticated) {
      handleUnitSelect(prefillUnitId);
    }
  }, [prefillUnitId, isAuthenticated, handleUnitSelect]);

  const toggleAmenity = (key: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter(a => a !== key)
        : [...f.amenities, key],
    }));
  };

  const togglePlatform = (key: string) => {
    if (key === 'direct_link') return; // always included
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(key)
        ? f.platforms.filter(p => p !== key)
        : [...f.platforms, key],
    }));
  };

  const addPhoto = () => {
    const url = photoInput.trim();
    if (url && !form.photos.includes(url)) {
      setForm(f => ({ ...f, photos: [...f.photos, url] }));
      setPhotoInput('');
    }
  };

  const removePhoto = (url: string) => {
    setForm(f => ({ ...f, photos: f.photos.filter(p => p !== url) }));
  };

  const validateStep1 = () => {
    if (!form.title.trim() || form.title.length < 5) {
      addToast('Title must be at least 5 characters', 'error'); return false;
    }
    if (!form.monthly_rent || parseFloat(form.monthly_rent) <= 0) {
      addToast('Monthly rent must be greater than 0', 'error'); return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validateStep1()) return;
    try {
      setSubmitting(true);

      // Step 1: Create listing
      const createPayload = {
        title: form.title,
        description: form.description || null,
        monthly_rent: parseFloat(form.monthly_rent),
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        available_from: form.available_from || null,
        amenities: form.amenities,
        photos: form.photos,
        unit_id: form.unit_id || null,
        property_id: form.property_id || null,
      };
      const createRes = await listingsApi.create(createPayload);
      if (!createRes.success || !createRes.data?.id) {
        addToast(typeof createRes.error === 'string' ? createRes.error : 'Failed to create listing', 'error');
        return;
      }

      const listingId = createRes.data.id;

      // Step 2: Publish
      const publishRes = await listingsApi.publish(listingId, form.platforms);
      if (!publishRes.success) {
        addToast('Listing created but publish failed. Go to listing detail to retry.', 'error');
        router.push(`/owner/listings/${listingId}`);
        return;
      }

      addToast('Listing published successfully!', 'success');
      router.push(`/owner/listings/${listingId}`);
    } catch {
      addToast('Failed to publish listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.title.trim() || form.title.length < 5) {
      addToast('Title must be at least 5 characters', 'error'); return;
    }
    if (!form.monthly_rent || parseFloat(form.monthly_rent) <= 0) {
      addToast('Monthly rent must be greater than 0', 'error'); return;
    }
    try {
      setSubmitting(true);
      const res = await listingsApi.create({
        title: form.title,
        description: form.description || null,
        monthly_rent: parseFloat(form.monthly_rent),
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        available_from: form.available_from || null,
        amenities: form.amenities,
        photos: form.photos,
        unit_id: form.unit_id || null,
        property_id: form.property_id || null,
      });
      if (res.success && res.data?.id) {
        addToast('Draft saved', 'success');
        router.push(`/owner/listings/${res.data.id}`);
      } else {
        addToast(typeof res.error === 'string' ? res.error : 'Failed to save draft', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="p-6"><LoadingSpinner text="Loading..." /></div>;

  // ── Step 1: Details ────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Unit selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Vacant Unit <span className="text-gray-400 font-normal">(auto-fills details)</span>
        </label>
        <div className="flex items-center gap-2">
          <select
            value={form.unit_id}
            onChange={e => handleUnitSelect(e.target.value)}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">— Select a unit (optional) —</option>
            {units.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.property?.name || 'Property'} — Unit {u.unit_number}
                {u.bedrooms ? ` (${u.bedrooms}BR)` : ''}
              </option>
            ))}
          </select>
          {autoPopulating && <Loader2 className="w-5 h-5 animate-spin text-blue-500 flex-shrink-0" />}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Spacious 2BR in Kilimani with Parking"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400 font-normal">(auto-generated, editable)</span>
        </label>
        <textarea
          rows={6}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe the property, location, and key features..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Rent & Deposit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES) *</label>
          <input
            type="number"
            min={0}
            value={form.monthly_rent}
            onChange={e => setForm(f => ({ ...f, monthly_rent: e.target.value }))}
            placeholder="25000"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (KES)</label>
          <input
            type="number"
            min={0}
            value={form.deposit_amount}
            onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))}
            placeholder="25000"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Available from */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
        <input
          type="date"
          value={form.available_from}
          onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES.map(a => (
            <button
              key={a.key}
              type="button"
              onClick={() => toggleAmenity(a.key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                ${form.amenities.includes(a.key)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos <span className="text-gray-400 font-normal">(paste URLs, max 10)</span>
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="url"
            value={photoInput}
            onChange={e => setPhotoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
            placeholder="https://..."
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addPhoto}
            disabled={form.photos.length >= 10}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {form.photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {form.photos.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">Cover</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Step 2: Platforms ──────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Choose which platforms to publish to. Instant platforms are always available.
        Portal integrations require an API key configured in settings.
      </p>
      {PLATFORMS.map(p => {
        const isSelected = form.platforms.includes(p.key);
        const isLocked = p.key === 'direct_link';
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => togglePlatform(p.key)}
            disabled={isLocked}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
              ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'}
              ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="text-2xl flex-shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{p.label}</span>
                {p.instant ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Instant</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Requires API Key</span>
                )}
                {isLocked && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Always included</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
              ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );

  // ── Step 3: Review ─────────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h3 className="font-semibold text-blue-900 text-base mb-1">{form.title}</h3>
        <p className="text-2xl font-bold text-blue-600 mb-3">
          KES {parseFloat(form.monthly_rent || '0').toLocaleString()}/mo
          {form.deposit_amount && parseFloat(form.deposit_amount) > 0 && (
            <span className="text-sm font-normal text-blue-500 ml-2">
              · Deposit KES {parseFloat(form.deposit_amount).toLocaleString()}
            </span>
          )}
        </p>
        {form.description && (
          <p className="text-sm text-blue-800 whitespace-pre-line line-clamp-5">{form.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Available From</p>
          <p className="font-semibold text-gray-900">
            {form.available_from ? new Date(form.available_from).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Immediately'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Amenities</p>
          <p className="font-semibold text-gray-900">{form.amenities.length} selected</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Photos</p>
          <p className="font-semibold text-gray-900">{form.photos.length} uploaded</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Platforms</p>
          <p className="font-semibold text-gray-900">{form.platforms.length} selected</p>
        </div>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-2 font-medium">Publishing to:</p>
        <div className="flex flex-wrap gap-2">
          {form.platforms.map(p => {
            const platform = PLATFORMS.find(pl => pl.key === p);
            return (
              <span key={p} className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
                {platform?.icon} {platform?.label || p}
              </span>
            );
          })}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
        <strong>Ready to publish!</strong> Your listing will go live immediately and be visible on the selected platforms.
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/listings" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Listing</h1>
          <p className="text-sm text-gray-500">Publish your vacancy to attract tenants</p>
        </div>
      </div>

      <StepIndicator current={step} steps={['Details', 'Platforms', 'Review & Publish']} />

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={submitting}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
        </div>

        {step < 3 ? (
          <button
            onClick={() => {
              if (step === 1 && !validateStep1()) return;
              setStep(s => s + 1);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : <><Megaphone className="w-4 h-4" /> Publish Now</>}
          </button>
        )}
      </div>
    </div>
  );
}
