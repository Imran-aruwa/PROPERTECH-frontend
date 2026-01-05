// ==================== USER & AUTH ====================
export type UserRole = 'owner' | 'tenant' | 'staff' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'owner' | 'tenant';
}

// ==================== PROPERTY ====================
export interface Property {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  owner?: User;
  units?: Unit[];
  total_units?: number;
  occupied_units?: number;
}

export interface PropertyStats {
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number;
  monthly_revenue: number;
  pending_payments: number;
  maintenance_requests: number;
  staff_count: number;
}

export interface CreatePropertyData {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description?: string;
  image_url?: string;
  // Unit generation fields (optional)
  total_units?: number;
  unit_prefix?: string;
  default_bedrooms?: number;
  default_bathrooms?: number;
  default_rent?: number;
  default_square_feet?: number;
}

// ==================== UNIT ====================
export type UnitStatus = 'available' | 'occupied' | 'maintenance';

export interface Unit {
  id: number;
  property_id: number;
  unit_number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  rent_amount: number;
  status: UnitStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
  tenant?: Tenant;
  meter_readings?: MeterReading[];
  payments?: Payment[];
}

export interface CreateUnitData {
  property_id: number;
  unit_number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  rent_amount: number;
  status?: UnitStatus;
  description?: string;
}

// ==================== TENANT ====================
export interface Tenant {
  id: number;
  user_id: number;
  unit_id: number;
  lease_start: string;
  lease_end: string;
  deposit_amount: number;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  unit?: Unit;
  payments?: Payment[];
  maintenance_requests?: MaintenanceRequest[];
}

export interface CreateTenantData {
  user_id: number;
  unit_id: number;
  lease_start: string;
  lease_end: string;
  deposit_amount: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

// ==================== PAYMENT ====================
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentType = 'rent' | 'water' | 'electricity' | 'other';

export interface Payment {
  id: number;
  tenant_id: number;
  unit_id: number;
  amount: number;
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  payment_method: string | null;
  transaction_id: string | null;
  payment_date: string | null;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  unit?: Unit;
}

export interface CreatePaymentData {
  tenant_id: number;
  unit_id: number;
  amount: number;
  payment_type: PaymentType;
  due_date: string;
  payment_method?: string;
  notes?: string;
}

export interface MpesaPaymentData {
  amount: number;
  phone: string;
  payment_id: number;
}

// ==================== MAINTENANCE ====================
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceRequest {
  id: number;
  unit_id: number;
  tenant_id: number;
  assigned_to: number | null;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reported_date: string;
  scheduled_date: string | null;
  completed_date: string | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  unit?: Unit;
  tenant?: Tenant;
  assigned_staff?: Staff;
}

export interface CreateMaintenanceData {
  unit_id: number;
  tenant_id: number;
  title: string;
  description: string;
  priority?: MaintenancePriority;
  scheduled_date?: string;
}

// ==================== METER READING ====================
export type MeterType = 'water' | 'electricity';

export interface MeterReading {
  id: number;
  unit_id: number;
  meter_type: MeterType;
  reading: number;
  reading_date: string;
  recorded_by: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  unit?: Unit;
  recorder?: User;
}

export interface CreateMeterReadingData {
  unit_id: number;
  meter_type: MeterType;
  reading: number;
  reading_date: string;
  notes?: string;
}

// ==================== STAFF ====================
export type StaffDepartment = 'security' | 'gardening' | 'maintenance';

export interface Staff {
  id: number;
  user_id: number;
  property_id: number;
  department: StaffDepartment;
  position: string;
  salary: number;
  start_date: string;
  supervisor_id: number | null;
  created_at: string;
  updated_at: string;
  user?: User;
  property?: Property;
  supervisor?: Staff;
  attendance?: Attendance[];
}

export interface CreateStaffData {
  user_id: number;
  property_id: number;
  department: StaffDepartment;
  position: string;
  salary: number;
  start_date: string;
  supervisor_id?: number;
}

// ==================== ATTENDANCE ====================
export interface Attendance {
  id: number;
  staff_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  staff?: Staff;
}

export interface AttendanceSummary {
  id: number;
  staff_id: number;
  year: number;
  month: number;
  days_present: number;
  days_absent: number;
  days_late: number;
  total_hours: number;
  created_at: string;
  updated_at: string;
  staff?: Staff;
}

// ==================== ANALYTICS ====================
export interface DashboardStats {
  total_properties?: number;
  total_units?: number;
  total_tenants?: number;
  total_revenue?: number;
  pending_payments?: number;
  maintenance_requests?: number;
  occupancy_rate?: number;
  monthly_revenue?: number;
  staff_count?: number;
}

export interface RevenueAnalytics {
  total_revenue: number;
  revenue_by_month: Array<{ month: string; amount: number }>;
  revenue_by_property: Array<{ property_name: string; amount: number }>;
  revenue_by_type: Array<{ payment_type: string; amount: number }>;
}

export interface OccupancyTrend {
  date: string;
  occupancy_rate: number;
  occupied_units: number;
  total_units: number;
}

// ==================== FORM STATES ====================
export interface FormError {
  field: string;
  message: string;
}

export interface ApiError {
  detail: string;
  status?: number;
}

// ==================== PAGINATION ====================
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ==================== FILTERS ====================
export interface PropertyFilters {
  city?: string;
  state?: string;
  min_units?: number;
  max_units?: number;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  type?: PaymentType;
  from_date?: string;
  to_date?: string;
  tenant_id?: number;
}

export interface MaintenanceFilters {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  property_id?: number;
  assigned_to?: number;
}