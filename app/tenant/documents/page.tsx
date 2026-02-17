'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileText, Download, Loader2, FileSignature } from 'lucide-react';
import { apiClient } from '@/app/lib/api-services';
import { LeaseStatusBadge } from '@/components/leases/LeaseStatusBadge';
import { LeaseStatus } from '@/app/lib/types';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  url?: string;
}

export default function TenantDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLease, setActiveLease] = useState<any>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/tenant/documents/');

        if (response.success && response.data) {
          const items = response.data.documents || response.data || [];
          setDocuments(Array.isArray(items) ? items.map((doc: any) => ({
            id: doc.id?.toString() || '',
            name: doc.name || doc.title || '',
            type: doc.type || doc.file_type || 'PDF',
            size: doc.size || doc.file_size || '',
            date: doc.date || doc.uploaded_at || doc.created_at || '',
            url: doc.url || doc.file_url || '',
          })) : []);
        } else {
          setDocuments([]);
        }

        // Fetch active lease
        try {
          const leaseRes = await apiClient.get('/tenant/leases/');
          if (leaseRes.success && leaseRes.data) {
            const leases = Array.isArray(leaseRes.data) ? leaseRes.data : leaseRes.data?.data ? (Array.isArray(leaseRes.data.data) ? leaseRes.data.data : []) : [];
            const active = leases.find((l: any) => l.status === 'active' || l.status === 'signed');
            if (active) setActiveLease(active);
          }
        } catch {
          // Lease fetch optional
        }
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Failed to load documents');
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleDownload = async (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      try {
        const response = await apiClient.get(`/tenant/documents/${doc.id}/download/`);
        if (response.success && response.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          alert('Unable to download document');
        }
      } catch (err) {
        console.error('Failed to download document:', err);
        alert('Failed to download document');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="tenant">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading documents...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tenant">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Access your lease and property documents</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        {activeLease && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileSignature className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Lease Agreement</h3>
                    <LeaseStatusBadge status={activeLease.status as LeaseStatus} />
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {activeLease.start_date} — {activeLease.end_date} &middot; KES {activeLease.rent_amount?.toLocaleString()}/month
                  </p>
                </div>
              </div>
              {activeLease.pdf_url && (
                <a
                  href={activeLease.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents available</p>
            <p className="text-gray-400 text-sm mt-1">Your lease and property documents will appear here</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-600">{doc.type} {doc.size && `• ${doc.size}`}</p>
                      {doc.date && <p className="text-xs text-gray-500 mt-1">Uploaded: {doc.date}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
