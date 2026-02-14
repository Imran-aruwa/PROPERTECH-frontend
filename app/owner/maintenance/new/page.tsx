'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { ownerMaintenanceApi, propertiesApi, unitsApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Wrench, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewMaintenancePage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    property_id: '', unit_id: '', title: '', description: '',
    category: 'plumbing', priority: 'medium',
  });

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const fetchData = async () => {
      try {
        const res = await propertiesApi.getAll();
        setProperties(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!formData.property_id) { setUnits([]); return; }
    const fetchUnits = async () => {
      try {
        const res = await unitsApi.list(formData.property_id);
        setUnits(Array.isArray(res.data) ? res.data : []);
      } catch (err) { console.error(err); }
    };
    fetchUnits();
  }, [formData.property_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.property_id) { showError('Title and property are required'); return; }
    try {
      setSubmitting(true);
      await ownerMaintenanceApi.create(formData);
      success('Maintenance request created');
      setTimeout(() => router.push('/owner/maintenance'), 1500);
    } catch (err: any) { showError(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/owner/maintenance" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3"><Wrench className="w-8 h-8 text-orange-600" /><div><h1 className="text-2xl font-bold text-gray-900">New Maintenance Request</h1><p className="text-gray-600 text-sm">Report an issue</p></div></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Property *</label><select name="property_id" value={formData.property_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="">Select property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit</label><select name="unit_id" value={formData.unit_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="">Select unit</option>{units.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}</select></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Brief description of the issue" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="plumbing">Plumbing</option><option value="electrical">Electrical</option><option value="structural">Structural</option><option value="appliance">Appliance</option><option value="pest">Pest Control</option><option value="cleaning">Cleaning</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" placeholder="Detailed description..." /></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href="/owner/maintenance" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</Link>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
              {submitting ? <><LoadingSpinner size="sm" /> Creating...</> : <><Save className="w-5 h-5" /> Create Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}