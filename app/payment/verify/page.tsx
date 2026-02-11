'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-services';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function PaymentVerifyContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) { setStatus('error'); setMessage('No payment reference found'); return; }
    const verify = async () => {
      try {
        const d = await apiClient.post('/payments/verify/', { reference });
        if (d.success) { setStatus('success'); setMessage('Payment successful! Subscription activated.'); }
        else { setStatus('error'); setMessage(d.error || 'Verification failed'); }
      } catch { setStatus('error'); setMessage('Verification failed'); }
    };
    verify();
  }, [searchParams]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center'>
        {status === 'loading' && (<><Loader2 className='w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin' /><h1 className='text-2xl font-bold mb-2'>Verifying Payment</h1><p className='text-gray-600'>Please wait...</p></>)}
        {status === 'success' && (<><CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' /><h1 className='text-2xl font-bold mb-2'>Payment Successful!</h1><p className='text-gray-600 mb-6'>{message}</p><Link href='/owner/dashboard' className='px-6 py-3 bg-blue-600 text-white rounded-lg inline-block'>Go to Dashboard</Link></>)}
        {status === 'error' && (<><XCircle className='w-16 h-16 text-red-500 mx-auto mb-4' /><h1 className='text-2xl font-bold mb-2'>Payment Failed</h1><p className='text-gray-600 mb-6'>{message}</p><div className='space-x-2'><Link href='/owner/subscription' className='px-6 py-3 bg-blue-600 text-white rounded-lg inline-block'>Try Again</Link><Link href='/owner/dashboard' className='px-6 py-3 bg-gray-100 rounded-lg inline-block'>Dashboard</Link></div></>)}
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return <Suspense fallback={<div className='min-h-screen flex items-center justify-center'><LoadingSpinner size='lg' /></div>}><PaymentVerifyContent /></Suspense>;
}