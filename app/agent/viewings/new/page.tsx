'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { agentApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Calendar, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewViewingPage() {
  const { isLoading: authLoading } = useRequireAuth('agent');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    lead_id: '', property_id: '', scheduled_date: '', scheduled_time: '10:00', notes: '',
  });

  useEffect(() => {
    if (authLoading) return;
    const fetchData = async () => {
      try {
        const [leadsRes, propsRes] = await Promise.all([agentApi.getLeads(), agentApi.getProperties()]);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
        setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);
      } catch (err) { console.error('Failed to load:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [authLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lead_id || !formData.property_id || !formData.scheduled_date) { showError('Please fill required fields'); return; }
    try {
      setSubmitting(true);
      await agentApi.createViewing({ ...formData, status: 'scheduled' });
      success('Viewing scheduled');
      setTimeout(() => router.push('/agent/viewings'), 1500);
    } catch (err: any) { showError(err.message || 'Failed to schedule'); }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/agent/viewings" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <div><h1 className="text-2xl font-bold text-gray-900">Schedule Viewing</h1><p className="text-gray-600 text-sm">Arrange a property viewing</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Viewing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Lead *</label><select name="lead_id" value={formData.lead_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="">Select lead</option>{leads.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Property *</label><select name="property_id" value={formData.property_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="">Select property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label><input type="date" name="scheduled_date" value={formData.scheduled_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="time" name="scheduled_time" value={formData.scheduled_time} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" /></div>
            </div>
            <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Notes..." /></div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href="/agent/viewings" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</Link>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? <><LoadingSpinner size="sm" /> Scheduling...</> : <><Save className="w-5 h-5" /> Schedule</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
