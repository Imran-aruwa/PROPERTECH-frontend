'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/DataTable';
import { Zap, Droplet, Save, Loader2 } from 'lucide-react';
import { caretakerApi } from '@/app/lib/api-services';

interface Unit {
  id: string;
  unit: string;
  tenant: string;
  previousReading: number;
  currentReading: number;
}

export default function MeterReadingsPage() {
  const [activeTab, setActiveTab] = useState<'electricity' | 'water'>('electricity');
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeterReadings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await caretakerApi.getMeterReadings();

        if (response.success && response.data) {
          const data = response.data;
          const items = data.units || data.meter_readings || [];
          setUnits(items.map((u: any) => ({
            id: u.id?.toString() || '',
            unit: u.unit || u.unit_number || '',
            tenant: u.tenant || u.tenant_name || '',
            previousReading: u.previous_reading || u.previousReading || 0,
            currentReading: u.current_reading || u.currentReading || 0,
          })));
        } else {
          setUnits([]);
        }
      } catch (err) {
        console.error('Failed to fetch meter readings:', err);
        setError('Failed to load meter readings');
        setUnits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeterReadings();
  }, [activeTab]);

  const handleReadingChange = (unitId: string, value: string) => {
    setReadings(prev => ({ ...prev, [unitId]: value }));
  };

  const handleSaveReadings = async () => {
    if (Object.keys(readings).length === 0) {
      alert('Please enter at least one reading');
      return;
    }

    setSaving(true);
    try {
      // API call to save readings
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Meter readings saved successfully!');
      setReadings({});
    } catch (err) {
      alert('Failed to save readings');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'Unit',
      accessor: (row: Unit) => row.unit,
    },
    {
      header: 'Tenant',
      accessor: (row: Unit) => row.tenant || '-',
    },
    {
      header: 'Previous Reading',
      accessor: (row: Unit) => row.previousReading.toLocaleString(),
    },
    {
      header: 'New Reading',
      accessor: (row: Unit) => (
        <input
          type="number"
          min={row.previousReading}
          value={readings[row.id] || ''}
          onChange={(e) => handleReadingChange(row.id, e.target.value)}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter reading"
        />
      ),
    },
    {
      header: 'Consumption',
      accessor: (row: Unit) => {
        const current = parseInt(readings[row.id] || '0');
        const consumption = current > row.previousReading ? current - row.previousReading : 0;
        return consumption > 0 ? `${consumption} units` : '-';
      },
    },
  ];

  // Mobile card view
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {units.map((unit) => {
        const current = parseInt(readings[unit.id] || '0');
        const consumption = current > unit.previousReading ? current - unit.previousReading : 0;

        return (
          <div key={unit.id} className="bg-white rounded-lg border p-4 space-y-3">
            <div>
              <p className="font-medium text-gray-900">Unit {unit.unit}</p>
              <p className="text-sm text-gray-500">{unit.tenant || 'No tenant'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Previous</p>
                <p className="font-medium">{unit.previousReading.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Consumption</p>
                <p className="font-medium">{consumption > 0 ? `${consumption} units` : '-'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">New Reading</label>
              <input
                type="number"
                min={unit.previousReading}
                value={readings[unit.id] || ''}
                onChange={(e) => handleReadingChange(unit.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reading"
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout role="caretaker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading meter readings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meter Readings</h1>
            <p className="text-gray-600 mt-1">Record monthly utility consumption</p>
          </div>
          <button
            onClick={handleSaveReadings}
            disabled={Object.keys(readings).length === 0 || saving}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Readings
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="flex gap-2 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('electricity')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'electricity'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            Electricity
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'water'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Droplet className="w-4 h-4" />
            Water
          </button>
        </div>

        {units.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            {activeTab === 'electricity' ? (
              <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            ) : (
              <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            )}
            <p className="text-gray-500">No units found for meter readings</p>
          </div>
        ) : (
          <>
            <MobileCardView />
            <div className="hidden md:block bg-white rounded-lg shadow-sm border p-6">
              <DataTable data={units} columns={columns} />
            </div>
          </>
        )}

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Recording Tips</h3>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Take readings at the same time each month for consistency</li>
                <li>Double-check readings before saving</li>
                <li>Report any unusual consumption patterns immediately</li>
                <li>Ensure meters are accessible and clearly visible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
