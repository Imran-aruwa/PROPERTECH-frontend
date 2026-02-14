'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { propertiesApi } from '@/lib/api-services';

interface PropertyOption {
  id: number;
  name: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>(['all']);
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await propertiesApi.getAll();
        const data = Array.isArray(response.data) ? response.data
          : response.data?.results ? response.data.results
          : [];
        setPropertyOptions(data.map((p: any) => ({ id: p.id, name: p.name })));
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, []);

  const reportTypes = [
    { id: 'monthly', name: 'Monthly Financial Report', description: 'Comprehensive monthly overview' },
    { id: 'quarterly', name: 'Quarterly Summary', description: 'Quarterly financial report' },
    { id: 'annual', name: 'Annual Tax Report', description: 'Annual summary for tax purposes' },
    { id: 'property', name: 'Property Comparison', description: 'Compare all properties' },
    { id: 'tenant', name: 'Tenant Payment History', description: 'All tenant payments' },
    { id: 'agent', name: 'Agent Performance', description: 'Agent commissions & performance' },
  ];

  const generateReport = () => {
    alert(`Generating ${reportType} report for ${dateRange.start} to ${dateRange.end}...`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate comprehensive financial and operational reports</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configure Report</h2>

        {/* Date Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Property Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Properties</label>
          <select
            multiple
            value={selectedProperties}
            onChange={(e) => setSelectedProperties(Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Properties</option>
            {propertyOptions.map((prop) => (
              <option key={prop.id} value={prop.id.toString()}>
                {prop.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            onClick={() => setReportType(report.id)}
            className={`bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition ${
              reportType === report.id ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <FileText className={`w-6 h-6 ${reportType === report.id ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
              </div>
            </div>
            {reportType === report.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={generateReport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Generate Report
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
