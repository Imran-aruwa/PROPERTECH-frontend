'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { unitsApi, propertiesApi } from '@/lib/api-services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/app/lib/hooks';
import {
  Building2, User, CreditCard, Wrench, ArrowLeft,
  Edit, X, Save, Loader2, Home, BedDouble, Bath,
  Maximize, DollarSign, CheckCircle, AlertCircle, Megaphone
} from 'lucide-react';
import Link from 'next/link';

interface Unit {
  id: string;
  unit_number: string;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  monthly_rent: number | null;
  rent_amount: number | null;
  status: string;
  occupancy_type: string | null;
  property_id: string;
  square_feet: number | null;
  size_sqm: number | null;
  floor: number | null;
  has_master_bedroom: boolean | null;
  has_servant_quarters: boolean | null;
  sq_bathrooms: number | null;
  description: string | null;
  amenities: string | null;
  property?: { id: string; name: string; address: string; };
  tenant?: { id: string; full_name: string; email: string; phone: string; balance_due: number; } | null;
  payments?: Array<{ id: string; amount: number; status: string; payment_type: string; date?: string; }>;
  maintenance_requests?: Array<{ id: string; title: string; status: string; priority: string; }>;
}

type TabType = "overview" | "tenant" | "payments" | "maintenance";

// Edit Modal Component
function EditUnitModal({
  unit,
  isOpen,
  onClose,
  onSave
}: {
  unit: Unit;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Unit>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    unit_number: unit.unit_number || '',
    bedrooms: unit.bedrooms ?? '',
    bathrooms: unit.bathrooms ?? '',
    toilets: unit.toilets ?? '',
    square_feet: unit.square_feet || unit.size_sqm || '',
    monthly_rent: unit.monthly_rent || unit.rent_amount || '',
    status: unit.status || 'vacant',
    occupancy_type: unit.occupancy_type || 'available',
    floor: unit.floor ?? '',
    description: unit.description || '',
    has_master_bedroom: unit.has_master_bedroom ?? false,
    has_servant_quarters: unit.has_servant_quarters ?? false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        unit_number: unit.unit_number || '',
        bedrooms: unit.bedrooms ?? '',
        bathrooms: unit.bathrooms ?? '',
        toilets: unit.toilets ?? '',
        square_feet: unit.square_feet || unit.size_sqm || '',
        monthly_rent: unit.monthly_rent || unit.rent_amount || '',
        status: unit.status || 'vacant',
        occupancy_type: unit.occupancy_type || 'available',
        floor: unit.floor ?? '',
        description: unit.description || '',
        has_master_bedroom: unit.has_master_bedroom ?? false,
        has_servant_quarters: unit.has_servant_quarters ?? false,
      });
    }
  }, [isOpen, unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        unit_number: formData.unit_number,
        bedrooms: formData.bedrooms === '' ? null : Number(formData.bedrooms),
        bathrooms: formData.bathrooms === '' ? null : Number(formData.bathrooms),
        toilets: formData.toilets === '' ? null : Number(formData.toilets),
        square_feet: formData.square_feet === '' ? null : Number(formData.square_feet),
        monthly_rent: formData.monthly_rent === '' ? null : Number(formData.monthly_rent),
        status: formData.status,
        occupancy_type: formData.occupancy_type,
        floor: formData.floor === '' ? null : Number(formData.floor),
        description: formData.description || null,
        has_master_bedroom: formData.has_master_bedroom,
        has_servant_quarters: formData.has_servant_quarters,
      });
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Edit Unit</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor
                  </label>
                  <input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Specifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Toilets</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.toilets}
                      onChange={(e) => setFormData({ ...formData, toilets: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Size (sq ft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.square_feet}
                      onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent (KES)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      value={formData.monthly_rent}
                      onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="bought">Bought</option>
                    <option value="mortgaged">Mortgaged</option>
                  </select>
                </div>
              </div>

              {/* Occupancy Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupancy Type
                </label>
                <select
                  value={formData.occupancy_type}
                  onChange={(e) => setFormData({ ...formData, occupancy_type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="mortgaged">Mortgaged</option>
                  <option value="bought">Bought</option>
                  <option value="owner_occupied">Owner Occupied</option>
                </select>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Features</h3>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_master_bedroom}
                      onChange={(e) => setFormData({ ...formData, has_master_bedroom: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Master Bedroom</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_servant_quarters}
                      onChange={(e) => setFormData({ ...formData, has_servant_quarters: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Servant Quarters (DSQ)</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter unit description..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UnitDetailPage() {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const unitId = params?.id as string;
  const { toasts, success, error: showError, removeToast } = useToast();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [propertyName, setPropertyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchUnit = useCallback(async () => {
    try {
      setLoading(true);
      const response = await unitsApi.get(unitId);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch unit");
      }

      const unitData = response.data;
      setUnit(unitData);

      // Fetch property name if we have property_id
      if (unitData.property_id && !unitData.property?.name) {
        try {
          const propResponse = await propertiesApi.get(unitData.property_id);
          if (propResponse.success && propResponse.data) {
            setPropertyName(propResponse.data.name || "Unknown Property");
          }
        } catch {
          setPropertyName("Unknown Property");
        }
      } else if (unitData.property?.name) {
        setPropertyName(unitData.property.name);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (role && role !== "owner") { router.push("/unauthorized"); return; }
    if (unitId) fetchUnit();
  }, [authLoading, isAuthenticated, role, router, unitId, fetchUnit]);

  const handleSaveUnit = async (data: Partial<Unit>) => {
    try {
      const result = await unitsApi.update(unit?.property_id || '', unitId, data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update unit');
      }

      // Update local state
      setUnit(prev => prev ? { ...prev, ...data } : null);
      success('Unit updated successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to update unit');
      throw err;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "tenant", label: "Tenant", icon: User },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
  ];

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "KES 0";
    return "KES " + amount.toLocaleString();
  };

  const formatValue = (value: number | null | undefined, suffix?: string) => {
    if (value === null || value === undefined) return "Not specified";
    return suffix ? `${value} ${suffix}` : value.toString();
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      vacant: "bg-yellow-100 text-yellow-800",
      occupied: "bg-green-100 text-green-800",
      rented: "bg-green-100 text-green-800",
      bought: "bg-blue-100 text-blue-800",
      mortgaged: "bg-purple-100 text-purple-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      maintenance: "bg-orange-100 text-orange-800"
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load unit</h2>
        <p className="text-gray-500 mb-6">{error || "Unit not found"}</p>
        <Link
          href="/owner/units"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Units
        </Link>
      </div>
    );
  }

  const rentAmount = unit.monthly_rent || unit.rent_amount || 0;
  const sizeValue = unit.square_feet || unit.size_sqm;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Edit Modal */}
      <EditUnitModal
        unit={unit}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveUnit}
      />

      {/* Vacancy trigger prompt */}
      {(unit.status?.toLowerCase() === 'vacant' || unit.status?.toLowerCase() === 'available') && !unit.tenant && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">This unit is now vacant</p>
              <p className="text-xs text-amber-700">Create a listing to fill it faster — publish to WhatsApp, Facebook, and property portals automatically.</p>
            </div>
          </div>
          <Link
            href={`/owner/listings/new?unit_id=${unit.id}`}
            className="flex-shrink-0 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Megaphone className="w-4 h-4" /> Create Listing
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">{unit.unit_number}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(unit.status)}`}>
                {unit.status || 'Unknown'}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{propertyName || unit.property?.name || "Property"}</p>
          </div>
          <div className="flex items-center gap-3">
            {(unit.status?.toLowerCase() === 'vacant' || unit.status?.toLowerCase() === 'available') && !unit.tenant && (
              <Link
                href={`/owner/tenants/new?unit_id=${unit.id}&property_id=${unit.property_id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Assign Tenant
              </Link>
            )}
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Unit
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BedDouble className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bedrooms</p>
              <p className="font-semibold text-gray-900">{unit.bedrooms ?? 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Bath className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Bathrooms</p>
              <p className="font-semibold text-gray-900">{unit.bathrooms ?? 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Maximize className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Size</p>
              <p className="font-semibold text-gray-900">{sizeValue ? `${sizeValue} sq ft` : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Monthly Rent</p>
              <p className="font-semibold text-green-600">{formatCurrency(rentAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="border-b">
          <nav className="flex gap-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Unit Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Unit Details</h3>
                <dl className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Unit Number</dt>
                    <dd className="font-medium text-gray-900">{unit.unit_number}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Floor</dt>
                    <dd className="font-medium text-gray-900">{formatValue(unit.floor)}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Bedrooms</dt>
                    <dd className="font-medium text-gray-900">{formatValue(unit.bedrooms)}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Bathrooms</dt>
                    <dd className="font-medium text-gray-900">{formatValue(unit.bathrooms)}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Toilets</dt>
                    <dd className="font-medium text-gray-900">{formatValue(unit.toilets)}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Size</dt>
                    <dd className="font-medium text-gray-900">{sizeValue ? `${sizeValue} sq ft` : 'Not specified'}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Monthly Rent</dt>
                    <dd className="font-medium text-green-600">{formatCurrency(rentAmount)}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Status</dt>
                    <dd>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadge(unit.status)}`}>
                        {unit.status || "N/A"}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-gray-500">Occupancy Type</dt>
                    <dd className="font-medium text-gray-900 capitalize">
                      {(unit.occupancy_type || 'available').replace('_', ' ')}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Features */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <dl className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Master Bedroom</dt>
                    <dd className="font-medium">
                      {unit.has_master_bedroom ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <dt className="text-gray-500">Servant Quarters (DSQ)</dt>
                    <dd className="font-medium">
                      {unit.has_servant_quarters ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </dd>
                  </div>
                  {unit.sq_bathrooms !== undefined && unit.sq_bathrooms !== null && unit.sq_bathrooms > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <dt className="text-gray-500">SQ Bathrooms</dt>
                      <dd className="font-medium text-gray-900">{unit.sq_bathrooms}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 pt-4 border-t">
                  <dt className="text-gray-500 text-sm mb-2">Description</dt>
                  <dd className="text-gray-700">
                    {unit.description || (
                      <span className="text-gray-400 italic">No description available</span>
                    )}
                  </dd>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tenant" && (
            <div>
              {unit.tenant ? (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{unit.tenant.full_name}</h3>
                      <p className="text-gray-500">Current Tenant</p>
                    </div>
                  </div>
                  <dl className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-white rounded-lg border">
                      <dt className="text-gray-500 text-sm">Email</dt>
                      <dd className="font-medium text-gray-900 mt-1">{unit.tenant.email}</dd>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <dt className="text-gray-500 text-sm">Phone</dt>
                      <dd className="font-medium text-gray-900 mt-1">{unit.tenant.phone || 'Not provided'}</dd>
                    </div>
                    <div className="p-4 bg-white rounded-lg border md:col-span-2">
                      <dt className="text-gray-500 text-sm">Balance Due</dt>
                      <dd className={`font-semibold text-lg mt-1 ${unit.tenant.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(unit.tenant.balance_due)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tenant assigned</h3>
                  <p className="text-gray-500 mb-6">This unit is currently vacant</p>
                  <Link
                    href={`/owner/tenants/new?unit_id=${unit.id}&property_id=${unit.property_id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Tenant
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              {unit.payments && unit.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unit.payments.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-4 text-gray-600 capitalize">{p.payment_type || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadge(p.status)}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{p.date || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments</h3>
                  <p className="text-gray-500">No payment records for this unit</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "maintenance" && (
            <div>
              {unit.maintenance_requests && unit.maintenance_requests.length > 0 ? (
                <div className="space-y-4">
                  {unit.maintenance_requests.map((m) => (
                    <div key={m.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{m.title}</h4>
                        <p className="text-sm text-gray-500 capitalize">Priority: {m.priority}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests</h3>
                  <p className="text-gray-500">No maintenance requests for this unit</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
