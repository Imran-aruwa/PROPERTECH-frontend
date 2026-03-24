'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/app/lib/api-services';

type State = 'loading' | 'success' | 'error';

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<State>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('No verification token found. Please check your email link.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then((res) => {
        if (res.success) {
          setState('success');
        } else {
          setState('error');
          setErrorMessage(res.error || 'Verification failed. Please try again.');
        }
      })
      .catch(() => {
        setState('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      });
  }, [token]);

  const handleResendRequest = async () => {
    if (!resendEmail || resendLoading) return;
    setResendLoading(true);
    try {
      await authApi.resendVerification(resendEmail);
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <span className="text-2xl font-bold text-white">P</span>
          </div>
          <h1 className="text-3xl font-bold text-tx-primary">PROPERTECH</h1>
        </div>

        <div className="bg-bg-card rounded-2xl shadow-xl p-10 text-center">
          {/* ── Loading ── */}
          {state === 'loading' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6">
                <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-tx-primary mb-2">Verifying your email...</h2>
              <p className="text-tx-secondary text-sm">Please wait a moment.</p>
            </>
          )}

          {/* ── Success ── */}
          {state === 'success' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-tx-primary mb-2">Email Verified!</h2>
              <p className="text-tx-secondary mb-8">
                Your PROPERTECH account is now active. You can sign in and start managing your properties.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Login to Your Account →
              </Link>
            </>
          )}

          {/* ── Error ── */}
          {state === 'error' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-tx-primary mb-2">Verification Failed</h2>
              <p className="text-tx-secondary mb-8">{errorMessage}</p>

              {resendSent ? (
                <p className="text-sm text-green-600 font-medium">
                  A new verification link has been sent. Please check your inbox.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-tx-secondary font-medium">Request a new verification link:</p>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 bg-bg-card text-tx-primary text-sm"
                  />
                  <button
                    onClick={handleResendRequest}
                    disabled={!resendEmail || resendLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {resendLoading ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : 'Send New Verification Link'}
                  </button>
                </div>
              )}

              <p className="mt-6 text-sm text-tx-muted">
                <Link href="/login" className="text-blue-600 hover:text-blue-700">Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
