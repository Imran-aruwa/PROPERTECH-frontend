/**
 * API Helper for Backend Communication
 * Integrated with your existing patterns
 */

import { supabase } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get JWT token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make API request with authentication
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Payment API functions
 */
export const paymentApi = {
  detectGateway: () =>
    apiRequest('/api/payments/detect-gateway', { method: 'POST' }),

  initiate: (payload: Record<string, any>) =>
    apiRequest('/api/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verify: (reference: string) =>
    apiRequest('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    }),

  subscribe: (payload: Record<string, any>) =>
    apiRequest('/api/payments/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  history: (skip = 0, limit = 10) =>
    apiRequest(`/api/payments/history?skip=${skip}&limit=${limit}`),

  subscriptions: () => apiRequest('/api/payments/subscriptions'),

  cancelSubscription: (subscriptionId: string) =>
    apiRequest(`/api/payments/cancel-subscription/${subscriptionId}`, {
      method: 'POST',
    }),
};

/**
 * User API functions
 */
export const userApi = {
  getProfile: () => apiRequest('/api/users/profile'),

  updateProfile: (data: Record<string, any>) =>
    apiRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getPreferences: () => apiRequest('/api/users/preferences'),

  updatePreferences: (data: Record<string, any>) =>
    apiRequest('/api/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

/**
 * Waitlist API functions (extends your existing waitlist.ts)
 */
export const waitlistApi = {
  submit: (data: { email: string; name?: string; country?: string }) =>
    fetch(`${API_BASE}/api/v1/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error('Waitlist submission failed');
      return res.json();
    }),
};

/**
 * Generic error handler
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}