'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { agentApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Target, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewLeadPage() {
  const { isLoading: authLoading } = useRequireAuth('agent');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', budget_min: '', budget_max: '',
    preferred_location: '', bedrooms_needed: '', notes: '', source: 'website',
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) { showError('Name and phone are required'); return; }
    try {
      setSubmitting(true);
      await agentApi.createLead({
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        bedrooms_needed: formData.bedrooms_needed ? parseInt(formData.bedrooms_needed) : null,
        status: 'new',
      });
      success('Lead created successfully');
      setTimeout(() => router.push('/agent/leads'), 1500);
    } catch (err: any) { showError(err.message || 'Failed to create lead'); }
    finally { setSubmitting(false); }
  };
  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/agent/leads" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-indigo-600" />
              <div><h1 className="text-2xl font-bold text-gray-900">New Lead</h1><p className="text-gray-600 text-sm">Add a new prospect</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="Jane Doe" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="jane@example.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="+254 700 000 000" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Source</label><select name="source" value={formData.source} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500"><option value="website">Website</option><option value="referral">Referral</option><option value="walk_in">Walk-in</option><option value="social_media">Social Media</option><option value="other">Other</option></select></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Budget (KES)</label><input type="number" name="budget_min" value={formData.budget_min} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="10000" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (KES)</label><input type="number" name="budget_max" value={formData.budget_max} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="50000" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label><input type="number" name="bedrooms_needed" value={formData.bedrooms_needed} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="2" /></div>
            </div>
            <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label><input type="text" name="preferred_location" value={formData.preferred_location} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="Kilimani, Nairobi" /></div>
            <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500" placeholder="Additional notes..." /></div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href="/agent/leads" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</Link>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? <><LoadingSpinner size="sm" /> Creating...</> : <><Save className="w-5 h-5" /> Create Lead</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
