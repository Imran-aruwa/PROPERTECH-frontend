'use client';

import { useRequireAuth } from '@/app/lib/auth-context';
import { useParams } from 'next/navigation';
import { InspectionDetail } from '@/components/inspections/InspectionDetail';
import { Loader2 } from 'lucide-react';

export default function CaretakerInspectionDetailPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth('caretaker');
  const params = useParams();
  const inspectionId = params.id as string;

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

  return <InspectionDetail inspectionId={inspectionId} role="caretaker" />;
}
