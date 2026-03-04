// ============================================
// FILE: app/payment/cancel/page.tsx
// ============================================
'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-bg-card rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-tx-primary mb-2">Payment Cancelled</h1>
        <p className="text-tx-secondary mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
          <p className="text-sm text-yellow-800">
            Need help with your payment? Contact our support team at support@propertechsoftware.com
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/checkout" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </Link>
          <Link href="/tenant/dashboard" className="flex-1 flex items-center justify-center gap-2 bg-bd text-tx-secondary px-4 py-2 rounded-lg hover:bg-bg-hover">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


