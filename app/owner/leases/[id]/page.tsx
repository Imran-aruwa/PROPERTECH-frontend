'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { leasesApi } from '@/app/lib/api-services';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusBadge';
import { LeaseTimeline } from '@/components/leases/LeaseTimeline';
import { Lease } from '@/app/lib/types';
import {
  ArrowLeft, Edit, Send, Trash2, Download, RefreshCw, Loader2,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (role && role !== 'owner') { router.push('/unauthorized'); return; }

    const fetchLease = async () => {
      setLoading(true);
      const res = await leasesApi.get(id);
      if (res.success && res.data) {
        setLease(res.data);
      } else {
        setError(res.error || 'Failed to load lease');
      }
      setLoading(false);
    };
    fetchLease();
  }, [id, authLoading, isAuthenticated, role, router]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lease?')) return;
    setActionLoading('delete');
    const res = await leasesApi.delete(id);
    if (res.success) {
      router.push('/owner/leases');
    } else {
      setError(res.error || 'Failed to delete');
    }
    setActionLoading(null);
  };

  const handleResend = async () => {
    setActionLoading('resend');
    const res = await leasesApi.resendSigningLink(id);
    if (res.success) {
      alert('Signing link resent successfully');
    } else {
      setError(res.error || 'Failed to resend');
    }
    setActionLoading(null);
  };

  const handleDownloadPdf = async () => {
    setActionLoading('pdf');
    const res = await leasesApi.downloadPdf(id);
    if (res.success && res.data?.url) {
      window.open(res.data.url, '_blank');
    } else if (res.success && res.data?.pdf_url) {
      window.open(res.data.pdf_url, '_blank');
    } else {
      setError(res.error || 'PDF not available');
    }
    setActionLoading(null);
  };

  const formatCurrency = (amount: number) => `KES ${amount?.toLocaleString() || '0'}`;

  if (loading) {
    return (
      <DashboardLayout role="owner">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lease) {
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
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/owner/leases" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Lease #{lease.id}</h1>
                <LeaseStatusBadge status={lease.status} />
              </div>
              <p className="text-gray-600 text-sm">
                {lease.property?.name || `Property #${lease.property_id}`} — Unit {lease.unit?.unit_number || lease.unit_id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {lease.status === 'draft' && (
              <>
                <Link
                  href={`/owner/leases/${lease.id}/edit`}
                  className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === 'delete'}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50"
                >
                  {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </>
            )}
            {lease.status === 'sent' && (
              <button
                onClick={handleResend}
                disabled={actionLoading === 'resend'}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {actionLoading === 'resend' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Resend Link
              </button>
            )}
            {(lease.status === 'signed' || lease.status === 'active') && (
              <button
                onClick={handleDownloadPdf}
                disabled={actionLoading === 'pdf'}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {actionLoading === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg border p-6">
          <LeaseTimeline status={lease.status} />
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Lease Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Property</p>
              <p className="font-medium text-gray-900">{lease.property?.name || `#${lease.property_id}`}</p>
            </div>
            <div>
              <p className="text-gray-500">Unit</p>
              <p className="font-medium text-gray-900">{lease.unit?.unit_number || `#${lease.unit_id}`}</p>
            </div>
            <div>
              <p className="text-gray-500">Tenant</p>
              <p className="font-medium text-gray-900">{lease.tenant?.user?.full_name || `#${lease.tenant_id}`}</p>
            </div>
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">{lease.start_date}</p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium text-gray-900">{lease.end_date}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment Cycle</p>
              <p className="font-medium text-gray-900 capitalize">{lease.payment_cycle}</p>
            </div>
            <div>
              <p className="text-gray-500">Rent Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(lease.rent_amount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Deposit</p>
              <p className="font-medium text-gray-900">{formatCurrency(lease.deposit_amount)}</p>
            </div>
            {lease.escalation_rate && (
              <div>
                <p className="text-gray-500">Escalation</p>
                <p className="font-medium text-gray-900">{lease.escalation_rate}% per year</p>
              </div>
            )}
          </div>
        </div>

        {/* Clauses */}
        {lease.clauses && lease.clauses.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Clauses ({lease.clauses.length})</h2>
            <div className="space-y-2">
              {lease.clauses.map((clause) => (
                <div key={clause.id} className="border rounded-lg">
                  <button
                    onClick={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium capitalize text-gray-700">{clause.type}</span>
                    {expandedClause === clause.id ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedClause === clause.id && (
                    <div className="px-3 pb-3">
                      <p className="text-sm text-gray-600">{clause.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        {lease.signatures && lease.signatures.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Signatures</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Signer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">OTP Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lease.signatures.map((sig) => (
                    <tr key={sig.id}>
                      <td className="px-3 py-2 text-gray-900 capitalize">{sig.signer_role}</td>
                      <td className="px-3 py-2 text-gray-600">{sig.signed_at}</td>
                      <td className="px-3 py-2 text-gray-600 uppercase">{sig.channel}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sig.otp_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {sig.otp_verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
