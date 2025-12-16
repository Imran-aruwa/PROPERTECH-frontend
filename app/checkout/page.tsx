'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Loader, CreditCard, Zap } from 'lucide-react';
import { authApi, apiClient } from '@/lib/api-services';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPriceUSD: number;
  yearlyPriceUSD: number;
  label: string;
  features: string[];
  isFree?: boolean;
  isPopular?: boolean;
}

const USD_TO_KES = 132;

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for testing',
    monthlyPriceUSD: 0,
    yearlyPriceUSD: 0,
    label: 'Up to 3 units',
    isFree: true,
    features: [
      'Up to 3 properties',
      'Basic analytics',
      'Email support',
      '1GB storage',
      'Tenant portal',
      'Maintenance requests',
      'Water/Electricity tracking',
      '14-day trial of all features',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals',
    monthlyPriceUSD: 49,
    yearlyPriceUSD: 490,
    label: 'Up to 10 units',
    features: [
      'Up to 10 properties',
      'Basic analytics',
      'Email support',
      '5GB storage',
      'Tenant portal',
      'Maintenance requests',
      'Water/Electricity tracking',
      'SMS notifications',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing property portfolios',
    monthlyPriceUSD: 99,
    yearlyPriceUSD: 990,
    label: 'Up to 50 units',
    isPopular: true,
    features: [
      'Up to 50 properties',
      'Advanced analytics',
      'Priority support',
      '50GB storage',
      'Tenant portal',
      'Maintenance requests',
      'Water/Electricity auto-billing',
      'Team members (up to 5)',
      'Custom reports',
      'SMS notifications',
      'Agent management',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPriceUSD: 0,
    yearlyPriceUSD: 0,
    label: 'Unlimited units',
    features: [
      'Unlimited everything',
      'Custom integrations',
      '24/7 priority support',
      'Unlimited storage',
      'Custom branding',
      'Dedicated account manager',
      'API access',
      'Advanced utilities management',
      'Unlimited team members',
      'Multi-property dashboard',
    ],
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Use your existing authApi
        const userData = await authApi.getCurrentUser();
        setIsAuthenticated(true);
        setUser(userData);

        // Load Paystack script
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
      } catch (err) {
        console.error('Checkout initialization error:', err);
        setError('Failed to initialize checkout');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, []);

  const formatPrice = (priceUSD: number) => {
    if (priceUSD === 0) return 'Free';
    const price = currency === 'USD' ? priceUSD : Math.round(priceUSD * USD_TO_KES);
    return currency === 'USD' ? `$${price}` : `KES ${price.toLocaleString()}`;
  };

  const handleFreePlan = async () => {
    try {
      setIsProcessing(true);

      await apiClient.post('/api/v1/subscriptions/activate-free', {});
      
      setPaymentComplete(true);
      setTimeout(() => {
        const role = user?.role || 'owner';
        router.push(`/${role}`);
      }, 2000);
    } catch (err: any) {
      setError('Failed to activate free plan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (plan: Plan) => {
    if (!user) return;

    // Handle free plan
    if (plan.isFree) {
      await handleFreePlan();
      return;
    }

    // Handle enterprise (contact sales)
    if (plan.id === 'enterprise') {
      window.location.href = 'mailto:sales@propertechsoftware.com?subject=Enterprise Plan Inquiry';
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const priceUSD = billingCycle === 'monthly' ? plan.monthlyPriceUSD : plan.yearlyPriceUSD;
      const priceKES = Math.round(priceUSD * USD_TO_KES);

      const reference = `PT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      if (typeof window !== 'undefined' && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: priceKES * 100,
          currency: 'KES',
          ref: reference,
          metadata: {
            custom_fields: [
              {
                display_name: 'Plan',
                variable_name: 'plan',
                value: plan.name,
              },
              {
                display_name: 'Billing Cycle',
                variable_name: 'billing_cycle',
                value: billingCycle,
              },
            ],
          },
          onClose: () => {
            setIsProcessing(false);
            setError('Payment cancelled');
          },
          callback: async (response: any) => {
            try {
              await apiClient.post('/api/v1/payments/verify', {
                reference: response.reference,
                plan_id: plan.id,
                billing_cycle: billingCycle,
              });

              setPaymentComplete(true);
              setTimeout(() => {
                const role = user.role || 'owner';
                router.push(`/${role}`);
              }, 2000);
            } catch (err: any) {
              setError('Payment verification failed. Please contact support.');
              setIsProcessing(false);
            }
          },
        });
        handler.openIframe();
      } else {
        throw new Error('Paystack not loaded. Please refresh and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
          <p className="text-gray-600 mb-6">You need to sign in to choose a plan.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mb-2"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/register')}
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
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
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
            {selectedPlan?.isFree ? 'Welcome!' : 'Payment Successful!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {selectedPlan?.name} plan activated. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
            <p className="text-blue-200 text-lg mb-8">
              Start free • No credit card required • Cancel anytime
            </p>

            <div className="flex items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setCurrency('KES')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currency === 'KES'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'
                }`}
              >
                KES
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  currency === 'USD'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`group rounded-lg shadow-lg transition-all p-6 border-2 relative cursor-pointer hover:scale-105 ${
                  plan.isPopular
                    ? 'border-yellow-400 bg-white'
                    : plan.isFree
                    ? 'border-green-400 bg-white'
                    : plan.id === 'enterprise'
                    ? 'border-blue-500/30 bg-slate-800/50'
                    : 'border-transparent bg-white hover:border-blue-500'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {plan.isFree && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      FREE FOREVER
                    </span>
                  </div>
                )}

                <h2 className={`text-2xl font-bold mb-2 ${
                  plan.id === 'enterprise' ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {plan.name}
                </h2>
                <p className={`text-sm mb-6 ${
                  plan.id === 'enterprise' ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className={`text-4xl font-bold ${
                    plan.id === 'enterprise' ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {formatPrice(
                      billingCycle === 'monthly'
                        ? plan.monthlyPriceUSD
                        : plan.yearlyPriceUSD
                    )}
                  </span>
                  {plan.monthlyPriceUSD > 0 && plan.id !== 'enterprise' && (
                    <span className="text-gray-600 text-sm ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>

                <p className={`text-sm mb-6 font-medium ${
                  plan.isFree ? 'text-green-600' : plan.id === 'enterprise' ? 'text-gray-500' : 'text-blue-600'
                }`}>
                  {plan.label}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 text-sm ${
                        plan.id === 'enterprise'
                          ? 'text-gray-500'
                          : 'text-gray-700'
                      }`}
                    >
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.isFree ? 'text-green-600' : plan.id === 'enterprise' ? 'text-gray-400' : 'text-blue-600'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-2 rounded-lg font-medium transition ${
                    plan.isFree
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : plan.isPopular
                      ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                      : plan.id === 'enterprise'
                      ? 'bg-slate-700 text-blue-200 hover:bg-slate-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.isFree ? 'Start Free' : plan.id === 'enterprise' ? 'Contact Sales' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg transition ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg transition ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-blue-200 hover:bg-slate-700'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priceUSD =
    billingCycle === 'monthly'
      ? selectedPlan!.monthlyPriceUSD
      : selectedPlan!.yearlyPriceUSD;
  const priceKES = Math.round(priceUSD * USD_TO_KES);
  const displayPrice = selectedPlan!.isFree 
    ? 'Free Forever' 
    : selectedPlan!.id === 'enterprise'
    ? 'Custom Pricing'
    : currency === 'USD' 
    ? `$${priceUSD}` 
    : `KES ${priceKES.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 py-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setSelectedPlan(null)}
          className="mb-6 text-blue-400 hover:text-blue-300 font-medium"
        >
          ← Back to Plans
        </button>

        <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {selectedPlan!.name}
          </h2>
          <p className="text-blue-200 mb-6">
            {selectedPlan!.isFree ? 'Free plan' : selectedPlan!.id === 'enterprise' ? 'Enterprise plan' : `${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} subscription`}
          </p>

          <div className="bg-blue-50/10 rounded-lg p-4 mb-6 border border-blue-400/20">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white">
                {selectedPlan!.isFree ? 'No Payment Required' : selectedPlan!.id === 'enterprise' ? 'Contact Sales' : 'Card Payment'}
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {displayPrice}
            </div>
            {billingCycle === 'yearly' && !selectedPlan!.isFree && selectedPlan!.id !== 'enterprise' && (
              <p className="text-blue-300 text-sm mt-2">
                Save 20% compared to monthly
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={() => handlePayment(selectedPlan!)}
            disabled={isProcessing}
            className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              selectedPlan!.isFree
                ? 'bg-green-600 text-white hover:bg-green-700'
                : selectedPlan!.id === 'enterprise'
                ? 'bg-slate-700 text-blue-200 hover:bg-slate-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {selectedPlan!.isFree ? 'Activate Free Plan' : selectedPlan!.id === 'enterprise' ? 'Contact Sales Team' : 'Pay Now with Paystack'}
              </>
            )}
          </button>

          {!selectedPlan!.isFree && selectedPlan!.id !== 'enterprise' && (
            <p className="text-xs text-blue-300/80 text-center mt-4">
              Your payment is secure and encrypted. Powered by Paystack.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}



