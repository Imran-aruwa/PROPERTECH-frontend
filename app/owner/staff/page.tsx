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
      <div className="min-h-screen bg-bg-secondary p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-bd rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-tx-primary">Staff</h1>
                <p className="text-tx-secondary mt-1">Manage all your property staff</p>
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
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Total Staff</h3>
              <UserCircle className="w-5 h-5 text-tx-muted" />
            </div>
            <p className="text-3xl font-bold text-tx-primary">{staff.length}</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Security</h3>
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {staff.filter(s => s.department === 'security').length}
            </p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Maintenance</h3>
              <UserCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {staff.filter(s => s.department === 'maintenance').length}
            </p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Gardening</h3>
              <UserCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {staff.filter(s => s.department === 'gardening').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-tx-secondary" />
              <span className="font-medium text-tx-secondary">Filters:</span>
            </div>

            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <div className="flex gap-2">
              {(['all', 'security', 'maintenance', 'gardening'] as const).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    departmentFilter === dept
                      ? 'bg-indigo-600 text-white'
                      : 'bg-bg-secondary text-tx-secondary hover:bg-bd'
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
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-12 text-center">
            <UserCircle className="w-16 h-16 text-tx-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tx-primary mb-2">
              {staff.length === 0 ? 'No staff members yet' : 'No staff found'}
            </h3>
            <p className="text-tx-secondary mb-6">
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
                  className="bg-bg-card rounded-lg shadow-sm border border-bd overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Staff Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-bg-card/20 flex items-center justify-center">
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
                        <Mail className="w-4 h-4 text-tx-muted" />
                        <span className="text-tx-secondary">{memberUser?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-tx-muted" />
                        <span className="text-tx-secondary">{memberUser?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-tx-muted" />
                        <span className="text-tx-secondary">{member.property?.name || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-bd pt-4 mb-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${departmentColors[member.department] || 'bg-bg-secondary text-tx-primary'}`}>
                        {member.department || 'Staff'}
                      </span>
                      <span className="font-bold text-tx-primary">
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
                        className="flex items-center justify-center px-4 py-2 bg-bg-secondary text-tx-secondary rounded-lg hover:bg-bd transition-colors"
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
