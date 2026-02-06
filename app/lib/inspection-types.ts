/**
 * Inspection Types and Constants
 * TypeScript type definitions for the offline-first inspection system
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type InspectionType = 'routine' | 'move_in' | 'move_out' | 'meter';
export type InspectionStatus = 'draft' | 'submitted' | 'reviewed' | 'locked';
export type ItemCategory = 'plumbing' | 'electrical' | 'structure' | 'cleanliness';
export type ItemCondition = 'good' | 'fair' | 'poor';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type MeterType = 'water' | 'electricity';
export type UserRole = 'owner' | 'agent' | 'caretaker';

// ============================================
// INTERFACES
// ============================================

/**
 * Main inspection record
 */
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
  created_at?: string;
  updated_at?: string;
}

/**
 * Inspection checklist item
 */
export interface InspectionItem {
  id?: number;
  client_uuid: string;
  inspection_client_uuid: string;
  inspection_id?: number;
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  comment?: string;
  created_at?: string;
}

/**
 * Media attached to inspection (photo/video)
 */
export interface InspectionMedia {
  id?: number;
  client_uuid: string;
  inspection_client_uuid: string;
  inspection_id?: number;
  file_data?: string; // base64 for IDB storage
  file_url?: string; // server URL after upload
  file_type: 'photo' | 'video';
  captured_at: string;
  created_at?: string;
}

/**
 * Meter reading record
 */
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

/**
 * IndexedDB draft record - wraps inspection with sync metadata
 */
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

/**
 * API list response shape
 */
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
  created_at: string;
}

/**
 * API detail response - full inspection with nested data
 */
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
  created_at: string;
  updated_at: string;
  items: InspectionItem[];
  media: InspectionMedia[];
  meter_readings: InspectionMeterReading[];
}

/**
 * Sync result summary
 */
export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{ uuid: string; error: string }>;
}

/**
 * Cached property for offline use
 */
export interface CachedProperty {
  id: number;
  name: string;
  address: string;
  cached_at: string;
}

/**
 * Cached unit for offline use
 */
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

/**
 * Inspection type configuration with labels and icons
 */
export const INSPECTION_TYPE_CONFIG: Record<InspectionType, { label: string; icon: string; description: string }> = {
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
};

/**
 * Item category configuration with labels and colors
 */
export const ITEM_CATEGORY_CONFIG: Record<ItemCategory, { label: string; color: string; bgColor: string }> = {
  plumbing: {
    label: 'Plumbing',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  electrical: {
    label: 'Electrical',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
  },
  structure: {
    label: 'Structure',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
  },
  cleanliness: {
    label: 'Cleanliness',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
};

/**
 * Condition configuration with labels and colors
 */
export const CONDITION_CONFIG: Record<ItemCondition, { label: string; color: string; bgColor: string }> = {
  good: {
    label: 'Good',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  fair: {
    label: 'Fair',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  poor: {
    label: 'Poor',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

/**
 * Status configuration with labels and colors
 */
export const STATUS_CONFIG: Record<InspectionStatus, { label: string; color: string; bgColor: string }> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  submitted: {
    label: 'Submitted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  reviewed: {
    label: 'Reviewed',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  locked: {
    label: 'Locked',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
};

/**
 * Sync status configuration
 */
export const SYNC_STATUS_CONFIG: Record<SyncStatus, { label: string; color: string }> = {
  pending: {
    label: 'Pending Sync',
    color: 'bg-yellow-400',
  },
  synced: {
    label: 'Synced',
    color: 'bg-green-400',
  },
  failed: {
    label: 'Sync Failed',
    color: 'bg-red-400',
  },
};

/**
 * Default checklist items per category
 */
export const DEFAULT_CHECKLIST_ITEMS: Record<ItemCategory, string[]> = {
  plumbing: ['Faucets', 'Drains', 'Pipes', 'Water heater', 'Toilet', 'Shower/Tub'],
  electrical: ['Light fixtures', 'Outlets', 'Switches', 'Circuit breaker', 'Wiring'],
  structure: ['Walls', 'Floors', 'Ceiling', 'Windows', 'Doors', 'Roof/Ceiling leaks'],
  cleanliness: ['Kitchen', 'Bathroom', 'Living areas', 'Bedrooms', 'Common areas'],
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
