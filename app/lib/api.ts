const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

export const createProperty = async (propertyData: any) => {
  // TEMP placeholder — replace with backend call later
  return {
    id: Date.now().toString(),
    ...propertyData
  };
};


// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  async signup(data: { email: string; password: string; full_name?: string }) {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(email: string, password: string) {
    const response = await apiRequest<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access_token);
    }
    
    return response;
  },

  async getCurrentUser() {
    return apiRequest('/auth/me');
  },
  
  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },
};

// Properties API
export const propertiesAPI = {
  list() {
    return apiRequest('/properties');
  },
  
  get(id: string) {
    return apiRequest(`/properties/${id}`);
  },
  
  create(data: any) {
    return apiRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  update(id: string, data: any) {
    return apiRequest(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete(id: string) {
    return apiRequest(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // Units
  createUnit(propertyId: string, data: any) {
    return apiRequest(`/properties/${propertyId}/units`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  listUnits(propertyId: string) {
    return apiRequest(`/properties/${propertyId}/units`);
  },
};