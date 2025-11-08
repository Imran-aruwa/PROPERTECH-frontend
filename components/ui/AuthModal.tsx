// components/ui/AuthModal.tsx
'use client'
import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Props = {
  show: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
};

export default function AuthModal({ show, mode, onClose }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!show) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      // On success, redirect to dashboard
      onClose();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // sign up
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (signupError) throw signupError;

      // Option: auto sign-in after signup if email-confirm not required.
      // We'll attempt sign-in (if the project requires email confirm, this may fail).
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // not fatal — user may need to confirm email
        console.warn('post-signup signIn error', signInError);
      } else {
        onClose();
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-3 text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5" />
            <div>{error}</div>
          </div>
        )}

        {mode === 'login' ? (
          <>
            <h3 className="text-xl font-bold mb-4 text-center">Welcome back</h3>
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border p-3 rounded-lg" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border p-3 rounded-lg" />
              <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-3">Forgot password? Use the account recovery link in Supabase Auth settings.</p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4 text-center">Create account</h3>
            <form onSubmit={handleSignup} className="space-y-3">
              <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border p-3 rounded-lg" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border p-3 rounded-lg" />
              <input type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full border p-3 rounded-lg" />
              <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg">
                {loading ? 'Creating...' : 'Sign up'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-3">We’ll send a confirmation email if your Supabase settings require it.</p>
          </>
        )}
      </div>
    </div>
  );
}
