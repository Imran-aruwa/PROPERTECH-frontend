/**
 * PROPERTECH Payment Functions - Paystack Only
 * Simplified payment integration
 */

import type { Database } from '@/app/lib/databaseTypes';

type Payment = Database['public']['Tables']['payments']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface PaymentConfig {
  currency: string;
  method: string;
  amount: number;
  email: string;
  planId?: string;
  countryCode?: string;
  ipAddress?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_id: string;
  reference: string;
  authorization_url?: string;
  gateway: string;
  amount: number;
  currency: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get JWT token for backend API calls
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('access_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API call to backend
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

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
 * Get current authenticated user
 */
export async function getCurrentPaymentUser(): Promise<User | null> {
  try {
    const data = await apiCall<User>('/api/users/profile');
    return data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Initiate payment transaction with Paystack
 */
export async function initiatePayment(
  config: PaymentConfig
): Promise<PaymentResponse> {
  try {
    const user = await getCurrentPaymentUser();
    if (!user) throw new Error('User not authenticated');

    const data = await apiCall<PaymentResponse>('/api/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({
        amount: config.amount,
        currency: config.currency || 'KES',
        gateway: 'paystack',
        method: config.method || 'card',
        plan_id: config.planId,
        country_code: config.countryCode || 'KE',
        ip_address: config.ipAddress,
        description: config.description || `Payment for ${config.planId}`,
      }),
    });

    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Payment initialization failed'
    );
  }
}

/**
 * Verify payment after completion
 */
export async function verifyPayment(reference: string): Promise<any> {
  try {
    return await apiCall('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Payment verification failed'
    );
  }
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(limit: number = 10): Promise<Payment[]> {
  try {
    const data = await apiCall<Payment[]>(`/api/payments/history?limit=${limit}`);
    return data || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

/**
 * Get user's active subscriptions
 */
export async function getActiveSubscriptions(): Promise<Subscription[]> {
  try {
    const data = await apiCall<Subscription[]>('/api/payments/subscriptions');
    return data || [];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }
}

/**
 * Create new subscription
 */
export async function createSubscription(
  plan: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<any> {
  try {
    return await apiCall('/api/payments/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        plan,
        billing_cycle: billingCycle,
      }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Subscription creation failed'
    );
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<any> {
  try {
    return await apiCall(`/api/payments/cancel-subscription/${subscriptionId}`, {
      method: 'POST',
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Subscription cancellation failed'
    );
  }
}

/**
 * Load Paystack script
 */
export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.body.appendChild(script);
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'KES'
): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: string): string {
  const methods: Record<string, string> = {
    card: 'Card Payment',
    bank: 'Bank Transfer',
    ussd: 'USSD',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
  };
  return methods[method] || method;
}