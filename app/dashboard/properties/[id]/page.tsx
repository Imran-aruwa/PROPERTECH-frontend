'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Building2, ArrowLeft, Plus, Home, Edit2, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add unit modal
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unit_number: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    monthly_rent: '',
    status: 'vacant'
  });
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitError, setUnitError] = useState('');
  const [unitSuccess, setUnitSuccess] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError('Not authenticated');
        return;
      }

      // Check if admin
      const isAdmin = session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      let query = supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId);

      // If not admin, also check ownership
      if (!isAdmin) {
        query = query.eq('user_id', session.user.id);
      }

      const { data: propertyData, error: propError } = await query.single();

      if (propError) {
        throw new Error(propError.message);
      }

      if (!propertyData) {
        throw new Error('Property not found or you do not have access');
      }

      // Load units for this property
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId);

      if (!unitsError) {
        propertyData.units = unitsData || [];
      }

      setProperty(propertyData);
    } catch (err: any) {
      setError(err.message || 'Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnitError('');
    setUnitLoading(true);

    try {
      const unitData = {
        property_id: propertyId,
        unit_number: unitForm.unit_number,
        bedrooms: unitForm.bedrooms ? parseInt(unitForm.bedrooms) : null,
        bathrooms: unitForm.bathrooms ? parseFloat(unitForm.bathrooms) : null,
        square_feet: unitForm.square_feet ? parseInt(unitForm.square_feet) : null,
        monthly_rent: unitForm.monthly_rent ? parseFloat(unitForm.monthly_rent) : null,
        status: unitForm.status
      };

      const { error: insertError } = await supabase
        .from('units')
        .insert([unitData]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setUnitSuccess(true);
      
      // Reset form
      setUnitForm({
        unit_number: '',
        bedrooms: '',
        bathrooms: '',
        square_feet: '',
        monthly_rent: '',
        status: 'vacant'
      });

      // Reload property to show new unit
      setTimeout(() => {
        loadProperty();
        setShowAddUnit(false);
        setUnitSuccess(false);
      }, 1000);
    } catch (err: any) {
      setUnitError(err.message || 'Failed to add unit');
    } finally {
      setUnitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to fetch'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add Unit Modal */}
      {showAddUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add New Unit</h2>
              <button
                onClick={() => setShowAddUnit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {unitError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{unitError}</span>
                </div>
              )}

              {unitSuccess && (
                <div className="mb-4 bg-green-50 text-green-600 p-3 rounded-lg flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Unit added successfully!</span>
                </div>
              )}

              <form onSubmit={handleAddUnit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unitForm.unit_number}
                    onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                    placeholder="e.g., 101, A1, Studio 5"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      value={unitForm.bedrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })}
                      placeholder="2"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      value={unitForm.bathrooms}
                      onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })}
                      placeholder="1.5"
                      step="0.5"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Square Feet
                    </label>
                    <input
                      type="number"
                      value={unitForm.square_feet}
                      onChange={(e) => setUnitForm({ ...unitForm, square_feet: e.target.value })}
                      placeholder="800"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Rent (KES)
                    </label>
                    <input
                      type="number"
                      value={unitForm.monthly_rent}
                      onChange={(e) => setUnitForm({ ...unitForm, monthly_rent: e.target.value })}
                      placeholder="25000"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={unitForm.status}
                    onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={unitLoading || unitSuccess}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {unitLoading ? 'Adding...' : unitSuccess ? 'Added!' : 'Add Unit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUnit(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
              <p className="text-gray-600 mt-1">{property.address}</p>
            </div>
            <button
              onClick={() => setShowAddUnit(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Unit
            </button>
          </div>

          <div className="flex gap-4">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              {property.property_type || 'Residential'}
            </div>
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              {property.units?.length || 0} Units
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Property Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
              
              <div className="space-y-4">
                {property.description && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Description</div>
                    <div className="text-gray-900">{property.description}</div>
                  </div>
                )}

                {property.purchase_price && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Purchase Price</div>
                    <div className="text-gray-900 font-semibold">
                      KES {property.purchase_price.toLocaleString()}
                    </div>
                  </div>
                )}

                {property.purchase_date && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Purchase Date</div>
                    <div className="text-gray-900">
                      {new Date(property.purchase_date).toLocaleDateString()}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-500 mb-1">Added</div>
                  <div className="text-gray-900">
                    {new Date(property.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Units List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Units</h2>
                <button
                  onClick={() => setShowAddUnit(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Unit
                </button>
              </div>

              {!property.units || property.units.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No units yet</h3>
                  <p className="text-gray-600 mb-6">Add your first unit to start managing tenants</p>
                  <button
                    onClick={() => setShowAddUnit(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Add First Unit
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {property.units.map((unit: any) => (
                    <div
                      key={unit.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            Unit {unit.unit_number}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              unit.status === 'occupied' 
                                ? 'bg-green-100 text-green-700'
                                : unit.status === 'maintenance'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {unit.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {unit.bedrooms !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bedrooms:</span>
                            <span className="font-medium text-gray-900">{unit.bedrooms}</span>
                          </div>
                        )}
                        {unit.bathrooms !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bathrooms:</span>
                            <span className="font-medium text-gray-900">{unit.bathrooms}</span>
                          </div>
                        )}
                        {unit.square_feet && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Size:</span>
                            <span className="font-medium text-gray-900">{unit.square_feet} sq ft</span>
                          </div>
                        )}
                        {unit.monthly_rent && (
                          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                            <span className="text-gray-600">Rent:</span>
                            <span className="font-semibold text-gray-900">
                              KES {unit.monthly_rent.toLocaleString()}/mo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}