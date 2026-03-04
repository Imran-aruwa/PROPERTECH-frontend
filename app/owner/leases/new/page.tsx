'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeaseForm } from '@/components/leases/LeaseForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CreateLeasePage() {
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (role && role !== 'owner') { router.push('/unauthorized'); return; }
  }, [isLoading, isAuthenticated, role, router]);

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/owner/leases" className="text-tx-muted hover:text-tx-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-tx-primary">Create Lease</h1>
            <p className="text-tx-secondary text-sm mt-0.5">Create a new lease agreement</p>
          </div>
        </div>
        <LeaseForm mode="create" />
      </div>
    </DashboardLayout>
  );
}
