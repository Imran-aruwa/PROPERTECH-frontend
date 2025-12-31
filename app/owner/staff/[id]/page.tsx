'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { staffApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import {
  UserCircle, ArrowLeft, Edit, Trash2, Phone, Mail, Building2,
  Calendar, DollarSign, Briefcase, Clock, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Staff } from '@/app/lib/types';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const staffId = params.id as string;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !staffId) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await staffApi.get(staffId);

        if (response.success && response.data) {
          setStaff(response.data);
        } else {
          showError('Staff member not found');
          router.push('/owner/staff');
        }
      } catch (err: any) {
        console.error('Failed to load staff:', err);
        showError('Failed to load staff details');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [authLoading, isAuthenticated, staffId, router, showError]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await staffApi.delete(staffId);

      if (!response.success) {
        showError(response.error || 'Failed to delete staff member');
        return;
      }

      success('Staff member removed successfully');
      router.push('/owner/staff');
    } catch (err: any) {
      showError(err.message || 'Failed to delete staff member');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const departmentColors: Record<string, string> = {
    security: 'bg-blue-100 text-blue-800',
    gardening: 'bg-green-100 text-green-800',
    maintenance: 'bg-orange-100 text-orange-800'
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading staff details..." />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Staff Member Not Found</h2>
          <p className="text-gray-600 mb-4">The staff member you're looking for doesn't exist.</p>
          <Link
            href="/owner/staff"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Staff
          </Link>
        </div>
      </div>
    );
  }

  const staffUser = staff.user as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/owner/staff"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">
                    {staffUser?.full_name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{staffUser?.full_name || 'Unknown'}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-600">{staff.position}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${departmentColors[staff.department]}`}>
                      {staff.department}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/owner/staff/${staffId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{staffUser?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{staffUser?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {(staff as any).emergency_contact_name && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{(staff as any).emergency_contact_name}</p>
                      <p className="text-sm text-gray-600">{(staff as any).emergency_contact_phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Employment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900 capitalize">{staff.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="font-medium text-gray-900">{staff.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium text-gray-900">{formatDate(staff.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID Number</p>
                  <p className="font-medium text-gray-900">{(staff as any).id_number || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Work History / Notes */}
            {(staff as any).notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700">{(staff as any).notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compensation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Compensation
              </h2>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(staff.salary)}</p>
                <p className="text-sm text-gray-600 mt-1">per month</p>
              </div>
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Annual Salary</span>
                  <span className="font-medium text-gray-900">{formatCurrency(staff.salary * 12)}</span>
                </div>
              </div>
            </div>

            {/* Property Assignment */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Property Assignment
              </h2>
              {staff.property ? (
                <div>
                  <p className="font-medium text-gray-900">{staff.property.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{staff.property.address}</p>
                  <Link
                    href={`/owner/properties/${staff.property_id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors mt-4"
                  >
                    View Property
                  </Link>
                </div>
              ) : (
                <p className="text-gray-600">No property assigned</p>
              )}
            </div>

            {/* Tenure */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Tenure
              </h2>
              <div className="text-center py-4">
                {(() => {
                  const startDate = new Date(staff.start_date);
                  const today = new Date();
                  const months = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
                  const years = Math.floor(months / 12);
                  const remainingMonths = months % 12;

                  if (years > 0) {
                    return (
                      <>
                        <p className="text-3xl font-bold text-gray-900">{years}</p>
                        <p className="text-sm text-gray-600">year{years > 1 ? 's' : ''} {remainingMonths > 0 ? `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}</p>
                      </>
                    );
                  }
                  return (
                    <>
                      <p className="text-3xl font-bold text-gray-900">{months || 1}</p>
                      <p className="text-sm text-gray-600">month{months > 1 ? 's' : ''}</p>
                    </>
                  );
                })()}
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                Started {formatDate(staff.start_date)}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/owner/staff/${staffId}/edit`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </Link>
                <button
                  onClick={() => setDeleteModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
