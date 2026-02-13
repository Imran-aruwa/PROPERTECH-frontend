'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { tenantsApi, unitsApi, propertiesApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, ArrowLeft, Save, User, Mail, Phone, Home, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Unit, Property } from '@/app/lib/types';

interface TenantFormData {
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  unit_id: string;
  lease_start: string;
  lease_end: string;
  rent_amount: string;
  deposit_amount: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
}

export default function NewTenantPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUnitId = searchParams.get('unit_id');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);

  const [formData, setFormData] = useState<TenantFormData>({
    full_name: '',
    email: '',
    phone: '',
    id_number: '',
    unit_id: '',
    lease_start: new Date().toISOString().split('T')[0],
    lease_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rent_amount: '',
    deposit_amount: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TenantFormData, string>>>({});

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const propertiesResponse = await propertiesApi.getAll();
        const propertiesData = Array.isArray(propertiesResponse.data) ? propertiesResponse.data : [];
        setProperties(propertiesData);

        // Fetch all units from all properties
        const allUnits: Unit[] = [];
        for (const property of propertiesData) {
          try {
            const unitsResponse = await unitsApi.list(property.id.toString());
            if (unitsResponse.success && Array.isArray(unitsResponse.data)) {
              allUnits.push(...unitsResponse.data);
            }
          } catch (err) {
            console.error(`Failed to fetch units for property ${property.id}:`, err);
          }
        }
        setUnits(allUnits);

        // Pre-select unit from URL query parameter
        if (preselectedUnitId) {
          const preUnit = allUnits.find(u => String(u.id) === String(preselectedUnitId));
          if (preUnit) {
            setSelectedProperty(String(preUnit.property_id));
            setFormData(prev => ({ ...prev, unit_id: String(preUnit.id) }));
            // Pre-fill rent amount from unit
            const rent = (preUnit as any).monthly_rent ?? preUnit.rent_amount;
            if (rent) {
              setFormData(prev => ({ ...prev, unit_id: String(preUnit.id), rent_amount: String(rent) }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, preselectedUnitId]);

  useEffect(() => {
    // Include 'available', 'vacant' status units (case-insensitive)
    const isAvailable = (u: Unit) => {
      const status = u.status?.toLowerCase();
      return status === 'available' || status === 'vacant';
    };

    if (selectedProperty) {
      // Compare as strings - property_id might be UUID or number
      const filtered = units.filter(
        u => String(u.property_id) === String(selectedProperty) && isAvailable(u)
      );
      setAvailableUnits(filtered);
      setFormData(prev => ({ ...prev, unit_id: '' }));
    } else {
      setAvailableUnits(units.filter(isAvailable));
    }
  }, [selectedProperty, units]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TenantFormData, string>> = {};

    if (!formData.full_name || formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name must be at least 3 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.phone || formData.phone.trim().length < 10) {
      newErrors.phone = 'Valid phone number is required';
    }
    if (!formData.unit_id) {
      newErrors.unit_id = 'Please select a unit';
    }
    if (!formData.lease_start) {
      newErrors.lease_start = 'Lease start date is required';
    }
    if (!formData.lease_end) {
      newErrors.lease_end = 'Lease end date is required';
    }
    if (formData.lease_start && formData.lease_end && new Date(formData.lease_end) <= new Date(formData.lease_start)) {
      newErrors.lease_end = 'Lease end date must be after start date';
    }
    if (!formData.rent_amount || parseFloat(formData.rent_amount) <= 0) {
      newErrors.rent_amount = 'Valid rent amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof TenantFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const selectedUnit = units.find(u => String(u.id) === String(formData.unit_id));

      const tenantData = {
        user: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          id_number: formData.id_number,
          password: 'TempPass123!',
          role: 'tenant'
        },
        unit_id: formData.unit_id,
        lease_start: formData.lease_start,
        lease_end: formData.lease_end,
        rent_amount: parseFloat(formData.rent_amount) || selectedUnit?.rent_amount || 0,
        deposit_amount: parseFloat(formData.deposit_amount) || 0,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        notes: formData.notes
      };

      await tenantsApi.create(tenantData);

      // Update unit status to occupied after successful tenant assignment
      if (selectedUnit) {
        const propertyId = String(selectedUnit.property_id);
        try {
          await unitsApi.update(propertyId, String(selectedUnit.id), {
            ...selectedUnit,
            status: 'occupied'
          });
        } catch (unitErr) {
          console.error('Failed to update unit status:', unitErr);
        }
      }

      success('Tenant added successfully! They will receive login credentials via email.');
      setTimeout(() => router.push('/owner/tenants'), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to add tenant');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/owner/tenants"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Tenant</h1>
                <p className="text-gray-600 text-sm">Create a new tenant account and assign to a unit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+254 700 000 000"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="id_number" className="block text-sm font-medium text-gray-700 mb-1">
                  ID / Passport Number
                </label>
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="National ID or Passport number"
                />
              </div>
            </div>
          </div>

          {/* Unit Assignment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-purple-600" />
              Unit Assignment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">
                  Property (Optional Filter)
                </label>
                <select
                  id="property"
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="" className="text-gray-900">All Properties</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id} className="text-gray-900">
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="unit_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  id="unit_id"
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.unit_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="" className="text-gray-900">Select a unit</option>
                  {availableUnits.map(unit => (
                    <option key={unit.id} value={unit.id} className="text-gray-900">
                      {unit.unit_number || 'Unit'} - {unit.bedrooms ?? 0} BR - KES {((unit as any).monthly_rent ?? unit.rent_amount ?? 0).toLocaleString()}/mo
                    </option>
                  ))}
                </select>
                {errors.unit_id && <p className="mt-1 text-sm text-red-500">{errors.unit_id}</p>}
                {availableUnits.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">No available units found. All units may be occupied.</p>
                )}
              </div>
            </div>
          </div>

          {/* Lease Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Lease Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="lease_start" className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Start Date *
                </label>
                <input
                  type="date"
                  id="lease_start"
                  name="lease_start"
                  value={formData.lease_start}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.lease_start ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lease_start && <p className="mt-1 text-sm text-red-500">{errors.lease_start}</p>}
              </div>

              <div>
                <label htmlFor="lease_end" className="block text-sm font-medium text-gray-700 mb-1">
                  Lease End Date *
                </label>
                <input
                  type="date"
                  id="lease_end"
                  name="lease_end"
                  value={formData.lease_end}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.lease_end ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lease_end && <p className="mt-1 text-sm text-red-500">{errors.lease_end}</p>}
              </div>

              <div>
                <label htmlFor="rent_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rent (KES) *
                </label>
                <input
                  type="number"
                  id="rent_amount"
                  name="rent_amount"
                  value={formData.rent_amount}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.rent_amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="25000"
                />
                {errors.rent_amount && <p className="mt-1 text-sm text-red-500">{errors.rent_amount}</p>}
              </div>

              <div>
                <label htmlFor="deposit_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Security Deposit (KES)
                </label>
                <input
                  type="number"
                  id="deposit_amount"
                  name="deposit_amount"
                  value={formData.deposit_amount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="50000"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Any additional notes about this tenant..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/owner/tenants"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Adding Tenant...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Add Tenant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
