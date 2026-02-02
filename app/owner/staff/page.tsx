'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { staffApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import { UserCircle, Plus, Eye, Edit, Trash2, Filter, Phone, Mail, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Staff } from '@/app/lib/types';

export default function OwnerStaffPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'security' | 'gardening' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; staffId: number | null }>({
    isOpen: false,
    staffId: null
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await staffApi.getAll();
        const staffArray = Array.isArray(response.data) ? response.data : [];
        setStaff(staffArray);
      } catch (err: any) {
        console.error('Failed to load staff:', err);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [authLoading, isAuthenticated]);

  const handleDelete = async () => {
    if (!deleteModal.staffId) return;

    try {
      setDeleting(true);
      const response = await staffApi.delete(deleteModal.staffId.toString());

      if (!response.success) {
        showError(response.error || 'Failed to delete staff member');
        return;
      }

      success('Staff member removed successfully');
      setStaff(staff.filter(s => s.id !== deleteModal.staffId));
      setDeleteModal({ isOpen: false, staffId: null });
    } catch (err: any) {
      showError(err.message || 'Failed to delete staff member');
    } finally {
      setDeleting(false);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesDepartment = departmentFilter === 'all' ? true : member.department === departmentFilter;
    const searchLower = searchTerm.toLowerCase();
    const memberUser = member.user as any;
    const matchesSearch = searchTerm === '' ||
      memberUser?.full_name?.toLowerCase().includes(searchLower) ||
      memberUser?.email?.toLowerCase().includes(searchLower) ||
      member.position?.toLowerCase().includes(searchLower);
    return matchesDepartment && matchesSearch;
  });

  const departmentColors: Record<string, string> = {
    security: 'bg-blue-100 text-blue-800',
    gardening: 'bg-green-100 text-green-800',
    maintenance: 'bg-orange-100 text-orange-800'
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
                <p className="text-gray-600 mt-1">Manage all your property staff</p>
              </div>
            </div>
            <Link
              href="/owner/staff/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Staff</h3>
              <UserCircle className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Security</h3>
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {staff.filter(s => s.department === 'security').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Maintenance</h3>
              <UserCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {staff.filter(s => s.department === 'maintenance').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Gardening</h3>
              <UserCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {staff.filter(s => s.department === 'gardening').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>

            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <div className="flex gap-2">
              {(['all', 'security', 'maintenance', 'gardening'] as const).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    departmentFilter === dept
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  {dept !== 'all' && (
                    <span className="ml-2">({staff.filter(s => s.department === dept).length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <UserCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {staff.length === 0 ? 'No staff members yet' : 'No staff found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {staff.length === 0
                ? 'Get started by adding your first staff member'
                : 'No staff match your search criteria'}
            </p>
            {staff.length === 0 && (
              <Link
                href="/owner/staff/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Add Your First Staff Member
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((member) => {
              const memberUser = member.user as any;
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Staff Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-xl font-bold">
                            {memberUser?.full_name?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{memberUser?.full_name || 'Staff Member'}</h3>
                          <p className="text-indigo-100 text-sm">{member.position}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Details */}
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{memberUser?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{memberUser?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{member.property?.name || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 mb-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${departmentColors[member.department] || 'bg-gray-100 text-gray-800'}`}>
                        {member.department || 'Staff'}
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(member.salary ?? 0)}/mo
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/owner/staff/${member.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      <Link
                        href={`/owner/staff/${member.id}/edit`}
                        className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, staffId: member.id })}
                        className="flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, staffId: null })}
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
