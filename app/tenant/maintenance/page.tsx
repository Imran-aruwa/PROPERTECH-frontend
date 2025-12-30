'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Wrench, Loader2 } from 'lucide-react';
import { tenantDashboardApi } from '@/app/lib/api-services';

interface MaintenanceRequest {
  id: string;
  issue: string;
  description: string;
  priority: string;
  status: string;
  date: string;
}

export default function TenantMaintenancePage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    issue: '',
    description: '',
    priority: 'medium',
  });
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await tenantDashboardApi.getMaintenanceRequests();

        if (response.success && response.data) {
          const data = response.data;
          const items = data.requests || data.maintenance_requests || data || [];
          setRequests(Array.isArray(items) ? items.map((r: any) => ({
            id: r.id?.toString() || '',
            issue: r.issue || r.title || '',
            description: r.description || '',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            date: r.date || r.created_at || r.createdAt || '',
          })) : []);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error('Failed to fetch maintenance requests:', err);
        setError('Failed to load maintenance requests');
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.issue.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await tenantDashboardApi.createMaintenanceRequest({
        issue: formData.issue,
        description: formData.description,
        priority: formData.priority,
      });

      if (response.success) {
        alert('Maintenance request submitted successfully!');
        setShowForm(false);
        setFormData({ issue: '', description: '', priority: 'medium' });
        // Refresh the list
        const refreshResponse = await tenantDashboardApi.getMaintenanceRequests();
        if (refreshResponse.success && refreshResponse.data) {
          const items = refreshResponse.data.requests || refreshResponse.data.maintenance_requests || refreshResponse.data || [];
          setRequests(Array.isArray(items) ? items.map((r: any) => ({
            id: r.id?.toString() || '',
            issue: r.issue || r.title || '',
            description: r.description || '',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            date: r.date || r.created_at || r.createdAt || '',
          })) : []);
        }
      } else {
        alert(response.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Failed to submit request:', err);
      alert('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: 'Issue', accessor: (row: MaintenanceRequest) => row.issue },
    {
      header: 'Priority',
      accessor: (row: MaintenanceRequest) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.priority === 'high' ? 'bg-red-100 text-red-800' :
          row.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {row.priority.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: MaintenanceRequest) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'completed' ? 'bg-green-100 text-green-800' :
          row.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    { header: 'Date', accessor: (row: MaintenanceRequest) => row.date || '-' },
  ];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{request.issue}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{request.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              request.priority === 'high' ? 'bg-red-100 text-red-800' :
              request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {request.priority.toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              request.status === 'completed' ? 'bg-green-100 text-green-800' :
              request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {request.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          {request.date && (
            <p className="text-sm text-gray-500">Submitted: {request.date}</p>
          )}
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout role="tenant">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading maintenance requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tenant">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Maintenance Requests</h1>
            <p className="text-gray-600 mt-1">Submit and track your maintenance requests</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Submit Maintenance Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue *</label>
                <input
                  type="text"
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Provide detailed information about the issue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low - Can wait</option>
                  <option value="medium">Medium - Needs attention soon</option>
                  <option value="high">High - Urgent issue</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No maintenance requests found</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Request" to submit your first request</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={requests} columns={columns} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
