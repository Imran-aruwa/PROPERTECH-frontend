'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { paymentsApi, apiClient } from '@/lib/api-services';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Check, Crown } from 'lucide-react';

const plans = [
  { id: 'free', name: 'Free', price: 0, yearlyPrice: 0, features: ['1 Property', '5 Units max'] },
  { id: 'starter', name: 'Starter', price: 6468, yearlyPrice: 64680, features: ['3 Properties', '10 Units max', 'Payment tracking'], popular: true },
  { id: 'professional', name: 'Professional', price: 13088, yearlyPrice: 130880, features: ['10 Properties', '50 Units max', 'Priority support'] },
  { id: 'enterprise', name: 'Enterprise', price: 29900, yearlyPrice: 299000, features: ['Unlimited Properties', 'Unlimited Units', 'API access'] },
];

export default function SubscriptionPage() {
  const { isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<{ plan: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (role && role !== 'owner') { router.push('/unauthorized'); return; }
    paymentsApi.getSubscriptions()
      .then(d => { if (d.success) setSubscription(d.data); })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, role, router]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    setUpgrading(planId);
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const amount = billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;
    try {
      const d = await apiClient.post('/payments/initialize/', { plan_id: planId, billing_cycle: billingCycle, amount, currency: 'KES' });
      const paymentData = d.data?.data || d.data;
      if (d.success && paymentData?.authorization_url) window.location.href = paymentData.authorization_url;
      else alert(d.error || 'Failed');
    } catch { alert('Payment failed'); }
    setUpgrading(null);
  };

  if (authLoading || loading) return <DashboardLayout role='owner'><div className='flex items-center justify-center min-h-[60vh]'><LoadingSpinner size='lg' /></div></DashboardLayout>;

  return (
    <DashboardLayout role='owner'>
      <div className='space-y-8 max-w-6xl mx-auto'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Subscription Plans</h1>
          <p className='text-gray-600 mt-2'>Choose the plan that fits your needs</p>
        </div>
        {subscription && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between'>
            <div><p className='font-medium text-blue-900'>Current: {subscription.plan}</p><p className='text-sm text-blue-700'>Status: {subscription.status}</p></div>
            <Crown className='w-8 h-8 text-blue-600' />
          </div>
        )}
        <div className='flex justify-center'>
          <div className='bg-gray-100 rounded-lg p-1 inline-flex'>
            <button onClick={() => setBillingCycle('monthly')} className={'px-4 py-2 rounded-md text-sm font-medium ' + (billingCycle === 'monthly' ? 'bg-white shadow' : 'text-gray-500')}>Monthly</button>
            <button onClick={() => setBillingCycle('yearly')} className={'px-4 py-2 rounded-md text-sm font-medium ' + (billingCycle === 'yearly' ? 'bg-white shadow' : 'text-gray-500')}>Yearly</button>
          </div>
        </div>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {plans.map((plan) => (
            <div key={plan.id} className={'bg-white rounded-xl shadow-sm border-2 p-6 relative ' + (plan.popular ? 'border-blue-500' : 'border-gray-200')}>
              {plan.popular && <span className='absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full'>Popular</span>}
              <div className='text-center mb-6'>
                <h3 className='text-xl font-bold'>{plan.name}</h3>
                <div className='mt-4'><span className='text-3xl font-bold'>KES {(billingCycle === 'monthly' ? plan.price : plan.yearlyPrice).toLocaleString()}</span>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
              </div>
              <ul className='space-y-2 mb-6'>{plan.features.map((f, i) => <li key={i} className='flex items-center gap-2 text-sm'><Check className='w-4 h-4 text-green-500' />{f}</li>)}</ul>
              <button onClick={() => handleUpgrade(plan.id)} disabled={upgrading === plan.id || subscription?.plan === plan.id} className={'w-full py-2 rounded-lg font-medium ' + (subscription?.plan === plan.id ? 'bg-gray-100 text-gray-500' : plan.popular ? 'bg-blue-600 text-white' : 'bg-gray-100')}>
                {upgrading === plan.id ? 'Processing...' : subscription?.plan === plan.id ? 'Current' : plan.price === 0 ? 'Free' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}