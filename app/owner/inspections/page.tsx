'use client';

import { useRequireAuth } from '@/app/lib/auth-context';
import { InspectionList } from '@/components/inspections/InspectionList';
import { Loader2 } from 'lucide-react';

export default function OwnerInspectionsPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth('owner');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return <InspectionList role="owner" userId={user.id} />;
}
