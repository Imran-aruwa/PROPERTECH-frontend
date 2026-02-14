'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { apiClient } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewUserPage() {
  const { isLoading: authLoading } = useRequireAuth('admin');
  const router = useRouter();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '', role: 'tenant',
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) { showError('Required fields missing'); return; }
    try {
      setSubmitting(true);
      await apiClient.post('/admin/users/', formData);
      success('User created');
      setTimeout(() => router.push('/admin/users'), 1500);
    } catch (err: any) { showError(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };
  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3"><Users className="w-8 h-8 text-red-600" /><div><h1 className="text-2xl font-bold text-gray-900">Create User</h1></div></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="owner">Owner</option><option value="agent">Agent</option><option value="tenant">Tenant</option><option value="caretaker">Caretaker</option><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white" /></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <Link href="/admin/users" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</Link>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {submitting ? <><LoadingSpinner size="sm" /> Creating...</> : <><Save className="w-5 h-5" /> Create User</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}