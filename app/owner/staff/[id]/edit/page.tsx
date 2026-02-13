'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { staffApi, propertiesApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserCircle, ArrowLeft, Save, User, Phone, Briefcase, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Staff, Property } from '@/app/lib/types';

interface StaffFormData {
  full_name: string;
  phone: string;
  property_id: string;
  department: 'security' | 'gardening' | 'maintenance';
  position: string;
  salary: string;
  start_date: string;
  id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
}

export default function EditStaffPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  const staffId = params.id as string;

  const [formData, setFormData] = useState<StaffFormData>({
    full_name: '',
    phone: '',
    property_id: '',
    department: 'maintenance',
    position: '',
    salary: '',
    start_date: '',
    id_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({});

  useEffect(() => {
    if (authLoading || !isAuthenticated || !staffId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [staffResponse, propertiesResponse] = await Promise.all([
          staffApi.get(staffId),
          propertiesApi.getAll()
        ]);

        if (staffResponse.success && staffResponse.data) {
          const s = staffResponse.data as Staff;
          const staffUser = s.user as any;
          setStaff(s);
          setFormData({
            full_name: staffUser?.full_name || '',
            phone: staffUser?.phone || '',
            property_id: s.property_id?.toString() || '',
            department: s.department || 'maintenance',
            position: s.position || '',
            salary: s.salary?.toString() || '',
            start_date: s.start_date?.split('T')[0] || '',
            id_number: (s as any).id_number || '',
            emergency_contact_name: (s as any).emergency_contact_name || '',
            emergency_contact_phone: (s as any).emergency_contact_phone || '',
            notes: (s as any).notes || ''
          });
        } else {
          showError('Staff member not found');
          router.push('/owner/staff');
          return;
        }

        if (propertiesResponse.success) {
          setProperties(Array.isArray(propertiesResponse.data) ? propertiesResponse.data : []);
        }
      } catch (err) {
        console.error('Failed to load staff:', err);
        showError('Failed to load staff member');
        router.push('/owner/staff');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, staffId, router, showError]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StaffFormData, string>> = {};

    if (!formData.full_name || formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name must be at least 3 characters';
    }
    if (!formData.phone || formData.phone.trim().length < 10) {
      newErrors.phone = 'Valid phone number is required';
    }
    if (!formData.property_id) {
      newErrors.property_id = 'Please select a property';
    }
    if (!formData.position || formData.position.trim().length < 2) {
      newErrors.position = 'Position is required';
    }
    if (!formData.salary || parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Valid salary is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof StaffFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const staffData = {
        user: {
          full_name: formData.full_name,
          phone: formData.phone
        },
        property_id: parseInt(formData.property_id),
        department: formData.department,
        position: formData.position,
        salary: parseFloat(formData.salary),
        start_date: formData.start_date,
        id_number: formData.id_number,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        notes: formData.notes
      };

      await staffApi.update(staffId, staffData);
      success('Staff member updated successfully!');
      setTimeout(() => router.push(`/owner/staff/${staffId}`), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to update staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const departmentPositions: Record<string, string[]> = {
    security: ['Security Guard', 'Security Supervisor', 'Night Guard', 'Gate Keeper'],
    gardening: ['Gardener', 'Landscaper', 'Head Gardener', 'Groundskeeper'],
    maintenance: ['Plumber', 'Electrician', 'General Maintenance', 'Cleaner', 'Handyman', 'HVAC Technician']
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading staff member..." />
      </div>
    );
  }

  const staffUser = staff ? (staff as any).user : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/owner/staff/${staffId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Staff Member</h1>
                <p className="text-gray-600 text-sm">{staffUser?.full_name || 'Unknown'}</p>
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
              <User className="w-5 h-5 text-indigo-600" />
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.full_name && <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>}
              </div>

              <div>
                <label htmlFor="id_number" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number
                </label>
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                />
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
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <p className="text-sm text-gray-500 mt-6">
                  Email: <span className="font-medium text-gray-700">{staffUser?.email || 'N/A'}</span>
                  <span className="ml-2 text-gray-400">(Cannot be changed)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Property *
                </label>
                <select
                  id="property_id"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.property_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="" className="text-gray-900">Select a property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                {errors.property_id && <p className="mt-1 text-sm text-red-500">{errors.property_id}</p>}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, position: '' }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="maintenance" className="text-gray-900">Maintenance</option>
                  <option value="security" className="text-gray-900">Security</option>
                  <option value="gardening" className="text-gray-900">Gardening</option>
                </select>
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.position ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="" className="text-gray-900">Select a position</option>
                  {departmentPositions[formData.department].map(position => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                  {formData.position && !departmentPositions[formData.department].includes(formData.position) && (
                    <option value={formData.position}>{formData.position}</option>
                  )}
                </select>
                {errors.position && <p className="mt-1 text-sm text-red-500">{errors.position}</p>}
              </div>

              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>}
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Compensation
            </h2>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Salary (KES) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className={`w-full pl-14 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.salary ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.salary && <p className="mt-1 text-sm text-red-500">{errors.salary}</p>}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/owner/staff/${staffId}`}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
