/**
 * Inspection Types and Constants
 * Universal Inspection Engine - Internal + External, scoring, templates, signatures
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type InspectionType =
  | 'routine'
  | 'move_in'
  | 'move_out'
  | 'meter'
  | 'pre_purchase'
  | 'insurance'
  | 'valuation'
  | 'fire_safety'
  | 'emergency_damage';

export type InspectionStatus = 'draft' | 'submitted' | 'reviewed' | 'locked';
export type ItemCategory = 'plumbing' | 'electrical' | 'structure' | 'cleanliness' | 'safety' | 'exterior' | 'appliances' | 'fixtures';
export type ItemCondition = 'good' | 'fair' | 'poor';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type MeterType = 'water' | 'electricity';
export type UserRole = 'owner' | 'agent' | 'caretaker';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// INTERFACES
// ============================================

export interface Inspection {
  id?: number;
  client_uuid: string;
  property_id: number;
  unit_id: number;
  performed_by_id?: number;
  performed_by_role: UserRole;
  inspection_type: InspectionType;
  status: InspectionStatus;
  inspection_date: string;
  gps_lat?: number;
  gps_lng?: number;
  device_id?: string;
  offline_created_at?: string;
  notes?: string;
  // Universal engine fields
  is_external?: boolean;
  template_id?: string;
  overall_score?: number;
  pass_fail?: 'pass' | 'fail' | null;
  inspector_name?: string;
  inspector_credentials?: string;
  inspector_company?: string;
  report_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InspectionItem {
  id?: number;
  client_uuid: string;
  inspection_client_uuid: string;
  inspection_id?: number;
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  comment?: string;
  // Scoring & severity
  score?: number; // 1-5
  severity?: SeverityLevel;
  pass_fail?: 'pass' | 'fail' | null;
  requires_followup?: boolean;
  photo_required?: boolean;
  created_at?: string;
}

export interface InspectionMedia {
  id?: number;
  client_uuid: string;
  inspection_client_uuid: string;
  inspection_id?: number;
  file_data?: string;
  file_url?: string;
  file_type: 'photo' | 'video';
  captured_at: string;
  created_at?: string;
}

export interface InspectionMeterReading {
  id?: number;
  client_uuid: string;
  inspection_client_uuid: string;
  inspection_id?: number;
  unit_id: number;
  meter_type: MeterType;
  previous_reading: number;
  current_reading: number;
  reading_date: string;
  created_at?: string;
}

export interface InspectionSignature {
  id?: number;
  inspection_id?: number;
  signer_name: string;
  signer_role: 'inspector' | 'owner' | 'tenant';
  signature_type: 'typed' | 'drawn';
  signature_data: string;
  signed_at?: string;
  ip_address?: string;
  device_fingerprint?: string;
  gps_lat?: number;
  gps_lng?: number;
}

export interface InspectionTemplate {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  inspection_type: InspectionType;
  is_external: boolean;
  categories?: string[];
  default_items?: Array<{ name: string; category: string; required_photo?: boolean }>;
  scoring_enabled: boolean;
  pass_threshold?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InspectionDraft {
  client_uuid: string;
  inspection: Inspection;
  items: InspectionItem[];
  media: InspectionMedia[];
  meter_readings: InspectionMeterReading[];
  sync_status: SyncStatus;
  sync_error?: string;
  server_id?: number;
  last_modified: string;
  created_at: string;
}

export interface InspectionListItem {
  id: number;
  client_uuid: string;
  property_id: number;
  property_name: string;
  unit_id: number;
  unit_number: string;
  performed_by_id: number;
  performed_by_name: string;
  performed_by_role: UserRole;
  inspection_type: InspectionType;
  status: InspectionStatus;
  inspection_date: string;
  is_external?: boolean;
  overall_score?: number;
  pass_fail?: string;
  inspector_name?: string;
  created_at: string;
}

export interface InspectionDetail {
  id: number;
  client_uuid: string;
  property_id: number;
  property_name: string;
  unit_id: number;
  unit_number: string;
  performed_by_id: number;
  performed_by_name: string;
  performed_by_role: UserRole;
  inspection_type: InspectionType;
  status: InspectionStatus;
  inspection_date: string;
  gps_lat?: number;
  gps_lng?: number;
  device_id?: string;
  offline_created_at?: string;
  notes?: string;
  is_external?: boolean;
  overall_score?: number;
  pass_fail?: string;
  inspector_name?: string;
  inspector_credentials?: string;
  inspector_company?: string;
  template_id?: string;
  report_url?: string;
  created_at: string;
  updated_at: string;
  items: InspectionItem[];
  media: InspectionMedia[];
  meter_readings: InspectionMeterReading[];
  signatures: InspectionSignature[];
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{ uuid: string; error: string }>;
}

export interface CachedProperty {
  id: number;
  name: string;
  address: string;
  cached_at: string;
}

export interface CachedUnit {
  id: number;
  property_id: number;
  unit_number: string;
  floor?: number;
  cached_at: string;
}

// ============================================
// CONSTANTS
// ============================================

export const INSPECTION_TYPE_CONFIG: Record<InspectionType, { label: string; icon: string; description: string; isExternal?: boolean }> = {
  routine: {
    label: 'Routine Inspection',
    icon: 'ClipboardCheck',
    description: 'Regular property condition check',
  },
  move_in: {
    label: 'Move-in Inspection',
    icon: 'LogIn',
    description: 'Document condition before tenant moves in',
  },
  move_out: {
    label: 'Move-out Inspection',
    icon: 'LogOut',
    description: 'Document condition after tenant moves out',
  },
  meter: {
    label: 'Meter Reading',
    icon: 'Gauge',
    description: 'Record water and electricity meter readings',
  },
  pre_purchase: {
    label: 'Pre-Purchase',
    icon: 'Search',
    description: 'Pre-purchase / pre-rent property assessment',
    isExternal: true,
  },
  insurance: {
    label: 'Insurance',
    icon: 'Shield',
    description: 'Insurance claim condition report',
    isExternal: true,
  },
  valuation: {
    label: 'Valuation',
    icon: 'TrendingUp',
    description: 'Property valuation assessment',
    isExternal: true,
  },
  fire_safety: {
    label: 'Fire & Safety',
    icon: 'Flame',
    description: 'Fire safety compliance inspection',
  },
  emergency_damage: {
    label: 'Emergency Damage',
    icon: 'AlertTriangle',
    description: 'Emergency damage assessment',
  },
};

export const ITEM_CATEGORY_CONFIG: Record<ItemCategory, { label: string; color: string; bgColor: string }> = {
  plumbing: { label: 'Plumbing', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  electrical: { label: 'Electrical', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  structure: { label: 'Structure', color: 'text-gray-700', bgColor: 'bg-gray-50' },
  cleanliness: { label: 'Cleanliness', color: 'text-green-700', bgColor: 'bg-green-50' },
  safety: { label: 'Safety', color: 'text-red-700', bgColor: 'bg-red-50' },
  exterior: { label: 'Exterior', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  appliances: { label: 'Appliances', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  fixtures: { label: 'Fixtures', color: 'text-teal-700', bgColor: 'bg-teal-50' },
};

export const CONDITION_CONFIG: Record<ItemCondition, { label: string; color: string; bgColor: string }> = {
  good: { label: 'Good', color: 'text-green-700', bgColor: 'bg-green-100' },
  fair: { label: 'Fair', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  poor: { label: 'Poor', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  critical: { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const STATUS_CONFIG: Record<InspectionStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  reviewed: { label: 'Reviewed', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  locked: { label: 'Locked', color: 'text-green-700', bgColor: 'bg-green-100' },
};

export const SYNC_STATUS_CONFIG: Record<SyncStatus, { label: string; color: string }> = {
  pending: { label: 'Pending Sync', color: 'bg-yellow-400' },
  synced: { label: 'Synced', color: 'bg-green-400' },
  failed: { label: 'Sync Failed', color: 'bg-red-400' },
};

export const DEFAULT_CHECKLIST_ITEMS: Record<ItemCategory, string[]> = {
  plumbing: ['Faucets', 'Drains', 'Pipes', 'Water heater', 'Toilet', 'Shower/Tub'],
  electrical: ['Light fixtures', 'Outlets', 'Switches', 'Circuit breaker', 'Wiring'],
  structure: ['Walls', 'Floors', 'Ceiling', 'Windows', 'Doors', 'Roof/Ceiling leaks'],
  cleanliness: ['Kitchen', 'Bathroom', 'Living areas', 'Bedrooms', 'Common areas'],
  safety: ['Smoke detectors', 'Fire extinguisher', 'Emergency exits', 'Security locks', 'Handrails'],
  exterior: ['Parking', 'Walkways', 'Fencing', 'Landscaping', 'External walls', 'Roof'],
  appliances: ['Oven/Stove', 'Refrigerator', 'Washing machine', 'Air conditioning', 'Water pump'],
  fixtures: ['Curtain rods', 'Towel racks', 'Cabinet hardware', 'Shelving', 'Mirrors'],
};

export const SCORE_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Acceptable',
  4: 'Good',
  5: 'Excellent',
};

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
