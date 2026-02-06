'use client';

import { useRequireAuth } from '@/app/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import { InspectionForm } from '@/components/inspections/InspectionForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AgentNewInspectionPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth('agent');
  const searchParams = useSearchParams();

  const draftUuid = searchParams.get('draft') || undefined;
  const propertyId = searchParams.get('property') ? Number(searchParams.get('property')) : undefined;
  const unitId = searchParams.get('unit') ? Number(searchParams.get('unit')) : undefined;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/agent/inspections"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {draftUuid ? 'Edit Inspection' : 'New Inspection'}
          </h1>
        </div>
      </div>

      <InspectionForm
        role="agent"
        propertyId={propertyId}
        unitId={unitId}
        draftUuid={draftUuid}
      />
    </div>
  );
}
