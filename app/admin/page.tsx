'use client';

import { useAuth } from '@/app/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Shield, Users, Building2, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome, {user?.full_name || 'Administrator'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Admin Panel
              </h3>
              <p className="text-purple-800">
                This is the admin control panel. Full admin features are coming soon.
                For now, you can manage your account and access system settings.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/owner"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Building2 className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">View as Owner</h3>
            <p className="text-sm text-gray-600">Access owner dashboard features</p>
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-60">
            <Users className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">User Management</h3>
            <p className="text-sm text-gray-600">Coming soon</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 opacity-60">
            <Settings className="w-8 h-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">System Settings</h3>
            <p className="text-sm text-gray-600">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
