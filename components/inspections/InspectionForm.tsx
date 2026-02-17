'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  LogIn,
  LogOut,
  Gauge,
  Camera,
  X,
  MapPin,
  Smartphone,
  Save,
  Send,
  Plus,
  ChevronDown,
  Check,
  Loader2,
  Search,
  Shield,
  TrendingUp,
  Flame,
  AlertTriangle,
  Star,
  User,
} from 'lucide-react';
import {
  generateUUID,
  INSPECTION_TYPE_CONFIG,
  ITEM_CATEGORY_CONFIG,
  CONDITION_CONFIG,
  DEFAULT_CHECKLIST_ITEMS,
  SCORE_LABELS,
  SEVERITY_CONFIG,
  type InspectionType,
  type ItemCategory,
  type ItemCondition,
  type SeverityLevel,
  type InspectionDraft,
  type InspectionItem,
  type InspectionMedia,
  type InspectionMeterReading,
  type UserRole,
} from '@/app/lib/inspection-types';
import { getDraft, saveDraft } from '@/app/lib/inspection-db';
import { syncSingleDraft } from '@/app/lib/inspection-sync';
import {
  useAutoSave,
  useGeoLocation,
  useDeviceId,
  usePhotoCapture,
  useOnlineStatus,
} from '@/app/lib/inspection-hooks';
import {
  getPropertiesWithFallback,
  getUnitsWithFallback,
  refreshOfflineCache,
} from '@/app/lib/offline-cache';
import type { CachedProperty, CachedUnit } from '@/app/lib/inspection-types';

interface InspectionFormProps {
  propertyId?: number;
  unitId?: number;
  draftUuid?: string;
  onComplete?: () => void;
  role: UserRole;
}

const TYPE_ICONS: Record<InspectionType, React.FC<{ className?: string }>> = {
  routine: ClipboardCheck,
  move_in: LogIn,
  move_out: LogOut,
  meter: Gauge,
  pre_purchase: Search,
  insurance: Shield,
  valuation: TrendingUp,
  fire_safety: Flame,
  emergency_damage: AlertTriangle,
};

export function InspectionForm({
  propertyId: initialPropertyId,
  unitId: initialUnitId,
  draftUuid,
  onComplete,
  role,
}: InspectionFormProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { position, loading: gpsLoading, refresh: refreshGps } = useGeoLocation();
  const deviceId = useDeviceId();
  const { inputRef, photos, capture, handleFileChange, removePhoto, setInitialPhotos, clearPhotos } =
    usePhotoCapture();

  // Form state
  const [properties, setProperties] = useState<CachedProperty[]>([]);
  const [units, setUnits] = useState<CachedUnit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Draft state
  const [clientUuid] = useState(() => draftUuid || generateUUID());
  const [propertyId, setPropertyId] = useState<number | null>(initialPropertyId || null);
  const [unitId, setUnitId] = useState<number | null>(initialUnitId || null);
  const [inspectionType, setInspectionType] = useState<InspectionType | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [meterReadings, setMeterReadings] = useState<InspectionMeterReading[]>([]);
  const [notes, setNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('plumbing');
  const [isExternal, setIsExternal] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorCredentials, setInspectorCredentials] = useState('');
  const [inspectorCompany, setInspectorCompany] = useState('');
  const [scoringEnabled, setScoringEnabled] = useState(false);

  // Dropdown states
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [unitSearch, setUnitSearch] = useState('');

  // Build the draft object for auto-save
  const currentDraft = useMemo<InspectionDraft | null>(() => {
    if (!propertyId || !unitId || !inspectionType) return null;

    return {
      client_uuid: clientUuid,
      inspection: {
        client_uuid: clientUuid,
        property_id: propertyId,
        unit_id: unitId,
        performed_by_role: role,
        inspection_type: inspectionType,
        status: 'draft',
        inspection_date: new Date().toISOString(),
        gps_lat: position?.lat,
        gps_lng: position?.lng,
        device_id: deviceId,
        notes,
        is_external: isExternal,
        inspector_name: inspectorName || undefined,
        inspector_credentials: inspectorCredentials || undefined,
        inspector_company: inspectorCompany || undefined,
      },
      items,
      media: photos.map((p) => ({
        client_uuid: p.id,
        inspection_client_uuid: clientUuid,
        file_data: p.data,
        file_type: 'photo' as const,
        captured_at: p.captured_at,
      })),
      meter_readings: meterReadings,
      sync_status: 'pending',
      last_modified: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }, [
    clientUuid,
    propertyId,
    unitId,
    inspectionType,
    role,
    position,
    deviceId,
    notes,
    items,
    photos,
    meterReadings,
    isExternal,
    inspectorName,
    inspectorCredentials,
    inspectorCompany,
  ]);

  const { saveStatus, forceSave } = useAutoSave(currentDraft, 2000);

  // Load properties and units
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        // Refresh cache if online
        if (isOnline) {
          await refreshOfflineCache();
        }

        const props = await getPropertiesWithFallback(isOnline);
        setProperties(props);

        const allUnits = await getUnitsWithFallback(isOnline);
        setUnits(allUnits);
      } catch (error) {
        console.error('Failed to load properties/units:', error);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [isOnline]);

  // Load existing draft if editing
  useEffect(() => {
    if (!draftUuid) return;

    async function loadDraft() {
      try {
        const draft = await getDraft(draftUuid!);
        if (draft) {
          setPropertyId(draft.inspection.property_id);
          setUnitId(draft.inspection.unit_id);
          setInspectionType(draft.inspection.inspection_type);
          setItems(draft.items);
          setMeterReadings(draft.meter_readings);
          setNotes(draft.inspection.notes || '');

          // Load photos
          if (draft.media.length > 0) {
            setInitialPhotos(
              draft.media.map((m) => ({
                id: m.client_uuid,
                data: m.file_data || '',
                captured_at: m.captured_at,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }

    loadDraft();
  }, [draftUuid, setInitialPhotos]);

  // Auto-detect external inspection type
  useEffect(() => {
    if (inspectionType) {
      const config = INSPECTION_TYPE_CONFIG[inspectionType];
      if (config.isExternal) {
        setIsExternal(true);
      }
    }
  }, [inspectionType]);

  // Initialize default checklist items when type is selected
  useEffect(() => {
    if (inspectionType && items.length === 0) {
      const defaultItems: InspectionItem[] = [];
      (Object.keys(DEFAULT_CHECKLIST_ITEMS) as ItemCategory[]).forEach((category) => {
        DEFAULT_CHECKLIST_ITEMS[category].forEach((name) => {
          defaultItems.push({
            client_uuid: generateUUID(),
            inspection_client_uuid: clientUuid,
            name,
            category,
            condition: 'good',
          });
        });
      });
      setItems(defaultItems);
    }
  }, [inspectionType, items.length, clientUuid]);

  // Initialize meter readings when type is meter
  useEffect(() => {
    if (inspectionType === 'meter' && unitId && meterReadings.length === 0) {
      setMeterReadings([
        {
          client_uuid: generateUUID(),
          inspection_client_uuid: clientUuid,
          unit_id: unitId,
          meter_type: 'water',
          previous_reading: 0,
          current_reading: 0,
          reading_date: new Date().toISOString(),
        },
        {
          client_uuid: generateUUID(),
          inspection_client_uuid: clientUuid,
          unit_id: unitId,
          meter_type: 'electricity',
          previous_reading: 0,
          current_reading: 0,
          reading_date: new Date().toISOString(),
        },
      ]);
    }
  }, [inspectionType, unitId, meterReadings.length, clientUuid]);

  // Filter units by property
  const filteredUnits = useMemo(() => {
    if (!propertyId) return [];
    return units.filter((u) => u.property_id === propertyId);
  }, [units, propertyId]);

  // Filtered properties for search
  const filteredProperties = useMemo(() => {
    if (!propertySearch) return properties;
    const search = propertySearch.toLowerCase();
    return properties.filter(
      (p) => p.name.toLowerCase().includes(search) || p.address.toLowerCase().includes(search)
    );
  }, [properties, propertySearch]);

  // Filtered units for search
  const filteredSearchUnits = useMemo(() => {
    if (!unitSearch) return filteredUnits;
    const search = unitSearch.toLowerCase();
    return filteredUnits.filter((u) => u.unit_number.toLowerCase().includes(search));
  }, [filteredUnits, unitSearch]);

  // Update item condition
  const updateItemCondition = useCallback((itemUuid: string, condition: ItemCondition) => {
    setItems((prev) =>
      prev.map((item) => (item.client_uuid === itemUuid ? { ...item, condition } : item))
    );
  }, []);

  // Update item comment
  const updateItemComment = useCallback((itemUuid: string, comment: string) => {
    setItems((prev) =>
      prev.map((item) => (item.client_uuid === itemUuid ? { ...item, comment } : item))
    );
  }, []);

  // Update item score (1-5)
  const updateItemScore = useCallback((itemUuid: string, score: number) => {
    setItems((prev) =>
      prev.map((item) => (item.client_uuid === itemUuid ? { ...item, score } : item))
    );
  }, []);

  // Update item severity
  const updateItemSeverity = useCallback((itemUuid: string, severity: SeverityLevel) => {
    setItems((prev) =>
      prev.map((item) => (item.client_uuid === itemUuid ? { ...item, severity } : item))
    );
  }, []);

  // Toggle item requires followup
  const toggleItemFollowup = useCallback((itemUuid: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.client_uuid === itemUuid
          ? { ...item, requires_followup: !item.requires_followup }
          : item
      )
    );
  }, []);

  // Add new item
  const addItem = useCallback(
    (category: ItemCategory) => {
      const newItem: InspectionItem = {
        client_uuid: generateUUID(),
        inspection_client_uuid: clientUuid,
        name: '',
        category,
        condition: 'good',
      };
      setItems((prev) => [...prev, newItem]);
    },
    [clientUuid]
  );

  // Update item name
  const updateItemName = useCallback((itemUuid: string, name: string) => {
    setItems((prev) =>
      prev.map((item) => (item.client_uuid === itemUuid ? { ...item, name } : item))
    );
  }, []);

  // Remove item
  const removeItem = useCallback((itemUuid: string) => {
    setItems((prev) => prev.filter((item) => item.client_uuid !== itemUuid));
  }, []);

  // Update meter reading
  const updateMeterReading = useCallback(
    (uuid: string, field: 'previous_reading' | 'current_reading', value: number) => {
      setMeterReadings((prev) =>
        prev.map((r) => (r.client_uuid === uuid ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!currentDraft) return;
    await forceSave(currentDraft);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!currentDraft) return;

    setSubmitting(true);

    try {
      // Update draft with submitted status
      const submittedDraft: InspectionDraft = {
        ...currentDraft,
        inspection: {
          ...currentDraft.inspection,
          status: 'submitted',
          offline_created_at: currentDraft.created_at,
        },
        sync_status: 'pending',
      };

      // Save to IDB
      await saveDraft(submittedDraft);

      // Try to sync immediately if online
      if (isOnline) {
        await syncSingleDraft(clientUuid);
      }

      // Navigate back
      if (onComplete) {
        onComplete();
      } else {
        router.push(`/${role}/inspections`);
      }
    } catch (error) {
      console.error('Failed to submit inspection:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Items for active category
  const categoryItems = useMemo(() => {
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  // Get selected property/unit names
  const selectedProperty = properties.find((p) => p.id === propertyId);
  const selectedUnit = filteredUnits.find((u) => u.id === unitId);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Hidden file input for photos */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Save Status Indicator */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600">Failed to save</span>
          )}
        </div>
        {!isOnline && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Offline mode
          </span>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Section 1: Property/Unit Selection */}
        <section className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Property & Unit</h2>

          {/* Property Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPropertyDropdownOpen(!propertyDropdownOpen);
                  setUnitDropdownOpen(false);
                }}
                className="w-full px-4 py-3 text-left bg-white border rounded-lg flex items-center justify-between hover:bg-gray-50"
              >
                <span className={selectedProperty ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedProperty ? selectedProperty.name : 'Select property...'}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {propertyDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProperties.map((property) => (
                      <button
                        key={property.id}
                        type="button"
                        onClick={() => {
                          setPropertyId(property.id);
                          setUnitId(null);
                          setPropertyDropdownOpen(false);
                          setPropertySearch('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex flex-col"
                      >
                        <span className="font-medium">{property.name}</span>
                        <span className="text-sm text-gray-500">{property.address}</span>
                      </button>
                    ))}
                    {filteredProperties.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">No properties found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unit Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (!propertyId) return;
                  setUnitDropdownOpen(!unitDropdownOpen);
                  setPropertyDropdownOpen(false);
                }}
                disabled={!propertyId}
                className={`w-full px-4 py-3 text-left bg-white border rounded-lg flex items-center justify-between ${
                  propertyId ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <span className={selectedUnit ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedUnit ? `Unit ${selectedUnit.unit_number}` : 'Select unit...'}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {unitDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search units..."
                      value={unitSearch}
                      onChange={(e) => setUnitSearch(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredSearchUnits.map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => {
                          setUnitId(unit.id);
                          setUnitDropdownOpen(false);
                          setUnitSearch('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <span className="font-medium">Unit {unit.unit_number}</span>
                        {unit.floor && (
                          <span className="text-sm text-gray-500 ml-2">Floor {unit.floor}</span>
                        )}
                      </button>
                    ))}
                    {filteredSearchUnits.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">No units found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Inspection Type */}
        <section className="bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Inspection Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(INSPECTION_TYPE_CONFIG) as InspectionType[]).map((type) => {
              const config = INSPECTION_TYPE_CONFIG[type];
              const Icon = TYPE_ICONS[type];
              const isSelected = inspectionType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInspectionType(type)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="font-medium text-sm text-center">{config.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2b: External Inspector Info */}
        {isExternal && inspectionType && (
          <section className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">External Inspector Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspector Name *
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="e.g. John Kamau"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credentials / License No.
                </label>
                <input
                  type="text"
                  value={inspectorCredentials}
                  onChange={(e) => setInspectorCredentials(e.target.value)}
                  placeholder="e.g. NEMA/EIA/2024/001"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={inspectorCompany}
                  onChange={(e) => setInspectorCompany(e.target.value)}
                  placeholder="e.g. Kenya Property Inspectors Ltd"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </section>
        )}

        {/* Section 2c: Scoring Toggle */}
        {inspectionType && inspectionType !== 'meter' && (
          <section className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Enable Scoring</h2>
              </div>
              <button
                type="button"
                onClick={() => setScoringEnabled(!scoringEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  scoringEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    scoringEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Rate each item 1-5 and set severity levels for issues found
            </p>
          </section>
        )}

        {/* Section 3: Checklist Items */}
        {inspectionType && inspectionType !== 'meter' && (
          <section className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Checklist</h2>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(Object.keys(ITEM_CATEGORY_CONFIG) as ItemCategory[]).map((category) => {
                const config = ITEM_CATEGORY_CONFIG[category];
                const isActive = activeCategory === category;
                const categoryCount = items.filter((i) => i.category === category).length;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive ? `${config.bgColor} ${config.color}` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {config.label} ({categoryCount})
                  </button>
                );
              })}
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div key={item.client_uuid} className="border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemName(item.client_uuid, e.target.value)}
                        placeholder="Item name..."
                        className="w-full font-medium text-gray-900 bg-transparent border-0 p-0 focus:ring-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.client_uuid)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Condition Radio Buttons */}
                  <div className="flex gap-2 mt-2">
                    {(Object.keys(CONDITION_CONFIG) as ItemCondition[]).map((condition) => {
                      const config = CONDITION_CONFIG[condition];
                      const isSelected = item.condition === condition;

                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => updateItemCondition(item.client_uuid, condition)}
                          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                            isSelected ? `${config.bgColor} ${config.color}` : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scoring (1-5 stars) */}
                  {scoringEnabled && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 mr-2">Score:</span>
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => updateItemScore(item.client_uuid, score)}
                            className="p-0.5"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                (item.score || 0) >= score
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                        {item.score && (
                          <span className="text-xs text-gray-500 ml-1">
                            {SCORE_LABELS[item.score]}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Severity (when condition is poor or fair) */}
                  {scoringEnabled && (item.condition === 'poor' || item.condition === 'fair') && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Severity:</span>
                      {(Object.keys(SEVERITY_CONFIG) as SeverityLevel[]).map((level) => {
                        const sevConfig = SEVERITY_CONFIG[level];
                        const isSelected = item.severity === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => updateItemSeverity(item.client_uuid, level)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              isSelected
                                ? `${sevConfig.bgColor} ${sevConfig.color}`
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {sevConfig.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Requires followup checkbox */}
                  {scoringEnabled && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.requires_followup || false}
                        onChange={() => toggleItemFollowup(item.client_uuid)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-xs text-gray-600">Requires follow-up</span>
                    </label>
                  )}

                  {/* Comment Input */}
                  <input
                    type="text"
                    value={item.comment || ''}
                    onChange={(e) => updateItemComment(item.client_uuid, e.target.value)}
                    placeholder="Add comment (optional)..."
                    className="w-full mt-2 px-3 py-2 text-sm border rounded-md"
                  />
                </div>
              ))}

              {/* Add Item Button */}
              <button
                type="button"
                onClick={() => addItem(activeCategory)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Item
              </button>
            </div>
          </section>
        )}

        {/* Section 4: Photos */}
        {inspectionType && (
          <section className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Photos</h2>

            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={photo.data}
                    alt="Inspection photo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              <button
                type="button"
                onClick={capture}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                <Camera className="w-8 h-8" />
                <span className="text-xs">Add Photo</span>
              </button>
            </div>
          </section>
        )}

        {/* Section 5: Meter Readings */}
        {(inspectionType === 'meter' || (inspectionType && meterReadings.length > 0)) && (
          <section className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Meter Readings</h2>

            <div className="space-y-4">
              {meterReadings.map((reading) => (
                <div key={reading.client_uuid} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 capitalize mb-3">
                    {reading.meter_type} Meter
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Previous Reading</label>
                      <input
                        type="number"
                        value={reading.previous_reading || ''}
                        onChange={(e) =>
                          updateMeterReading(reading.client_uuid, 'previous_reading', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Current Reading</label>
                      <input
                        type="number"
                        value={reading.current_reading || ''}
                        onChange={(e) =>
                          updateMeterReading(reading.client_uuid, 'current_reading', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 6: Notes & GPS */}
        {inspectionType && (
          <section className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-4">Notes & Location</h2>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg resize-none"
              />
            </div>

            {/* GPS Coordinates */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                {gpsLoading ? (
                  <span className="text-sm text-gray-500">Getting location...</span>
                ) : position ? (
                  <span className="text-sm text-gray-700">
                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Location unavailable</span>
                )}
              </div>
              <button
                type="button"
                onClick={refreshGps}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>

            {/* Device ID */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mt-3">
              <Smartphone className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <span className="text-sm text-gray-700 font-mono">{deviceId || 'Generating...'}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={!currentDraft}
          className="flex-1 py-3 px-4 border rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Draft
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!currentDraft || submitting}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Inspection
            </>
          )}
        </button>
      </div>
    </div>
  );
}
