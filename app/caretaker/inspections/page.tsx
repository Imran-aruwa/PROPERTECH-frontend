'use client';

import { useRequireAuth } from '@/app/lib/auth-context';
import { InspectionList } from '@/components/inspections/InspectionList';
import { Loader2 } from 'lucide-react';

export default function CaretakerInspectionsPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth('caretaker');

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

  return <InspectionList role="caretaker" userId={user.id} />;
}
