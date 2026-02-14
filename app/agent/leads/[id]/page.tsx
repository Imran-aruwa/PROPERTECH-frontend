'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { agentApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Target, ArrowLeft, Save, Phone, Mail, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function LeadDetailPage() {
  const { isLoading: authLoading } = useRequireAuth('agent');
  const params = useParams();
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (authLoading) return;
    const fetchLead = async () => {
      try {
        const res = await agentApi.getLead(params.id as string);
        if (res.success) { setLead(res.data); setStatus(res.data?.status || 'new'); }
      } catch (err) { console.error('Failed to load lead:', err); }
      finally { setLoading(false); }
    };
    fetchLead();
  }, [authLoading, params.id]);

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      await agentApi.updateLead(params.id as string, { status });
      success('Lead updated');
      setEditing(false);
    } catch (err: any) { showError(err.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'viewing_scheduled': return 'bg-indigo-100 text-indigo-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/agent/leads" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">{lead?.full_name || 'Lead Details'}</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!lead ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center"><p className="text-gray-500">Lead not found</p></div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColor(lead.status)}`}>{lead.status?.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.phone && <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-900">{lead.phone}</p></div></div>}
                {lead.email && <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-900">{lead.email}</p></div></div>}
                {lead.preferred_location && <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Location</p><p className="font-medium text-gray-900">{lead.preferred_location}</p></div></div>}
                <div className="flex items-center gap-3"><DollarSign className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Budget</p><p className="font-medium text-gray-900">KES {(lead.budget_min || 0).toLocaleString()} - {(lead.budget_max || 0).toLocaleString()}</p></div></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="flex items-center gap-4">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500">
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="viewing_scheduled">Viewing Scheduled</option><option value="offer_made">Offer Made</option><option value="converted">Converted</option><option value="lost">Lost</option>
                </select>
                <button onClick={handleUpdateStatus} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
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
