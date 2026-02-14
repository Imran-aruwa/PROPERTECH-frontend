'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { maintenanceApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Wrench, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CaretakerMaintenanceDetailPage() {
  const { isLoading: authLoading } = useRequireAuth('caretaker');
  const params = useParams();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const fetchData = async () => {
      try {
        const res = await maintenanceApi.getAll();
        const items = Array.isArray(res.data) ? res.data : [];
        const found = items.find((m: any) => String(m.id) === String(params.id));
        if (found) { setRequest(found); setStatus(found.status || 'pending'); setResolution(found.resolution_notes || ''); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [authLoading, params.id]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await maintenanceApi.update(params.id as string, { status, resolution_notes: resolution });
      success('Updated');
    } catch (err: any) { showError(err.message || 'Failed'); }
    finally { setSaving(false); }
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
            <Link href="/caretaker/maintenance" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3"><Wrench className="w-8 h-8 text-teal-600" /><h1 className="text-2xl font-bold text-gray-900">{request?.title || 'Maintenance Request'}</h1></div>
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColor(request.status)}`}>{request.status?.replace('_', ' ')}</span>
              </div>
              <p className="text-gray-900 mb-4">{request.description || 'No description'}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Category:</span> <span className="text-gray-900 capitalize">{request.category || 'N/A'}</span></div>
                <div><span className="text-gray-500">Priority:</span> <span className="text-gray-900 capitalize">{request.priority || 'N/A'}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="space-y-4">
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                  <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                </select>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label><textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="What was done..." /></div>
                <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
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