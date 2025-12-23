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
      return null;
    }
    return localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
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
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
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
      console.error('API GET error:', error);
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
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
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
      console.error('API POST error:', error);
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
    return apiClient.get('/properties/'); 
  },
  async getAll() { 
    return apiClient.get('/properties/'); 
  },
  async get(id: string) { 
    return apiClient.get(`/properties/${id}/`); 
  },
  async create(data: any) { 
    return apiClient.post('/properties/', data); 
  },
  async update(id: string, data: any) { 
    return apiClient.put(`/properties/${id}/`, data); 
  },
  async delete(id: string) { 
    return apiClient.delete(`/properties/${id}/`); 
  },
  async remove(id: string) { 
    return apiClient.delete(`/properties/${id}/`); 
  },
};

/**
 * Units API
 */
export const unitsApi = {
  async list(propertyId?: string) {
    if (propertyId) return apiClient.get(`/properties/${propertyId}/units/`);
    return apiClient.get('/properties/units/');
  },
  async getAll() { 
    return apiClient.get('/properties/units/'); 
  },
  async create(propertyId: string, data: any) {
    return apiClient.post(`/properties/${propertyId}/units/`, data);
  },
  async delete(id: string) { 
    return apiClient.delete(`/properties/units/${id}/`); 
  },
};

/**
 * Tenants API
 */
export const tenantsApi = {
  async list() { 
    return apiClient.get('/tenants/'); 
  },
  async getAll() { 
    return apiClient.get('/tenants/'); 
  },
  async create(data: any) { 
    return apiClient.post('/tenants/', data); 
  },
  async delete(id: string) { 
    return apiClient.delete(`/tenants/${id}/`); 
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

// Default export for backward compatibility
export default apiClient;
