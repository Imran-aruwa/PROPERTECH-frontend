'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { apiClient } from '@/app/lib/api-services';

interface Report {
  id: string;
  name: string;
  date: string;
  type: string;
  size: string;
  url?: string;
}

export default function CaretakerReportsPage() {
  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generating, setGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get('/caretaker/reports/');

        if (response.success && response.data) {
          const items = response.data.reports || response.data || [];
          setRecentReports(Array.isArray(items) ? items.map((r: any) => ({
            id: r.id?.toString() || '',
            name: r.name || r.title || '',
            date: r.date || r.created_at || '',
            type: r.type || r.report_type || '',
            size: r.size || r.file_size || '',
            url: r.url || r.file_url || '',
          })) : []);
        } else {
          setRecentReports([]);
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err);
        setError('Failed to load reports');
        setRecentReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await apiClient.post('/caretaker/reports/generate/', {
        type: reportType,
        period: month,
      });

      if (response.success) {
        alert('Report generated successfully!');
        // Refresh reports list
        const refreshResponse = await apiClient.get('/caretaker/reports/');
        if (refreshResponse.success && refreshResponse.data) {
          const items = refreshResponse.data.reports || refreshResponse.data || [];
          setRecentReports(Array.isArray(items) ? items.map((r: any) => ({
            id: r.id?.toString() || '',
            name: r.name || r.title || '',
            date: r.date || r.created_at || '',
            type: r.type || r.report_type || '',
            size: r.size || r.file_size || '',
            url: r.url || r.file_url || '',
          })) : []);
        }
      } else {
        alert(response.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    if (report.url) {
      window.open(report.url, '_blank');
    } else {
      try {
        const response = await apiClient.get(`/caretaker/reports/${report.id}/download/`);
        if (response.success && response.data?.url) {
          window.open(response.data.url, '_blank');
        } else {
          alert('Unable to download report');
        }
      } catch (err) {
        console.error('Failed to download report:', err);
        alert('Failed to download report');
      }
    }
  };

  const reportTypes = [
    { value: 'monthly', label: 'Monthly Summary', description: 'Complete overview of monthly operations' },
    { value: 'rent', label: 'Rent Collection', description: 'Detailed rent collection report' },
    { value: 'maintenance', label: 'Maintenance', description: 'All maintenance activities' },
    { value: 'utilities', label: 'Utilities', description: 'Water and electricity consumption' },
  ];

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and download property reports</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <div className="space-y-2">
                  {reportTypes.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={type.value}
                        checked={reportType === type.value}
                        onChange={(e) => setReportType(e.target.value)}
                        className="mt-1"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Period
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No reports generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{report.name}</p>
                        <p className="text-sm text-gray-600">
                          {report.type} {report.date && `• ${report.date}`} {report.size && `• ${report.size}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(report)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
