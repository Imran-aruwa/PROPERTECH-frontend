'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type State = 'form' | 'success' | 'error' | 'no-token';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<State>(token ? 'form' : 'no-token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || data?.detail || 'Failed to reset password. The link may have expired.');
        setState('error');
        return;
      }

      setState('success');
    } catch {
      setError('Failed to reset password. Please try again.');
      setState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state === 'no-token') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-tx-primary mb-2">Invalid Reset Link</h1>
          <p className="text-tx-secondary mb-6">This password reset link is invalid or missing a token.</p>
          <Link href="/forgot-password" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Request a New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-tx-primary mb-2">Password Reset!</h1>
          <p className="text-tx-secondary mb-6">Your password has been changed successfully. You can now sign in with your new password.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="ProperTech Software" width={180} height={50} priority className="h-14 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-tx-primary mb-2">Set New Password</h1>
          <p className="text-tx-secondary">Enter your new password below.</p>
        </div>

        <div className="bg-bg-card rounded-2xl shadow-xl p-8">
          {state === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
              <div className="mt-2">
                <Link href="/forgot-password" className="font-medium underline">Request a new reset link</Link>
              </div>
            </div>
          )}

          {state === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-tx-secondary mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tx-muted" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={`w-full pl-12 pr-16 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-bg-card text-tx-primary ${error ? 'border-red-500' : 'border-bd-strong'}`}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-600">
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-tx-secondary mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tx-muted" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-16 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-bg-card text-tx-primary ${error ? 'border-red-500' : 'border-bd-strong'}`}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blue-600">
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && state === 'form' && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
