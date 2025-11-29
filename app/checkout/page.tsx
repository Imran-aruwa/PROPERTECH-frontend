'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Loader, Smartphone, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import {
  detectPaymentGateway,
  initiatePayment,
  loadPaystackScript,
  formatCurrency,
  getPaymentMethodName,
} from '@/lib/payments';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals',
    monthlyPrice: 2900,
    yearlyPrice: 29000,
    features: [
      'Up to 5 properties',
      'Basic analytics',
      'Email support',
      '1GB storage',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing agencies',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    features: [
      'Unlimited properties',
      'Advanced analytics',
      'Priority support',
      '100GB storage',
      'Team members',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 29900,
    yearlyPrice: 299000,
    features: [
      'Unlimited everything',
      'Custom integrations',
      '24/7 support',
      'Unlimited storage',
      'Custom branding',
    ],
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [gateway, setGateway] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication and detect gateway
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUser(session.user);

        // Auto-detect payment gateway
        const detectedGateway = await detectPaymentGateway();
        setGateway(detectedGateway);

        // Pre-load Paystack script
        if (detectedGateway.gateway === 'paystack') {
          await loadPaystackScript();
        }
      } catch (err) {
        console.error('Checkout initialization error:', err);
        setError('Failed to initialize checkout');
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, []);

  const handlePaystackPayment = async (plan: Plan) => {
    if (!gateway || !user) return;

    try {
      setIsProcessing(true);
      setError(null);

      const amount =
        billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

      // Initiate payment
      const payment = await initiatePayment({
        gateway: 'paystack',
        currency: gateway.currency,
        method: gateway.method,
        amount,
        email: user.email,
        planId: plan.id,
      });

      // Open Paystack checkout
      if ((window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: amount * 100, // Paystack uses cents
          currency: gateway.currency,
          ref: payment.reference,
          onClose: () => {
            setIsProcessing(false);
            setError('Payment cancelled');
          },
          onSuccess: () => {
            setPaymentComplete(true);
            setTimeout(() => router.push('/dashboard'), 2000);
          },
        });
        handler.openIframe();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  const handlePayment = (plan: Plan) => {
    if (!gateway) {
      setError('Gateway detection failed');
      return;
    }

    handlePaystackPayment(plan);
  };

  // Not authenticated - show sign in/sign up prompt
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-6">
            You need to sign in to purchase a plan.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mb-2"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/auth/signup')}
            className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            {selectedPlan?.name} subscription activated. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-gray-600 text-lg">
              {gateway ? (
                <>
                  Auto-detected: Paystack (M-Pesa/Card) • {gateway.currency}
                </>
              ) : (
                'Detecting payment method...'
              )}
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h2>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(plan.monthlyPrice, gateway?.currency || 'KES')}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Select Plan
                </button>
              </div>
            ))}
          </div>

          {/* Billing cycle toggle */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg transition ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg transition ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const amount =
    billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setSelectedPlan(null)}
          className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Plans
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedPlan.name}
          </h2>
          <p className="text-gray-600 mb-6">
            {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} subscription
          </p>

          {/* Payment method indicator */}
          {gateway && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                {gateway.method === 'mpesa' ? (
                  <Smartphone className="w-5 h-5 text-blue-600" />
                ) : (
                  <CreditCard className="w-5 h-5 text-blue-600" />
                )}
                <span className="font-medium text-gray-900">
                  {getPaymentMethodName(gateway.method)}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(amount, gateway.currency)}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Payment button */}
          <button
            onClick={() => handlePayment(selectedPlan)}
            disabled={isProcessing || !gateway}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Pay Now
              </>
            )}
          </button>

          {/* Security message */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Your payment is secure and encrypted. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
}