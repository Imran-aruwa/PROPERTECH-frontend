/**
 * PROPERTECH Payment Functions
 * Integrates with Supabase + Paystack + Flutterwave
 */

import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/databaseTypes';

type Payment = Database['public']['Tables']['payments']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export interface PaymentConfig {
  gateway: 'paystack' | 'flutterwave';
  currency: string;
  method: string;
  amount: number;
  email: string;
  phoneNumber?: string;
  name?: string;
  planId?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  reference: string;
  authorizationUrl?: string;
  gateway: string;
  amount: number;
  currency: string;
  message?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get JWT token for backend API calls
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
 * Make authenticated API call to backend
 */
async function apiCall<T>(
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
 * Get current authenticated user
 */
export async function getCurrentPaymentUser(): Promise<User | null> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Auto-detect payment gateway based on user location
 */
export async function detectPaymentGateway(): Promise<{
  gateway: 'paystack' | 'flutterwave';
  currency: string;
  method: string;
  country_code: string;
}> {
  try {
    const data = await apiCall<any>('/api/payments/detect-gateway', {
      method: 'POST',
    });

    return data.data || {
      gateway: 'paystack',
      currency: 'KES',
      method: 'mpesa',
      country_code: 'KE',
    };
  } catch (error) {
    console.error('Gateway detection error:', error);
    return {
      gateway: 'paystack',
      currency: 'KES',
      method: 'mpesa',
      country_code: 'KE',
    };
  }
}

/**
 * Initiate payment transaction
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
        currency: config.currency,
        gateway: config.gateway,
        method: config.method,
        plan_id: config.planId,
        description: `Payment for ${config.planId}`,
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
 * Get user's payment history from Supabase
 */
export async function getPaymentHistory(limit: number = 10): Promise<Payment[]> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data as Payment[]) || [];
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
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('status', 'active');

    if (error) throw error;

    return (data as Subscription[]) || [];
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
 * Load Flutterwave script
 */
export function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FlutterwaveCheckout) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load Flutterwave script'));
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
    mpesa: 'M-Pesa',
    kes_card: 'KES Card',
    usd_card: 'USD Card',
    apple_pay: 'Apple Pay',
    google_pay: 'Google Pay',
  };
  return methods[method] || method;
}

/**
 * Get gateway display name
 */
export function getGatewayName(gateway: string): string {
  const gateways: Record<string, string> = {
    paystack: 'Paystack',
    flutterwave: 'Flutterwave',
  };
  return gateways[gateway] || gateway;
}

/**
 * Update user payment preferences
 */
export async function updatePaymentPreferences(
  preferences: Partial<
    Database['public']['Tables']['user_preferences']['Insert']
  >
): Promise<boolean> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_preferences')
      .update(preferences)
      .eq('user_id', authUser.id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating preferences:', error);
    return false;
  }
}

/**
 * Get user payment preferences
 */
export async function getPaymentPreferences(): Promise<
  Database['public']['Tables']['user_preferences']['Row'] | null
> {
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return (data as any) || null;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }
}