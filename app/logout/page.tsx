'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [showMessage, setShowMessage] = useState(true);

  useEffect(() => {
    // Clear auth data immediately
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-md">
        {/* Logo Animation */}
        <div className="flex justify-center animate-bounce">
          <div className="bg-bg-card/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v6h-6M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-6h6" />
            </svg>
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Thank you!</h1>
          <p className="text-xl text-blue-100">You have been successfully logged out</p>
          
          {/* Success Message Box */}
          <div className="bg-bg-card/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mt-6">
            <p className="text-green-200 font-semibold mb-2">✓ Session Ended Successfully</p>
            <p className="text-blue-100 text-sm">Your account is now secure and logged out. You will be redirected to the home page shortly.</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-2 py-4">
          <div className="w-3 h-3 bg-bg-card rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-bg-card rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-bg-card rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* PROPERTECH Branding */}
        <div className="pt-8 border-t border-white/20">
          <div className="inline-block bg-bg-card/10 backdrop-blur-sm rounded-2xl px-8 py-4 space-y-2">
            <p className="text-3xl font-bold text-white tracking-tight">PROPERTECH SOFTWARE</p>
            <p className="text-sm text-blue-100 font-medium">Property Management Made Simple</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="pt-4">
          <p className="text-blue-100 text-sm font-medium">
            Redirecting in <span className="font-bold text-white text-lg">{countdown}</span> seconds...
          </p>
        </div>

        {/* Manual Redirect Option */}
        <div className="pt-2">
          <button
            onClick={() => router.push('/')}
            className="text-blue-100 hover:text-white text-sm underline transition-colors font-medium"
          >
            Return to Home Now
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}


