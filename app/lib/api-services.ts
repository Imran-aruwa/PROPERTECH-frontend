/**
 * API Client for PROPERTECH Backend
 * Handles all communication with FastAPI backend
 * Uses JWT tokens stored in localStorage
 */

const API_BASE = '/api';
interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get JWT token from localStorage
 */
export function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') {
      console.log('[getAuthToken] Running on server, no window');
      return null;
    }
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
    console.log('[getAuthToken] Token found:', token ? `${token.substring(0, 20)}...` : 'NULL');
    return token;
  } catch (error) {
    console.error('[getAuthToken] Error getting auth token:', error);
    return null;
  }
}

/**
 * Save JWT token to localStorage
 */
export function saveAuthToken(token: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

/**
 * Remove JWT token from localStorage
 */
export function removeAuthToken(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('role');
    }
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

/**
 * Generic API client with authentication
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      console.log(`[apiClient.get] ${endpoint} - Token:`, token ? 'Present' : 'MISSING');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log('[apiClient.get] Headers:', Object.keys(headers));

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      console.log(`[apiClient.get] ${endpoint} - Status:`, response.status, 'OK:', response.ok);

      if (!response.ok) {
        console.error(`[apiClient.get] ${endpoint} - Error:`, data);
        return {
          success: false,
          error:
            (data as ApiError).detail ||
            (data as ApiError).message ||
            (data as ApiError).error ||
            'Request failed',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('[apiClient.get] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      console.log(`[apiClient.post] ${endpoint} - Token:`, token ? 'Present' : 'MISSING');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log('[apiClient.post] Headers:', Object.keys(headers));

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      console.log(`[apiClient.post] ${endpoint} - Status:`, response.status, 'OK:', response.ok);

      if (!response.ok) {
        console.error(`[apiClient.post] ${endpoint} - Error:`, data);
        return {
          success: false,
          error:
            (data as ApiError).detail ||
            (data as ApiError).message ||
            (data as ApiError).error ||
            'Request failed',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('[apiClient.post] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            (data as ApiError).detail ||
            (data as ApiError).message ||
            (data as ApiError).error ||
            'Request failed',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API PATCH error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            (data as ApiError).detail ||
            (data as ApiError).message ||
            (data as ApiError).error ||
            'Request failed',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API PUT error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            (data as ApiError).detail ||
            (data as ApiError).message ||
            (data as ApiError).error ||
            'Request failed',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API DELETE error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },
};

/**
 * Auth API
 */
interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
}

export const authApi = {
  async login(data: LoginData) {
    return apiClient.post('/auth/login/', data);
  },

  async register(data: RegisterData) {
    return apiClient.post('/auth/signup/', data);
  },

  async getCurrentUser() {
    return apiClient.get('/auth/me/');
  },

  async logout() {
    removeAuthToken();
    return { success: true } as ApiResponse;
  },
};

/**
 * Properties API
 */
export const propertiesApi = {
  async list() {
    const response = await apiClient.get('/properties/');
    console.log('[propertiesApi.list] Raw response:', JSON.stringify(response, null, 2));
    // Handle double-wrapped response from Next.js API route
    if (response.success && response.data?.data) {
      console.log('[propertiesApi.list] Unwrapping data.data');
      return { success: true, data: response.data.data };
    }
    // If data is already an array, return as-is
    if (response.success && Array.isArray(response.data)) {
      console.log('[propertiesApi.list] Data is already array');
      return response;
    }
    console.log('[propertiesApi.list] Returning response as-is');
    return response;
  },
  async getAll() {
    const response = await apiClient.get('/properties/');
    console.log('[propertiesApi.getAll] Raw response:', JSON.stringify(response, null, 2));
    // Handle double-wrapped response from Next.js API route
    if (response.success && response.data?.data) {
      console.log('[propertiesApi.getAll] Unwrapping data.data');
      return { success: true, data: response.data.data };
    }
    // If data is already an array, return as-is
    if (response.success && Array.isArray(response.data)) {
      console.log('[propertiesApi.getAll] Data is already array');
      return response;
    }
    console.log('[propertiesApi.getAll] Returning response as-is');
    return response;
  },
  async get(id: string) {
    const response = await apiClient.get(`/properties/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async create(data: any) {
    const response = await apiClient.post('/properties/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async update(id: string, data: any) {
    const response = await apiClient.put(`/properties/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async delete(id: string) {
    const response = await apiClient.delete(`/properties/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async remove(id: string) {
    const response = await apiClient.delete(`/properties/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Units API
 */
export const unitsApi = {
  async list(propertyId?: string) {
    const response = propertyId
      ? await apiClient.get(`/properties/${propertyId}/units/`)
      : await apiClient.get('/properties/units/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getAll() {
    const response = await apiClient.get('/properties/units/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async get(id: string) {
    const response = await apiClient.get(`/properties/units/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async create(propertyId: string, data: any) {
    const response = await apiClient.post(`/properties/${propertyId}/units/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async update(propertyId: string, unitId: string, data: any) {
    const response = await apiClient.put(`/properties/${propertyId}/units/${unitId}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async delete(id: string) {
    const response = await apiClient.delete(`/properties/units/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Tenants API
 */
export const tenantsApi = {
  async list() {
    const response = await apiClient.get('/tenants/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getAll() {
    const response = await apiClient.get('/tenants/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async get(id: string) {
    const response = await apiClient.get(`/tenants/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async create(data: any) {
    const response = await apiClient.post('/tenants/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async update(id: string, data: any) {
    const response = await apiClient.put(`/tenants/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async delete(id: string) {
    const response = await apiClient.delete(`/tenants/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Maintenance API
 */
export const maintenanceApi = {
  async list() { 
    return apiClient.get('/caretaker/maintenance/'); 
  },
  async getAll() { 
    return apiClient.get('/caretaker/maintenance/'); 
  },
  async create(data: any) { 
    return apiClient.post('/caretaker/maintenance/', data); 
  },
  async update(id: string, data: any) { 
    return apiClient.put(`/caretaker/maintenance/${id}/status/`, data); 
  },
  async delete(id: string) { 
    return apiClient.delete(`/caretaker/maintenance/${id}/`); 
  },
};

/**
 * Staff API
 */
export const staffApi = {
  async list() {
    return apiClient.get('/staff/');
  },
  async getAll() {
    return apiClient.get('/staff/');
  },
  async get(id: string) {
    return apiClient.get(`/staff/${id}/`);
  },
  async create(data: any) {
    return apiClient.post('/staff/', data);
  },
  async update(id: string, data: any) {
    return apiClient.put(`/staff/${id}/`, data);
  },
  async delete(id: string) {
    return apiClient.delete(`/staff/${id}/`);
  },
  async remove(id: string) {
    return apiClient.delete(`/staff/${id}/`);
  },
};

/**
 * Analytics API
 */
export const analyticsApi = {
  async dashboard() {
    return apiClient.get('/owner/dashboard/');
  },
  async getAll() {
    return apiClient.get('/owner/dashboard/');
  },
  async getDashboardStats(role: string) {
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'owner') return apiClient.get('/owner/dashboard/');
    if (normalizedRole === 'agent') return apiClient.get('/agent/dashboard/');
    if (normalizedRole === 'caretaker') return apiClient.get('/caretaker/dashboard/');
    return apiClient.get('/owner/dashboard/');
  },
  async forOwner(ownerId: string) {
    return apiClient.get(`/owner/dashboard/`);
  },
  async forAgent(agentId: string) {
    return apiClient.get(`/agent/dashboard/`);
  },
};

/**
 * Payments API (Paystack)
 */
export const paymentsApi = {
  async initializePayment(amount: number, email: string, reference: string) {
    return apiClient.post('/payments/initiate/', {
      amount,
      email,
      reference,
    });
  },

  async verifyPayment(reference: string, extra?: { plan_id?: string; billing_cycle?: string }) {
    return apiClient.post('/payments/verify/', {
      reference,
      ...(extra || {}),
    });
  },

  async getAll() {
    return apiClient.get('/payments/history/');
  },

  async get(id: string | number) {
    return apiClient.get(`/payments/${id}/`);
  },

  async update(id: string | number, data: any) {
    return apiClient.put(`/payments/${id}/`, data);
  },

  async subscribe(data: { plan_id: string; billing_cycle: string; email: string }) {
    return apiClient.post('/payments/subscribe/', data);
  },

  async getSubscriptions() {
    return apiClient.get('/payments/subscriptions/');
  },

  async cancelSubscription(subscriptionId: string) {
    return apiClient.post(`/payments/cancel-subscription/${subscriptionId}/`, {});
  },
};

/**
 * Settings API
 */
export const settingsApi = {
  async getProfile() {
    return apiClient.get('/settings/profile/');
  },
  async updateProfile(data: any) {
    return apiClient.put('/settings/profile/', data);
  },
  async getNotifications() {
    return apiClient.get('/settings/notifications/');
  },
  async updateNotifications(data: any) {
    return apiClient.put('/settings/notifications/', data);
  },
  async changePassword(data: { current_password: string; new_password: string }) {
    return apiClient.post('/settings/change-password/', data);
  },
  async getBillingInfo() {
    return apiClient.get('/settings/billing/');
  },
  async updateBillingInfo(data: any) {
    return apiClient.put('/settings/billing/', data);
  },
  async deleteAccount() {
    return apiClient.delete('/settings/account/');
  },
};

/**
 * Agent API
 */
export const agentApi = {
  async getDashboard() {
    return apiClient.get('/agent/dashboard/');
  },
  async getProperties() {
    return apiClient.get('/agent/properties/');
  },
  async getTenants() {
    return apiClient.get('/agent/tenants/');
  },
  async getEarnings() {
    return apiClient.get('/agent/earnings/');
  },
  async getRentTracking() {
    return apiClient.get('/agent/rent-tracking/');
  },
  async getRentCollection() {
    return apiClient.get('/agent/rent-collection/');
  },
  async getRecentActivities() {
    return apiClient.get('/agent/activities/');
  },
};

/**
 * Caretaker API
 */
export const caretakerApi = {
  async getDashboard() {
    return apiClient.get('/caretaker/dashboard/');
  },
  async getOutstandingPayments() {
    return apiClient.get('/caretaker/outstanding-payments/');
  },
  async getRentTracking() {
    return apiClient.get('/caretaker/rent-tracking/');
  },
  async getMeterReadings() {
    return apiClient.get('/caretaker/meter-readings/');
  },
  async getTenants() {
    return apiClient.get('/caretaker/tenants/');
  },
};

/**
 * Tenant Dashboard API
 */
export const tenantDashboardApi = {
  async getDashboard() {
    return apiClient.get('/tenant/dashboard/');
  },
  async getPayments() {
    return apiClient.get('/tenant/payments/');
  },
  async getMaintenanceRequests() {
    return apiClient.get('/tenant/maintenance/');
  },
  async createMaintenanceRequest(data: any) {
    return apiClient.post('/tenant/maintenance/', data);
  },
  async getLeaseInfo() {
    return apiClient.get('/tenant/lease/');
  },
  async getDocuments() {
    return apiClient.get('/tenant/documents/');
  },
};

/**
 * Security Staff API
 */
export const securityApi = {
  async getDashboard() {
    return apiClient.get('/staff/security/dashboard/');
  },
  async getIncidents() {
    return apiClient.get('/staff/security/incidents/');
  },
  async createIncident(data: any) {
    return apiClient.post('/staff/security/incidents/', data);
  },
  async updateIncident(id: string, data: any) {
    return apiClient.put(`/staff/security/incidents/${id}/`, data);
  },
  async getAttendance() {
    return apiClient.get('/staff/security/attendance/');
  },
  async recordAttendance(data: any) {
    return apiClient.post('/staff/security/attendance/', data);
  },
  async getPerformance() {
    return apiClient.get('/staff/security/performance/');
  },
  async getStaffOnDuty() {
    return apiClient.get('/staff/security/on-duty/');
  },
};

/**
 * Gardener Staff API
 */
export const gardenerApi = {
  async getDashboard() {
    return apiClient.get('/staff/gardener/dashboard/');
  },
  async getTasks() {
    return apiClient.get('/staff/gardener/tasks/');
  },
  async createTask(data: any) {
    return apiClient.post('/staff/gardener/tasks/', data);
  },
  async updateTask(id: string, data: any) {
    return apiClient.put(`/staff/gardener/tasks/${id}/`, data);
  },
  async getEquipment() {
    return apiClient.get('/staff/gardener/equipment/');
  },
  async updateEquipmentStatus(id: string, data: any) {
    return apiClient.put(`/staff/gardener/equipment/${id}/`, data);
  },
  async getAssignments() {
    return apiClient.get('/staff/gardener/assignments/');
  },
};

/**
 * Notifications API
 */
export interface Notification {
  id: string;
  type: 'payment' | 'maintenance' | 'tenant' | 'alert' | 'info';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export const notificationsApi = {
  async getAll() {
    return apiClient.get<Notification[]>('/notifications/');
  },
  async getUnreadCount() {
    return apiClient.get<{ count: number }>('/notifications/unread-count/');
  },
  async markAsRead(id: string) {
    return apiClient.patch(`/notifications/${id}/read/`);
  },
  async markAllAsRead() {
    return apiClient.post('/notifications/mark-all-read/');
  },
  async delete(id: string) {
    return apiClient.delete(`/notifications/${id}/`);
  },
};

// Default export for backward compatibility
export default apiClient;
