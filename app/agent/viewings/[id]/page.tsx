'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { agentApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Calendar, ArrowLeft, Save, User, Building2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ViewingDetailPage() {
  const { isLoading: authLoading } = useRequireAuth('agent');
  const params = useParams();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [viewing, setViewing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const fetchViewing = async () => {
      try {
        const res = await agentApi.getViewing(params.id as string);
        if (res.success) { setViewing(res.data); setStatus(res.data?.status || 'scheduled'); setFeedback(res.data?.feedback || ''); }
      } catch (err) { console.error('Failed:', err); }
      finally { setLoading(false); }
    };
    fetchViewing();
  }, [authLoading, params.id]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await agentApi.updateViewing(params.id as string, { status, feedback });
      success('Viewing updated');
    } catch (err: any) { showError(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const statusColor = (s: string) => {
    switch (s) { case 'scheduled': return 'bg-blue-100 text-blue-800'; case 'completed': return 'bg-green-100 text-green-800'; case 'cancelled': return 'bg-red-100 text-red-800'; case 'no_show': return 'bg-yellow-100 text-yellow-800'; default: return 'bg-gray-100 text-gray-800'; }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/agent/viewings" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3"><Calendar className="w-8 h-8 text-indigo-600" /><h1 className="text-2xl font-bold text-gray-900">Viewing Details</h1></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!viewing ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center"><p className="text-gray-500">Viewing not found</p></div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Viewing Info</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColor(viewing.status)}`}>{viewing.status?.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3"><User className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Lead</p><p className="font-medium text-gray-900">{viewing.lead?.full_name || 'N/A'}</p></div></div>
                <div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Property</p><p className="font-medium text-gray-900">{viewing.property?.name || 'N/A'}</p></div></div>
                <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Date</p><p className="font-medium text-gray-900">{viewing.scheduled_date ? new Date(viewing.scheduled_date).toLocaleDateString() : 'N/A'}</p></div></div>
                <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Time</p><p className="font-medium text-gray-900">{viewing.scheduled_time || 'N/A'}</p></div></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label><textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="How did the viewing go?" /></div>
                <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
