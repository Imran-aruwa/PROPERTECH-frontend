'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Smartphone,
  User,
  Building2,
  Home,
  ExternalLink,
  Check,
  Lock,
  Loader2,
  X,
  AlertTriangle,
  ClipboardCheck,
  LogIn,
  LogOut,
  Gauge,
  Star,
  Shield,
  FileSignature,
} from 'lucide-react';
import { inspectionsApi } from '@/app/lib/api-services';
import { InspectionStatusBadge, InspectionTypeBadge } from './InspectionStatusBadge';
import {
  ITEM_CATEGORY_CONFIG,
  CONDITION_CONFIG,
  SCORE_LABELS,
  SEVERITY_CONFIG,
  type InspectionDetail as InspectionDetailType,
  type ItemCategory,
  type SeverityLevel,
  type UserRole,
} from '@/app/lib/inspection-types';

interface InspectionDetailProps {
  inspectionId: string | number;
  role: UserRole;
}

export function InspectionDetail({ inspectionId, role }: InspectionDetailProps) {
  const router = useRouter();
  const [inspection, setInspection] = useState<InspectionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'review' | 'lock' | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch inspection data
  useEffect(() => {
    async function fetchInspection() {
      setLoading(true);
      setError(null);

      try {
        const response = await inspectionsApi.get(Number(inspectionId));

        if (!response.success) {
          setError(response.error || 'Failed to load inspection');
          return;
        }

        setInspection(response.data);
      } catch (err) {
        setError('Failed to load inspection');
        console.error('Failed to fetch inspection:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInspection();
  }, [inspectionId]);

  // Handle review
  const handleReview = async () => {
    if (!inspection) return;

    setActionLoading('review');

    try {
      const response = await inspectionsApi.review(inspection.id);

      if (response.success) {
        setInspection((prev) => (prev ? { ...prev, status: 'reviewed' } : null));
      } else {
        alert(response.error || 'Failed to mark as reviewed');
      }
    } catch (err) {
      console.error('Failed to review:', err);
      alert('Failed to mark as reviewed');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle lock
  const handleLock = async () => {
    if (!inspection) return;

    if (!confirm('Are you sure you want to lock this inspection? This cannot be undone.')) {
      return;
    }

    setActionLoading('lock');

    try {
      const response = await inspectionsApi.lock(inspection.id);

      if (response.success) {
        setInspection((prev) => (prev ? { ...prev, status: 'locked' } : null));
      } else {
        alert(response.error || 'Failed to lock inspection');
      }
    } catch (err) {
      console.error('Failed to lock:', err);
      alert('Failed to lock inspection');
    } finally {
      setActionLoading(null);
    }
  };

  // Group items by category
  const itemsByCategory = inspection?.items.reduce(
    (acc, item) => {
      const category = item.category as ItemCategory;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<ItemCategory, typeof inspection.items>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load inspection</h2>
        <p className="text-gray-500 mb-6">{error || 'Inspection not found'}</p>
        <Link
          href={`/${role}/inspections`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inspections
        </Link>
      </div>
    );
  }

  const date = new Date(inspection.inspection_date);
  const canReview =
    (role === 'owner' || role === 'agent') && inspection.status === 'submitted';
  const canLock = role === 'owner' && inspection.status === 'reviewed';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Inspection photo"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/${role}/inspections`}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Inspection Details</h1>
          </div>
        </div>

        {/* Type and Status Header */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <InspectionTypeBadge type={inspection.inspection_type} />
            <InspectionStatusBadge status={inspection.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{inspection.property_name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Home className="w-4 h-4" />
              <span>Unit {inspection.unit_number}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>{inspection.performed_by_name} ({inspection.performed_by_role})</span>
            </div>
          </div>
        </div>

        {/* Overall Score Card */}
        {inspection.overall_score != null && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-gray-900">Overall Score</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        inspection.overall_score != null && inspection.overall_score >= s
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {inspection.overall_score.toFixed(1)}
                </span>
                {inspection.pass_fail && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      inspection.pass_fail === 'pass'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {inspection.pass_fail.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* External Inspector Info */}
        {inspection.is_external && inspection.inspector_name && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">External Inspector</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{inspection.inspector_name}</p>
              </div>
              {inspection.inspector_credentials && (
                <div>
                  <p className="text-gray-500">Credentials</p>
                  <p className="font-medium text-gray-900">{inspection.inspector_credentials}</p>
                </div>
              )}
              {inspection.inspector_company && (
                <div>
                  <p className="text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">{inspection.inspector_company}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trust Data */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Verification Data</h2>

          <div className="space-y-3">
            {/* GPS */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">GPS Coordinates</p>
                {inspection.gps_lat && inspection.gps_lng ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {inspection.gps_lat.toFixed(6)}, {inspection.gps_lng.toFixed(6)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${inspection.gps_lat},${inspection.gps_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Not available</span>
                )}
              </div>
            </div>

            {/* Device ID */}
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Device ID</p>
                <span className="text-sm text-gray-600 font-mono">
                  {inspection.device_id || 'Not available'}
                </span>
              </div>
            </div>

            {/* Offline Created */}
            {inspection.offline_created_at && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Created Offline</p>
                  <span className="text-sm text-gray-600">
                    {new Date(inspection.offline_created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Checklist Items */}
        {itemsByCategory && Object.keys(itemsByCategory).length > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Checklist Items</h2>

            <div className="space-y-4">
              {(Object.keys(itemsByCategory) as ItemCategory[]).map((category) => {
                const config = ITEM_CATEGORY_CONFIG[category];
                const categoryItems = itemsByCategory[category];

                return (
                  <div key={category}>
                    <h3 className={`text-sm font-medium ${config.color} mb-2`}>
                      {config.label}
                    </h3>
                    <div className="space-y-2">
                      {categoryItems.map((item) => {
                        const conditionConfig = CONDITION_CONFIG[item.condition];

                        return (
                          <div
                            key={item.client_uuid || item.id}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.name}</p>
                                {item.comment && (
                                  <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${conditionConfig.bgColor} ${conditionConfig.color}`}
                                >
                                  {conditionConfig.label}
                                </span>
                              </div>
                            </div>
                            {/* Score, severity, followup badges */}
                            {(item.score || item.severity || item.requires_followup) && (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {item.score && (
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3.5 h-3.5 ${
                                          (item.score || 0) >= s
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-xs text-gray-500 ml-1">
                                      {SCORE_LABELS[item.score]}
                                    </span>
                                  </div>
                                )}
                                {item.severity && SEVERITY_CONFIG[item.severity as SeverityLevel] && (
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      SEVERITY_CONFIG[item.severity as SeverityLevel].bgColor
                                    } ${SEVERITY_CONFIG[item.severity as SeverityLevel].color}`}
                                  >
                                    {SEVERITY_CONFIG[item.severity as SeverityLevel].label}
                                  </span>
                                )}
                                {item.requires_followup && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                                    Follow-up needed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photos */}
        {inspection.media && inspection.media.length > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">
              Photos ({inspection.media.length})
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {inspection.media.map((media) => (
                <button
                  key={media.client_uuid || media.id}
                  onClick={() => setSelectedImage(media.file_url || media.file_data || '')}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={media.file_url || media.file_data}
                    alt="Inspection photo"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Meter Readings */}
        {inspection.meter_readings && inspection.meter_readings.length > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Meter Readings</h2>

            <div className="space-y-3">
              {inspection.meter_readings.map((reading) => (
                <div
                  key={reading.client_uuid || reading.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <h3 className="font-medium text-gray-900 capitalize mb-2">
                    {reading.meter_type} Meter
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Previous:</span>
                      <span className="ml-2 font-medium">{reading.previous_reading}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current:</span>
                      <span className="ml-2 font-medium">{reading.current_reading}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Usage: <span className="font-medium">{reading.current_reading - reading.previous_reading}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        {inspection.signatures && inspection.signatures.length > 0 && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FileSignature className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">
                Signatures ({inspection.signatures.length})
              </h2>
            </div>

            <div className="space-y-3">
              {inspection.signatures.map((sig) => (
                <div
                  key={sig.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{sig.signer_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{sig.signer_role}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 capitalize">
                        {sig.signature_type}
                      </span>
                      {sig.signed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(sig.signed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Audit trail info */}
                  {(sig.ip_address || sig.gps_lat) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-3 text-xs text-gray-500">
                      {sig.ip_address && <span>IP: {sig.ip_address}</span>}
                      {sig.gps_lat && sig.gps_lng && (
                        <span>GPS: {sig.gps_lat.toFixed(4)}, {sig.gps_lng.toFixed(4)}</span>
                      )}
                      {sig.device_fingerprint && (
                        <span className="font-mono">Device: {sig.device_fingerprint.slice(0, 12)}...</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {inspection.notes && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{inspection.notes}</p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {(canReview || canLock) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            {canReview && (
              <button
                onClick={handleReview}
                disabled={actionLoading !== null}
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading === 'review' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Marking as Reviewed...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Mark as Reviewed
                  </>
                )}
              </button>
            )}
            {canLock && (
              <button
                onClick={handleLock}
                disabled={actionLoading !== null}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading === 'lock' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Locking...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Lock Inspection
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
