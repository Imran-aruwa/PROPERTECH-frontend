'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { ownerMaintenanceApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Wrench, ArrowLeft, Save, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function MaintenanceDetailPage() {
  const { isLoading: authLoading } = useRequireAuth('owner');
  const params = useParams();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const fetch = async () => {
      try {
        const res = await ownerMaintenanceApi.get(params.id as string);
        if (res.success) { setRequest(res.data); setStatus(res.data?.status || 'pending'); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [authLoading, params.id]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await ownerMaintenanceApi.update(params.id as string, { status });
      success('Updated successfully');
    } catch (err: any) { showError(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const priorityColor = (p: string) => {
    switch (p) { case 'urgent': return 'bg-red-100 text-red-800'; case 'high': return 'bg-orange-100 text-orange-800'; case 'medium': return 'bg-yellow-100 text-yellow-800'; default: return 'bg-blue-100 text-blue-800'; }
  };
  const statusColor = (s: string) => {
    switch (s) { case 'completed': return 'bg-green-100 text-green-800'; case 'in_progress': return 'bg-yellow-100 text-yellow-800'; case 'cancelled': return 'bg-red-100 text-red-800'; default: return 'bg-blue-100 text-blue-800'; }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/owner/maintenance" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3"><Wrench className="w-8 h-8 text-orange-600" /><h1 className="text-2xl font-bold text-gray-900">{request?.title || 'Maintenance Request'}</h1></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!request ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center"><p className="text-gray-500">Request not found</p></div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Details</h2>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${priorityColor(request.priority)}`}>{request.priority}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColor(request.status)}`}>{request.status?.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div><p className="text-sm text-gray-500">Description</p><p className="text-gray-900">{request.description || 'No description'}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Category</p><p className="font-medium text-gray-900 capitalize">{request.category || 'N/A'}</p></div>
                  <div><p className="text-sm text-gray-500">Reported</p><p className="font-medium text-gray-900">{request.reported_date || request.created_at ? new Date(request.reported_date || request.created_at).toLocaleDateString() : 'N/A'}</p></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="flex items-center gap-4">
                <select value={status} onChange={e => setStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                </select>
                <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />} Update
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}