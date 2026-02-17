'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { leasesApi } from '@/app/lib/api-services';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeaseForm } from '@/components/leases/LeaseForm';
import { Lease } from '@/app/lib/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditLeasePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (role && role !== 'owner') { router.push('/unauthorized'); return; }

    const fetchLease = async () => {
      setLoading(true);
      const res = await leasesApi.get(id);
      if (res.success && res.data) {
        if (res.data.status !== 'draft') {
          router.push(`/owner/leases/${id}`);
          return;
        }
        setLease(res.data);
      } else {
        setError(res.error || 'Failed to load lease');
      }
      setLoading(false);
    };
    fetchLease();
  }, [id, authLoading, isAuthenticated, role, router]);

  if (loading) {
    return (
      <DashboardLayout role="owner">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lease) {
    return (
      <DashboardLayout role="owner">
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Lease not found'}</p>
          <Link href="/owner/leases" className="text-blue-600 text-sm mt-2 inline-block">Back to leases</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/owner/leases/${id}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Lease #{id}</h1>
            <p className="text-gray-600 text-sm mt-0.5">Modify this draft lease</p>
          </div>
        </div>
        <LeaseForm mode="edit" initialData={lease} leaseId={Number(id)} />
      </div>
    </DashboardLayout>
  );
}
