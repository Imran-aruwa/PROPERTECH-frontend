'use client';

import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

export default function UnauthorizedPage() {
  const { user, role, logout } = useAuth();

  const getRoleBasedRedirect = () => {
    if (!role) return '/login';
    const roleRedirects: Record<string, string> = {
      owner: '/owner',
      caretaker: '/caretaker',
      agent: '/agent',
      tenant: '/tenant',
      staff: '/staff',
      admin: '/admin',
    };
    return roleRedirects[role] || '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>

        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>

        {user && (
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <p className="text-sm text-gray-500">Signed in as:</p>
            <p className="font-medium text-gray-900">{user.email}</p>
            <p className="text-sm text-gray-500 capitalize">Role: {role}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={getRoleBasedRedirect()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {user && (
          <button
            onClick={logout}
            className="mt-6 text-sm text-red-600 hover:text-red-700"
          >
            Sign out and use a different account
          </button>
        )}

        <p className="mt-8 text-sm text-gray-500">
          Need help?{' '}
          <a href="mailto:support@propertechsoftware.com" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
