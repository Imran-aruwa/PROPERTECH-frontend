'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/app/lib/auth-context';
import { apiClient } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { User, ArrowLeft, Save, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function UserDetailPage() {
  const { isLoading: authLoading } = useRequireAuth('admin');
  const params = useParams();
  const { toasts, success, error: showError, removeToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [role, setRole] = useState('');

  useEffect(() => {
    if (authLoading) return;
    const fetchUser = async () => {
      try {
        const res = await apiClient.get(`/admin/users/${params.id}/`);
        const data = res.data?.data || res.data;
        if (data) { setUser(data); setIsActive(data.is_active !== false); setRole(data.role || ''); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, [authLoading, params.id]);

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await apiClient.put(`/admin/users/${params.id}/`, { is_active: isActive, role });
      success('User updated');
    } catch (err: any) { showError(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
            <div className="flex items-center gap-3"><User className="w-8 h-8 text-red-600" /><h1 className="text-2xl font-bold text-gray-900">{user?.full_name || 'User Details'}</h1></div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!user ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center"><p className="text-gray-500">User not found</p></div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3"><User className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Name</p><p className="font-medium text-gray-900">{user.full_name}</p></div></div>
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-900">{user.email}</p></div></div>
                {user.phone && <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-900">{user.phone}</p></div></div>}
                <div><p className="text-sm text-gray-500">Joined</p><p className="font-medium text-gray-900">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"><option value="owner">Owner</option><option value="agent">Agent</option><option value="tenant">Tenant</option><option value="caretaker">Staff (Caretaker)</option><option value="staff">Staff</option><option value="admin">Admin</option></select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                  <span className="text-gray-900">Account Active</span>
                </label>
                <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}