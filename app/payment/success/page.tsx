// ============================================
// FILE: app/payment/success/page.tsx
// ============================================
'use client';

import Link from 'next/link';
import { CheckCircle, Download, Home } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-bg-card rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-tx-primary mb-2">Payment Successful!</h1>
        <p className="text-tx-secondary mb-6">Your rent payment has been processed successfully.</p>
        
        <div className="bg-bg-secondary rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-tx-secondary">Transaction ID:</span>
              <span className="font-medium">TXN-2024-001234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tx-secondary">Amount:</span>
              <span className="font-medium">KES 25,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tx-secondary">Date:</span>
              <span className="font-medium">Dec 09, 2024</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
          <Link href="/tenant/dashboard" className="flex-1 flex items-center justify-center gap-2 bg-bd text-tx-secondary px-4 py-2 rounded-lg hover:bg-bg-hover">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}



