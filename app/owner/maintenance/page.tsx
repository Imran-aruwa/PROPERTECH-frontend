'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { maintenanceApi, staffApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Wrench, Filter, Eye, UserPlus } from 'lucide-react';
import { MaintenanceRequest, Staff } from '@/app/lib/types';

export default function OwnerMaintenancePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; requestId: number | null }>({
    isOpen: false,
    requestId: null
  });
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [requestsData, staffData] = await Promise.all([
          maintenanceApi.getAll(),
          staffApi.getAll()
        ]);
        const requestsArray = Array.isArray(requestsData.data) ? requestsData.data : [];
        const staffArray = Array.isArray(staffData.data) ? staffData.data : [];
        setRequests(requestsArray);
        setStaff(staffArray.filter((s: Staff) => s.department === 'maintenance'));
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setRequests([]);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, refreshKey]);

  const handleAssignStaff = async () => {
    if (!assignModal.requestId || !selectedStaff) return;

    try {
      setAssigning(true);
      await maintenanceApi.update(String(assignModal.requestId), { assigned_to: selectedStaff });
      success('Staff assigned successfully');
      setAssignModal({ isOpen: false, requestId: null });
      setSelectedStaff(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      showError(err.message || 'Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (requestId: number, newStatus: string) => {
    try {
      await maintenanceApi.update(String(requestId), { status: newStatus });
      success('Status updated successfully');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      showError(err.message || 'Failed to update status');
    }
  };

  const filteredRequests = requests.filter(r => 
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

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
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
              <p className="text-gray-600 mt-1">Manage and track all maintenance requests</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Requests</h3>
            <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Completed</h3>
            <p className="text-3xl font-bold text-green-600">
              {requests.filter(r => r.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex gap-2">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  {status !== 'all' && (
                    <span className="ml-2">({requests.filter(r => r.status === status).length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No maintenance requests</h3>
            <p className="text-gray-600">
              {requests.length === 0 
                ? 'All caught up! No maintenance requests at the moment.'
                : 'No requests match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{request.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{request.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">{request.unit?.unit_number || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${priorityColors[request.priority]}`}>
                          {request.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request.id, e.target.value)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border-0 ${statusColors[request.status]}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.assigned_to ? (
                          <span className="text-sm text-gray-900">
                            {(request.assigned_staff?.user as any)?.full_name || 'Assigned'}
                          </span>
                        ) : (
                          <button
                            onClick={() => setAssignModal({ isOpen: true, requestId: request.id })}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Assign Staff
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.reported_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={assignModal.isOpen}
        onClose={() => !assigning && setAssignModal({ isOpen: false, requestId: null })}
        title="Assign Staff Member"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Staff Member
            </label>
            <select
              value={selectedStaff || ''}
              onChange={(e) => setSelectedStaff(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="">Choose a staff member</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.user as any)?.full_name || 'Staff Member'} - {s.position}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAssignStaff}
              disabled={!selectedStaff || assigning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Assign
                </>
              )}
            </button>
            <button
              onClick={() => setAssignModal({ isOpen: false, requestId: null })}
              disabled={assigning}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}