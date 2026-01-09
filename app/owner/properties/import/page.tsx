'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { propertiesApi, unitsApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Building2, ArrowLeft, Upload, Download, Plus, Trash2, Save, FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

interface UnitData {
  unit_number: string;
  floor: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  monthly_rent: number;
  status: 'available' | 'occupied' | 'maintenance';
  unit_type: string;
  amenities: string;
  // New fields for Kuscco Homes specifications
  house_type: 'villa' | 'maisonette' | 'townhouse' | 'apartment' | 'bungalow';
  has_master_ensuite: boolean;
  upstairs_bathrooms: number;
  downstairs_toilets: number;
  has_servant_quarters: boolean;
  sq_has_washroom: boolean;
  ownership_status: 'rented' | 'mortgaged' | 'owner_occupied' | 'available';
}

interface PropertyImportData {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description: string;
  units: UnitData[];
}

const defaultUnit: UnitData = {
  unit_number: '',
  floor: '1',
  bedrooms: 3,
  bathrooms: 3,
  size_sqm: 120,
  monthly_rent: 45000,
  status: 'available',
  unit_type: 'maisonette',
  amenities: '',
  // Kuscco Homes defaults
  house_type: 'maisonette',
  has_master_ensuite: true,
  upstairs_bathrooms: 1,
  downstairs_toilets: 1,
  has_servant_quarters: true,
  sq_has_washroom: true,
  ownership_status: 'available'
};

export default function BulkImportPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [importMode, setImportMode] = useState<'manual' | 'csv'>('manual');

  const [property, setProperty] = useState<PropertyImportData>({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Kenya',
    description: '',
    units: []
  });

  const [bulkUnitConfig, setBulkUnitConfig] = useState({
    prefix: 'House',
    startNumber: 1,
    count: 120, // Kuscco Homes has 120 units
    floors: 2, // Maisonettes have 2 floors
    unitsPerFloor: 120,
    bedrooms: 3,
    bathrooms: 3, // Master ensuite + upstairs bathroom + downstairs toilet
    size_sqm: 120,
    monthly_rent: 45000,
    unit_type: 'maisonette',
    // Kuscco Homes specifications
    house_type: 'maisonette' as const,
    has_master_ensuite: true,
    upstairs_bathrooms: 1, // 1 bathroom/toilet upstairs (besides master ensuite)
    downstairs_toilets: 1, // Extra toilet downstairs
    has_servant_quarters: true,
    sq_has_washroom: true
  });

  const generateUnits = () => {
    const units: UnitData[] = [];

    for (let i = 0; i < bulkUnitConfig.count; i++) {
      const unitNumber = bulkUnitConfig.startNumber + i;
      units.push({
        unit_number: `${bulkUnitConfig.prefix} ${unitNumber}`,
        floor: String(bulkUnitConfig.floors),
        bedrooms: bulkUnitConfig.bedrooms,
        bathrooms: bulkUnitConfig.bathrooms,
        size_sqm: bulkUnitConfig.size_sqm,
        monthly_rent: bulkUnitConfig.monthly_rent,
        status: 'available',
        unit_type: bulkUnitConfig.unit_type,
        amenities: bulkUnitConfig.has_servant_quarters ? 'SQ;parking' : 'parking',
        // Kuscco Homes specifications
        house_type: bulkUnitConfig.house_type,
        has_master_ensuite: bulkUnitConfig.has_master_ensuite,
        upstairs_bathrooms: bulkUnitConfig.upstairs_bathrooms,
        downstairs_toilets: bulkUnitConfig.downstairs_toilets,
        has_servant_quarters: bulkUnitConfig.has_servant_quarters,
        sq_has_washroom: bulkUnitConfig.sq_has_washroom,
        ownership_status: 'available'
      });
    }

    setProperty(prev => ({ ...prev, units }));
    success(`Generated ${units.length} units with Kuscco Homes specifications`);
  };

  const addUnit = () => {
    setProperty(prev => ({
      ...prev,
      units: [...prev.units, { ...defaultUnit, unit_number: `Unit ${prev.units.length + 1}` }]
    }));
  };

  const removeUnit = (index: number) => {
    setProperty(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  const updateUnit = (index: number, field: keyof UnitData, value: any) => {
    setProperty(prev => ({
      ...prev,
      units: prev.units.map((unit, i) =>
        i === index ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const units: UnitData[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const unit: any = { ...defaultUnit };

          headers.forEach((header, idx) => {
            if (values[idx]) {
              switch (header) {
                case 'unit_number':
                case 'unit':
                  unit.unit_number = values[idx];
                  break;
                case 'floor':
                  unit.floor = values[idx];
                  break;
                case 'bedrooms':
                case 'beds':
                  unit.bedrooms = parseInt(values[idx]) || 1;
                  break;
                case 'bathrooms':
                case 'baths':
                  unit.bathrooms = parseInt(values[idx]) || 1;
                  break;
                case 'size':
                case 'size_sqm':
                case 'sqm':
                  unit.size_sqm = parseFloat(values[idx]) || 50;
                  break;
                case 'rent':
                case 'monthly_rent':
                case 'price':
                  unit.monthly_rent = parseFloat(values[idx]) || 15000;
                  break;
                case 'status':
                  unit.status = values[idx].toLowerCase() as any || 'available';
                  break;
                case 'type':
                case 'unit_type':
                  unit.unit_type = values[idx];
                  break;
                case 'amenities':
                  unit.amenities = values[idx];
                  break;
              }
            }
          });

          if (unit.unit_number) {
            units.push(unit);
          }
        }

        setProperty(prev => ({ ...prev, units }));
        success(`Imported ${units.length} units from CSV`);
      } catch (err) {
        showError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = 'unit_number,floor,bedrooms,bathrooms,size_sqm,monthly_rent,status,unit_type,amenities';
    const example = 'Unit 101,1,2,1,65,18000,available,apartment,parking;wifi';
    const csv = `${headers}\n${example}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'units_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!property.name || !property.address || !property.city) {
      showError('Please fill in all required property fields');
      return;
    }

    if (property.units.length === 0) {
      showError('Please add at least one unit');
      return;
    }

    try {
      setSubmitting(true);

      // Create property first
      const propertyResponse = await propertiesApi.create({
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        postal_code: property.postal_code,
        country: property.country,
        description: property.description,
        total_units: property.units.length
      });

      if (!propertyResponse.success) {
        showError(propertyResponse.error || 'Failed to create property');
        return;
      }

      const propertyId = propertyResponse.data?.id;

      // Create units
      let successCount = 0;
      let failCount = 0;

      for (const unit of property.units) {
        try {
          const unitResponse = await unitsApi.create(propertyId, {
            unit_number: unit.unit_number,
            floor: parseInt(unit.floor) || 1,
            bedrooms: unit.bedrooms,
            bathrooms: unit.bathrooms,
            size_sqm: unit.size_sqm,
            monthly_rent: unit.monthly_rent,
            status: unit.status,
            unit_type: unit.unit_type,
            amenities: unit.amenities ? unit.amenities.split(';') : []
          });

          if (unitResponse.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }

      if (failCount > 0) {
        success(`Property created with ${successCount} units. ${failCount} units failed.`);
      } else {
        success(`Property "${property.name}" created with ${successCount} units!`);
      }

      setTimeout(() => router.push(`/owner/properties/${propertyId}`), 1500);
    } catch (err: any) {
      showError(err.message || 'Failed to create property and units');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/owner/properties"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bulk Import Property</h1>
                <p className="text-gray-600 text-sm">Create a property with multiple units at once</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={property.name}
                  onChange={(e) => setProperty(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Kuscco Homes Kitengela"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={property.address}
                  onChange={(e) => setProperty(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={property.city}
                  onChange={(e) => setProperty(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State/County</label>
                <input
                  type="text"
                  value={property.state}
                  onChange={(e) => setProperty(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={property.postal_code}
                  onChange={(e) => setProperty(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={property.country}
                  onChange={(e) => setProperty(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={property.description}
                  onChange={(e) => setProperty(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bulk Unit Generation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Units</h2>
            <p className="text-sm text-gray-600 mb-4">
              Quickly generate multiple units with similar specifications, or upload a CSV file.
            </p>

            {/* Mode Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setImportMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  importMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                Manual / Generate
              </button>
              <button
                type="button"
                onClick={() => setImportMode('csv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  importMode === 'csv'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV Import
              </button>
            </div>

            {importMode === 'manual' ? (
              <div className="space-y-6">
                {/* Basic Configuration */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Basic Configuration</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Prefix</label>
                      <input
                        type="text"
                        value={bulkUnitConfig.prefix}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, prefix: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.count}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                        min="1"
                        max="500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House Type</label>
                      <select
                        value={bulkUnitConfig.house_type}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, house_type: e.target.value as any, unit_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      >
                        <option value="maisonette">Maisonette</option>
                        <option value="villa">Villa</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="bungalow">Bungalow</option>
                        <option value="apartment">Apartment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Floors</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.floors}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.bedrooms}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size (sqm)</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.size_sqm}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, size_sqm: parseFloat(e.target.value) || 50 }))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES)</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.monthly_rent}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, monthly_rent: parseFloat(e.target.value) || 15000 }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Bathrooms</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.bathrooms}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 1 }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Kuscco Homes Specifications */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Bathroom Configuration (Kuscco Homes Style)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="masterEnsuite"
                        checked={bulkUnitConfig.has_master_ensuite}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, has_master_ensuite: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <label htmlFor="masterEnsuite" className="text-sm text-gray-700">Master Ensuite</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upstairs Bathrooms</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.upstairs_bathrooms}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, upstairs_bathrooms: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Downstairs Toilets</label>
                      <input
                        type="number"
                        value={bulkUnitConfig.downstairs_toilets}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, downstairs_toilets: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Servant Quarters Configuration */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Servant Quarters (SQ)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasSQ"
                        checked={bulkUnitConfig.has_servant_quarters}
                        onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, has_servant_quarters: e.target.checked }))}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <label htmlFor="hasSQ" className="text-sm text-gray-700">Has Servant Quarters (SQ)</label>
                    </div>
                    {bulkUnitConfig.has_servant_quarters && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="sqWashroom"
                          checked={bulkUnitConfig.sq_has_washroom}
                          onChange={(e) => setBulkUnitConfig(prev => ({ ...prev, sq_has_washroom: e.target.checked }))}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label htmlFor="sqWashroom" className="text-sm text-gray-700">SQ has Washroom</label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Configuration Summary</h4>
                  <p className="text-sm text-yellow-700">
                    {bulkUnitConfig.count} x {bulkUnitConfig.house_type} units with {bulkUnitConfig.bedrooms} bedrooms,
                    {bulkUnitConfig.has_master_ensuite ? ' master ensuite,' : ''}
                    {bulkUnitConfig.upstairs_bathrooms > 0 ? ` ${bulkUnitConfig.upstairs_bathrooms} upstairs bathroom(s),` : ''}
                    {bulkUnitConfig.downstairs_toilets > 0 ? ` ${bulkUnitConfig.downstairs_toilets} downstairs toilet(s),` : ''}
                    {bulkUnitConfig.has_servant_quarters ? ` SQ${bulkUnitConfig.sq_has_washroom ? ' with washroom' : ''}` : ' no SQ'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={generateUnits}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Generate {bulkUnitConfig.count} Units
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  CSV columns: unit_number, floor, bedrooms, bathrooms, size_sqm, monthly_rent, status, unit_type, amenities
                </p>
              </div>
            )}
          </div>

          {/* Units Preview */}
          {property.units.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Units Preview ({property.units.length})
                </h2>
                <button
                  type="button"
                  onClick={addUnit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Unit
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">Unit</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">Type</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">Beds</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">Baths</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">Rent</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">Ownership</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">SQ</th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {property.units.slice(0, 50).map((unit, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={unit.unit_number}
                            onChange={(e) => updateUnit(index, 'unit_number', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-gray-900 bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={unit.house_type}
                            onChange={(e) => updateUnit(index, 'house_type', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-gray-900 bg-white"
                          >
                            <option value="maisonette">Maisonette</option>
                            <option value="villa">Villa</option>
                            <option value="townhouse">Townhouse</option>
                            <option value="bungalow">Bungalow</option>
                            <option value="apartment">Apartment</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={unit.bedrooms}
                            onChange={(e) => updateUnit(index, 'bedrooms', parseInt(e.target.value) || 0)}
                            className="w-14 px-2 py-1 border border-gray-200 rounded text-gray-900 bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={unit.bathrooms}
                            onChange={(e) => updateUnit(index, 'bathrooms', parseInt(e.target.value) || 0)}
                            className="w-14 px-2 py-1 border border-gray-200 rounded text-gray-900 bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={unit.monthly_rent}
                            onChange={(e) => updateUnit(index, 'monthly_rent', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-gray-900 bg-white"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={unit.ownership_status}
                            onChange={(e) => updateUnit(index, 'ownership_status', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-gray-900 bg-white"
                          >
                            <option value="available">Available</option>
                            <option value="rented">Rented</option>
                            <option value="mortgaged">Mortgaged</option>
                            <option value="owner_occupied">Owner Occupied</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={unit.has_servant_quarters}
                            onChange={(e) => updateUnit(index, 'has_servant_quarters', e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeUnit(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {property.units.length > 50 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 50 of {property.units.length} units
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/owner/properties"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || property.units.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Property with {property.units.length} Units
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
