'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { authAPI, propertiesAPI } from '@/lib/api';
import './dashboard.css';

import { Building2, Home, Users, DollarSign, Plus, LogOut, Menu, X, Wrench, BarChart3, Bell, Search, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
  units?: any[];
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

interface UserData {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        router.push('/auth/login');
        return;
      }

      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      // Get user data from auth API or Supabase
      const userData = await authAPI.getCurrentUser();
      const userDataTyped = userData as UserData | null;
      
      if (userDataTyped) {
        setUser({
          id: session.user.id,
          email: session.user.email || userDataTyped.email || '',
          full_name: userDataTyped.full_name,
          role: userDataTyped.role || 'user',
        });
      } else {
        // Fallback to auth user data
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: 'User',
          role: 'user',
        });
      }

      // Load properties
      const propertiesData = await propertiesAPI.list();
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setSignOutLoading(true);
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
      setSignOutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length || 0), 0);
  const occupiedUnits = properties.reduce((sum, p) => 
    sum + (p.units?.filter((u: any) => u.status === 'occupied').length || 0), 0);
  const totalRevenue = properties.reduce((sum, p) => 
    sum + (p.units?.reduce((unitSum: number, u: any) => 
      u.status === 'occupied' && u.monthly_rent ? unitSum + u.monthly_rent : unitSum, 0) || 0), 0);

  const stats = [
    {
      name: 'Total Properties',
      value: properties.length,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true,
      delayClass: 'stat-card-delay-0'
    },
    {
      name: 'Total Units',
      value: totalUnits,
      icon: Home,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+8%',
      trendUp: true,
      delayClass: 'stat-card-delay-100'
    },
    {
      name: 'Occupied Units',
      value: occupiedUnits,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: `${totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}%`,
      trendUp: occupiedUnits > 0,
      delayClass: 'stat-card-delay-200'
    },
    {
      name: 'Monthly Revenue',
      value: `KES ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      trend: '+15%',
      trendUp: true,
      delayClass: 'stat-card-delay-300'
    }
  ];

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, active: true },
    { name: 'Properties', href: '/dashboard/properties', icon: Building2, active: false },
    { name: 'Tenants', href: '/dashboard/tenants', icon: Users, active: false },
    { name: 'Financials', href: '/dashboard/financials', icon: DollarSign, active: false },
    { name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench, active: false },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, active: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-xl transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 tracking-tight">PROPERTECH</div>
              <div className="text-xs text-gray-500 font-medium">Dashboard</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                    item.active
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-gray-700 hover:bg-white/50 hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    item.active ? 'text-white' : 'text-gray-500'
                  }`} aria-hidden="true" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {user?.full_name || 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={signOutLoading}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium disabled:opacity-50"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {signOutLoading ? 'Signing out...' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-600 mt-0.5 font-medium">Welcome back, {user?.full_name || 'User'}! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/50 border border-gray-200 rounded-lg hover:bg-white transition text-sm font-medium"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <span className="text-gray-600">Search...</span>
              </button>
              <button 
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" aria-hidden="true" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></span>
              </button>
              <Link
                href="/dashboard/properties/new"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30 font-semibold text-sm"
                aria-label="Add new property"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                <span className="hidden sm:inline">Add Property</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="p-4 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;
              return (
                <div 
                  key={stat.name} 
                  className={`group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden ${stat.delayClass}`}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.bgColor} p-3 rounded-xl shadow-sm group-hover:shadow-md transition-shadow`}>
                        <Icon className={`w-6 h-6 ${stat.iconColor}`} aria-hidden="true" />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        stat.trendUp ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendIcon className="w-3 h-3" aria-hidden="true" />
                        {stat.trend}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">{stat.name}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Properties List */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
                <span className="text-sm text-gray-500 font-medium">{properties.length} total</span>
              </div>
            </div>
            <div className="p-6">
              {properties.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No properties yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by adding your first property to begin managing your real estate portfolio</p>
                  <Link
                    href="/dashboard/properties/new"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30 font-semibold"
                  >
                    <Plus className="w-5 h-5" aria-hidden="true" />
                    Add Your First Property
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property, idx) => {
                    const delayClass = `property-card-delay-${idx * 50}`;
                    return (
                      <Link
                        key={property.id}
                        href={`/dashboard/properties/${property.id}`}
                        className={`group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 overflow-hidden ${delayClass}`}
                      >
                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Building2 className="w-7 h-7 text-white" aria-hidden="true" />
                            </div>
                            <span className="text-xs bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-3 py-1.5 rounded-full font-semibold shadow-sm">
                              {property.units?.length || 0} units
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-blue-600 transition-colors">
                            {property.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{property.address}</p>
                          
                          {property.property_type && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                {property.property_type}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}