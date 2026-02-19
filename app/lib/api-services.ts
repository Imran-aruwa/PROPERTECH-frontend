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
 * This function is called synchronously, so it reads directly from localStorage
 */
export function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    // Try multiple storage keys for compatibility
    const authToken = localStorage.getItem('auth_token');
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token');

    const foundToken = authToken || token || accessToken;

    // Only log in development for debugging
    if (process.env.NODE_ENV === 'development' && !foundToken) {
      console.log('[getAuthToken] No token found in localStorage');
    }

    // Validate token format if found
    if (foundToken) {
      // Remove Bearer prefix if accidentally stored with it
      const cleanToken = foundToken.startsWith('Bearer ') ? foundToken.substring(7) : foundToken;

      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        console.warn('[getAuthToken] Token does not appear to be a valid JWT');
      }

      return cleanToken;
    }

    return null;
  } catch (error) {
    console.error('[getAuthToken] Error getting auth token:', error);
    return null;
  }
}

/**
 * Get token with retry - useful when token might be getting set by auth context
 */
export async function getAuthTokenWithRetry(maxRetries = 3, delayMs = 100): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const token = getAuthToken();
    if (token) return token;

    // Wait before retrying
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return null;
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
        // Ensure we don't double-add Bearer prefix
        const authValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        headers['Authorization'] = authValue;
        console.log(`[apiClient.get] ${endpoint} - Auth header:`, authValue.substring(0, 40) + '...');
      }

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
        // Ensure we don't double-add Bearer prefix
        const authValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        headers['Authorization'] = authValue;
        console.log(`[apiClient.post] ${endpoint} - Auth header:`, authValue.substring(0, 40) + '...');
      }

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
      const authValue = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authValue && { Authorization: authValue }),
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
      const authValue = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authValue && { Authorization: authValue }),
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
      const authValue = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authValue && { Authorization: authValue }),
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
    const response = await apiClient.post('/auth/login/', data);
    console.log('[authApi.login] Raw response:', JSON.stringify(response, null, 2));
    // Handle double-wrapped response
    if (response.success && response.data?.data) {
      console.log('[authApi.login] Unwrapping data.data');
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async register(data: RegisterData) {
    const response = await apiClient.post('/auth/signup/', data);
    console.log('[authApi.register] Raw response:', JSON.stringify(response, null, 2));
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
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
    const response = await apiClient.get(`/properties/${id}`);
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
    const response = await apiClient.put(`/properties/${id}`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async delete(id: string) {
    const response = await apiClient.delete(`/properties/${id}`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async remove(id: string) {
    const response = await apiClient.delete(`/properties/${id}`);
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
    const response = await apiClient.get('/caretaker/maintenance/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getAll() {
    const response = await apiClient.get('/caretaker/maintenance/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async create(data: any) {
    const response = await apiClient.post('/caretaker/maintenance/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async update(id: string, data: any) {
    const response = await apiClient.put(`/caretaker/maintenance/${id}/status/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async delete(id: string) {
    const response = await apiClient.delete(`/caretaker/maintenance/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Owner Maintenance API (uses owner-scoped endpoints)
 */
export const ownerMaintenanceApi = {
  async list() {
    const response = await apiClient.get('/maintenance/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async get(id: string) {
    const response = await apiClient.get(`/maintenance/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async create(data: any) {
    const response = await apiClient.post('/maintenance/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async update(id: string, data: any) {
    const response = await apiClient.put(`/maintenance/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Staff API
 */
export const staffApi = {
  async list() {
    const response = await apiClient.get('/staff/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getAll() {
    const response = await apiClient.get('/staff/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async get(id: string) {
    const response = await apiClient.get(`/staff/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async create(data: any) {
    const response = await apiClient.post('/staff/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async update(id: string, data: any) {
    const response = await apiClient.put(`/staff/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async delete(id: string) {
    const response = await apiClient.delete(`/staff/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async remove(id: string) {
    const response = await apiClient.delete(`/staff/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Analytics API
 */
export const analyticsApi = {
  async dashboard() {
    const response = await apiClient.get('/owner/dashboard/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getAll() {
    const response = await apiClient.get('/owner/dashboard/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getDashboardStats(role: string) {
    const normalizedRole = (role || '').toLowerCase();
    let response;
    if (normalizedRole === 'agent') {
      response = await apiClient.get('/agent/dashboard/');
    } else if (normalizedRole === 'caretaker') {
      response = await apiClient.get('/caretaker/dashboard/');
    } else {
      response = await apiClient.get('/owner/dashboard/');
    }
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async forOwner(ownerId: string) {
    const response = await apiClient.get(`/owner/dashboard/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async forAgent(agentId: string) {
    const response = await apiClient.get(`/agent/dashboard/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Payments API (Paystack)
 */
export const paymentsApi = {
  async initializePayment(amount: number, email: string, reference: string) {
    return apiClient.post('/payments/initialize/', {
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
    const response = await apiClient.get('/payments/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async get(id: string | number) {
    return apiClient.get(`/payments/${id}/`);
  },

  async create(data: any) {
    const response = await apiClient.post('/payments/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async update(id: string | number, data: any) {
    return apiClient.put(`/payments/${id}/`, data);
  },

  async subscribe(data: { plan_id: string; billing_cycle: string; email: string }) {
    return apiClient.post('/payments/subscribe/', data);
  },

  async getSubscriptions() {
    return apiClient.get('/payments/subscription/');
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
    const response = await apiClient.get('/agent/dashboard/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getProperties() {
    const response = await apiClient.get('/agent/properties/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async createProperty(data: any) {
    const response = await apiClient.post('/agent/properties/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getMarketplace() {
    const response = await apiClient.get('/agent/marketplace/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getTenants() {
    const response = await apiClient.get('/agent/tenants/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getEarnings() {
    const response = await apiClient.get('/agent/earnings/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getRentTracking() {
    const response = await apiClient.get('/agent/rent-tracking/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getRentCollection() {
    const response = await apiClient.get('/agent/rent-collection/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getRecentActivities() {
    const response = await apiClient.get('/agent/activities/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getLeads() {
    const response = await apiClient.get('/agent/leads/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getLead(id: string) {
    const response = await apiClient.get(`/agent/leads/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async createLead(data: any) {
    const response = await apiClient.post('/agent/leads/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async updateLead(id: string, data: any) {
    const response = await apiClient.put(`/agent/leads/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getViewings() {
    const response = await apiClient.get('/agent/viewings/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getViewing(id: string) {
    const response = await apiClient.get(`/agent/viewings/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async createViewing(data: any) {
    const response = await apiClient.post('/agent/viewings/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async updateViewing(id: string, data: any) {
    const response = await apiClient.put(`/agent/viewings/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getEarningsStats() {
    const response = await apiClient.get('/agent/earnings/stats/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Caretaker API
 */
export const caretakerApi = {
  async getDashboard() {
    const response = await apiClient.get('/caretaker/dashboard/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getOutstandingPayments() {
    const response = await apiClient.get('/caretaker/outstanding-payments/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getRentTracking() {
    const response = await apiClient.get('/caretaker/rent-tracking/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getMeterReadings() {
    const response = await apiClient.get('/caretaker/meter-readings/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getTenants() {
    const response = await apiClient.get('/caretaker/tenants/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Tenant Dashboard API
 */
export const tenantDashboardApi = {
  async getDashboard() {
    const response = await apiClient.get('/tenant/dashboard/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getPayments() {
    const response = await apiClient.get('/tenant/payments/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getMaintenanceRequests() {
    const response = await apiClient.get('/tenant/maintenance/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async createMaintenanceRequest(data: any) {
    const response = await apiClient.post('/tenant/maintenance/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getLeaseInfo() {
    const response = await apiClient.get('/tenant/lease/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
  async getDocuments() {
    const response = await apiClient.get('/tenant/documents/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
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

/**
 * Inspections API
 * Offline-first inspection system
 */
export interface InspectionCreatePayload {
  client_uuid: string;
  inspection: {
    property_id: number;
    unit_id: number;
    inspection_type: string;
    inspection_date: string;
    gps_lat?: number;
    gps_lng?: number;
    device_id?: string;
    offline_created_at?: string;
    notes?: string;
    is_external?: boolean;
    inspector_name?: string;
    inspector_credentials?: string;
    inspector_company?: string;
    template_id?: string;
  };
  items: Array<{
    client_uuid: string;
    name: string;
    category: string;
    condition: string;
    comment?: string;
    score?: number;
    severity?: string;
    pass_fail?: string;
    requires_followup?: boolean;
    photo_required?: boolean;
  }>;
  meter_readings: Array<{
    client_uuid: string;
    unit_id: number;
    meter_type: string;
    previous_reading: number;
    current_reading: number;
    reading_date: string;
  }>;
}

export interface InspectionMediaPayload {
  client_uuid: string;
  file_data: string; // base64
  file_type: 'photo' | 'video';
  captured_at: string;
}

export const inspectionsApi = {
  /**
   * List inspections with optional filters
   */
  async list(params?: { property_id?: number; status?: string; type?: string; is_external?: boolean; page?: number; size?: number }) {
    let endpoint = '/inspections/';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.property_id) queryParams.append('property_id', params.property_id.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.is_external !== undefined) queryParams.append('is_external', String(params.is_external));
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.size) queryParams.append('size', params.size.toString());
      const queryString = queryParams.toString();
      if (queryString) endpoint += `?${queryString}`;
    }
    const response = await apiClient.get(endpoint);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Get a single inspection by ID
   */
  async get(id: number) {
    const response = await apiClient.get(`/inspections/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Create a new inspection with items and meter readings
   */
  async create(data: InspectionCreatePayload) {
    const response = await apiClient.post('/inspections/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Upload media (photo/video) to an inspection
   */
  async uploadMedia(inspectionId: number, data: InspectionMediaPayload) {
    const response = await apiClient.post(`/inspections/${inspectionId}/media/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Mark an inspection as reviewed (owner/agent only)
   */
  async review(id: number, notes?: string) {
    const response = await apiClient.patch(`/inspections/${id}/review/`, { notes });
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Lock an inspection (owner only)
   */
  async lock(id: number) {
    const response = await apiClient.patch(`/inspections/${id}/lock/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Add a digital signature to an inspection
   */
  async addSignature(inspectionId: number, data: {
    signer_name: string;
    signer_role: string;
    signature_type: string;
    signature_data: string;
    ip_address?: string;
    device_fingerprint?: string;
    gps_lat?: number;
    gps_lng?: number;
  }) {
    const response = await apiClient.post(`/inspections/${inspectionId}/sign/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Get signatures for an inspection
   */
  async getSignatures(inspectionId: number) {
    const response = await apiClient.get(`/inspections/${inspectionId}/signatures/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * List inspection templates
   */
  async listTemplates(params?: { type?: string; is_external?: boolean }) {
    let endpoint = '/inspections/templates/';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append('type', params.type);
      if (params.is_external !== undefined) queryParams.append('is_external', String(params.is_external));
      const qs = queryParams.toString();
      if (qs) endpoint += `?${qs}`;
    }
    const response = await apiClient.get(endpoint);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Get a single inspection template
   */
  async getTemplate(id: string) {
    const response = await apiClient.get(`/inspections/templates/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Create an inspection template
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    inspection_type: string;
    is_external?: boolean;
    categories?: string[];
    default_items?: Array<{ name: string; category: string; required_photo?: boolean }>;
    scoring_enabled?: boolean;
    pass_threshold?: number;
  }) {
    const response = await apiClient.post('/inspections/templates/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Update an inspection template
   */
  async updateTemplate(id: string, data: any) {
    const response = await apiClient.put(`/inspections/templates/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  /**
   * Delete an inspection template
   */
  async deleteTemplate(id: string) {
    const response = await apiClient.delete(`/inspections/templates/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },
};

/**
 * Leases API
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.propertechsoftware.com';

export const leasesApi = {
  async list(params?: { status?: string; property_id?: number; tenant_id?: number }) {
    let endpoint = '/leases/';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.property_id) queryParams.append('property_id', params.property_id.toString());
      if (params.tenant_id) queryParams.append('tenant_id', params.tenant_id.toString());
      const qs = queryParams.toString();
      if (qs) endpoint += `?${qs}`;
    }
    const response = await apiClient.get(endpoint);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async get(id: number | string) {
    const response = await apiClient.get(`/leases/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async create(data: any) {
    const response = await apiClient.post('/leases/', data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async update(id: number | string, data: any) {
    const response = await apiClient.put(`/leases/${id}/`, data);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async send(id: number | string, channels: string[]) {
    const response = await apiClient.post(`/leases/${id}/send/`, { channels });
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async downloadPdf(id: number | string) {
    const response = await apiClient.get(`/leases/${id}/pdf/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async getTemplates() {
    const response = await apiClient.get('/leases/templates/');
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async resendSigningLink(id: number | string) {
    const response = await apiClient.post(`/leases/${id}/resend/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  async delete(id: number | string) {
    const response = await apiClient.delete(`/leases/${id}/`);
    if (response.success && response.data?.data) {
      return { success: true, data: response.data.data };
    }
    return response;
  },

  // Public endpoints (no auth required) - use raw fetch to backend via Next.js API routes
  async getByToken(token: string) {
    const response = await fetch(`/api/leases/sign/${token}/`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error || data?.detail || 'Failed to load lease' };
    }
    return { success: true, data: data?.data || data };
  },

  async sign(token: string, signatureData: any) {
    const response = await fetch(`/api/leases/sign/${token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signatureData),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error || data?.detail || 'Failed to sign lease' };
    }
    return { success: true, data: data?.data || data };
  },

  async verifyOtp(token: string, otp: string) {
    const response = await fetch(`/api/leases/sign/${token}/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error || data?.detail || 'OTP verification failed' };
    }
    return { success: true, data: data?.data || data };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Market Intelligence API
// Endpoints: /api/market/...   (premium feature)
// ─────────────────────────────────────────────────────────────────────────────
export const marketApi = {
  /** All tracked neighbourhoods with headline KPIs. */
  async getAreaOverview(city?: string) {
    const params = city ? `?city=${encodeURIComponent(city)}` : '';
    return apiClient.get(`/market/area-overview${params}`);
  },

  /** Full breakdown for a single area (rent by type, trend, etc.). */
  async getAreaDetail(areaName: string) {
    return apiClient.get(`/market/area/${encodeURIComponent(areaName)}`);
  },

  /** Authenticated owner's properties benchmarked against area averages. */
  async getMyPropertiesBenchmark() {
    return apiClient.get('/market/my-properties-benchmark');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Automation API
// Endpoints: /api/workflows/...  (premium feature)
// ─────────────────────────────────────────────────────────────────────────────
export const workflowsApi = {
  /** List all workflows owned by the current user. */
  async list() {
    return apiClient.get('/workflows/');
  },

  /** Create a new workflow. */
  async create(data: {
    name: string;
    description?: string;
    trigger_event: string;
    conditions?: Record<string, any>;
    status?: string;
    actions?: Array<{
      order: number;
      action_type: string;
      config: Record<string, any>;
      delay_minutes?: number;
    }>;
  }) {
    return apiClient.post('/workflows/', data);
  },

  /** Get a single workflow. */
  async get(id: string) {
    return apiClient.get(`/workflows/${id}`);
  },

  /** Update a workflow (partial update). */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      trigger_event?: string;
      conditions?: Record<string, any>;
      status?: string;
      actions?: Array<{
        order: number;
        action_type: string;
        config: Record<string, any>;
        delay_minutes?: number;
      }>;
    },
  ) {
    return apiClient.put(`/workflows/${id}`, data);
  },

  /** Delete a workflow. */
  async delete(id: string) {
    return apiClient.delete(`/workflows/${id}`);
  },

  /** Get execution logs for a specific workflow. */
  async getLogs(id: string, params?: { skip?: number; limit?: number }) {
    const qs = params
      ? `?skip=${params.skip ?? 0}&limit=${params.limit ?? 50}`
      : '';
    return apiClient.get(`/workflows/${id}/logs${qs}`);
  },

  /** Get execution logs across all workflows (paginated). */
  async getAllLogs(params?: { skip?: number; limit?: number }) {
    const qs = params
      ? `?skip=${params.skip ?? 0}&limit=${params.limit ?? 50}`
      : '';
    return apiClient.get(`/workflows/logs${qs}`);
  },

  /** Get built-in workflow templates. */
  async getTemplates() {
    return apiClient.get('/workflows/templates');
  },

  /** Trigger time-based checks (rent overdue, lease expiry) for the current owner. */
  async checkScheduled() {
    return apiClient.post('/workflows/check-scheduled', {});
  },
};

// ════════════════════════════════════════════════════════════
// Advanced Accounting + KRA Tax API
// Endpoints: /api/accounting/...  (premium feature)
// ════════════════════════════════════════════════════════════
export const accountingApi = {
  // ── Entries ──
  async listEntries(params?: {
    property_id?: string;
    entry_type?: string;
    category?: string;
    date_from?: string;
    date_to?: string;
    tax_period?: string;
    skip?: number;
    limit?: number;
  }) {
    const qs = params
      ? '?' + Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    return apiClient.get(`/accounting/entries${qs}`);
  },

  async createEntry(data: {
    entry_type: string;
    category: string;
    amount: number;
    description?: string;
    reference_number?: string;
    entry_date: string;
    property_id?: string;
    unit_id?: string;
    tenant_id?: string;
    is_reconciled?: boolean;
    receipt_url?: string;
  }) {
    return apiClient.post('/accounting/entries', data);
  },

  async updateEntry(id: string, data: Record<string, any>) {
    return apiClient.put(`/accounting/entries/${id}`, data);
  },

  async deleteEntry(id: string) {
    return apiClient.delete(`/accounting/entries/${id}`);
  },

  async bulkImport(entries: any[]) {
    return apiClient.post('/accounting/entries/bulk', { entries });
  },

  // ── Sync ──
  async syncPayments() {
    return apiClient.post('/accounting/sync-payments', {});
  },

  // ── Reports ──
  async getPnL(params: { year: number; month?: number; period?: string; property_id?: string }) {
    const qs = '?' + Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return apiClient.get(`/accounting/reports/pnl${qs}`);
  },

  async getCashflow(params: { year: number }) {
    return apiClient.get(`/accounting/reports/cashflow?year=${params.year}`);
  },

  async getPropertyPerformance(params: { year: number; month?: number }) {
    const qs = '?' + Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return apiClient.get(`/accounting/reports/property-performance${qs}`);
  },

  async getExpenseBreakdown(params: { year: number; month?: number; property_id?: string }) {
    const qs = '?' + Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return apiClient.get(`/accounting/reports/expense-breakdown${qs}`);
  },

  // ── Tax ──
  async getTaxSummary(params: {
    year: number;
    month?: number;
    period_type?: string;
    landlord_type?: string;
  }) {
    const qs = '?' + Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return apiClient.get(`/accounting/tax/summary${qs}`);
  },

  async getTaxConstants() {
    return apiClient.get('/accounting/tax/constants');
  },

  async createTaxRecord(data: {
    tax_year: number;
    tax_period: string;
    gross_rental_income: number;
    allowable_deductions: number;
    net_taxable_income: number;
    tax_liability: number;
    tax_rate_applied: number;
    landlord_type: string;
    kra_pin?: string;
    above_threshold: boolean;
    status: string;
    notes?: string;
  }) {
    return apiClient.post('/accounting/tax/records', data);
  },

  async listTaxRecords(params?: { year?: number }) {
    const qs = params?.year ? `?year=${params.year}` : '';
    return apiClient.get(`/accounting/tax/records${qs}`);
  },

  async updateTaxRecord(id: string, data: { status?: string; kra_pin?: string; notes?: string }) {
    return apiClient.put(`/accounting/tax/records/${id}`, data);
  },

  async listWithholding(params?: { period?: string }) {
    const qs = params?.period ? `?period=${params.period}` : '';
    return apiClient.get(`/accounting/tax/withholding${qs}`);
  },

  async createWithholdingEntry(data: {
    tenant_name?: string;
    tenant_kra_pin?: string;
    amount_paid: number;
    withholding_rate: number;
    period: string;
    certificate_number?: string;
    notes?: string;
  }) {
    return apiClient.post('/accounting/tax/withholding', data);
  },
};

// Default export for backward compatibility
export default apiClient;
