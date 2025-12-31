// ============================================
// FILE: app/agent/page.tsx (COMPLETE - FIXED)
// ============================================
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { Building2, Users, DollarSign, TrendingUp, UserPlus, Eye, Calendar, Target } from 'lucide-react';
import Link from 'next/link';

export default function AgentDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('agent');
  
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [viewings, setViewings] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch data from API
      const [propertiesRes, tenantsRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/tenants')
      ]);

      const propertiesData = await propertiesRes.json();
      const tenantsData = await tenantsRes.json();

      // Handle API response format properly
      setProperties(Array.isArray(propertiesData) ? propertiesData : (propertiesData.data || []));
      setTenants(Array.isArray(tenantsData) ? tenantsData : (tenantsData.data || []));

      // Leads and viewings will come from backend when those endpoints are available
      setLeads([]);
      setViewings([]);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      // Set empty arrays on error
      setProperties([]);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  const thisMonth = new Date().getMonth();
  const monthlyLeases = tenants.filter(t => 
    t.lease_start && new Date(t.lease_start).getMonth() === thisMonth
  ).length;

  const stats = [
    {
      title: 'Available Properties',
      value: properties.filter(p => (p.total_units || p.totalUnits || 0) > (p.occupied_units || p.occupiedUnits || 0)).length,
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      link: '/agent/properties'
    },
    {
      title: 'Active Leads',
      value: leads.length,
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      link: '/agent/leads'
    },
    {
      title: 'Leases This Month',
      value: monthlyLeases,
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      link: '/agent/tenants'
    },
    {
      title: 'Commission Earned',
      value: `KSh ${(monthlyLeases * 15000).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-orange-500 to-red-500',
      link: '/agent/earnings'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 opacity-90"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-blue-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between animate-fade-in-up">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, <span className="text-gradient">{user?.full_name || 'Agent'}</span>!
              </h1>
              <p className="text-blue-300">Property Agent Dashboard</p>
            </div>
            <Link
              href="/agent/leads"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              Add Lead
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link
              key={index}
              href={stat.link}
              className="group bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-500/20 transition-all animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-blue-200 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hot Leads */}
          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-purple-400" />
                Active Leads
              </h2>
              <Link href="/agent/leads" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                View All
              </Link>
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-blue-200">No active leads</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                          {lead.name}
                        </h3>
                        <p className="text-sm text-blue-300/70 mt-1">{lead.phone}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        lead.status === 'hot' ? 'bg-red-500/20 text-red-400' :
                        lead.status === 'warm' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {lead.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-200/70">Interested in: {lead.property}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Viewings */}
          <div className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-400" />
                Upcoming Viewings
              </h2>
              <Link href="/agent/viewings" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                View All
              </Link>
            </div>

            {viewings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                <p className="text-blue-200">No upcoming viewings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {viewings.map((viewing) => (
                  <div
                    key={viewing.id}
                    className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                          {viewing.client}
                        </h3>
                        <p className="text-sm text-blue-200/70 mt-1">{viewing.property}</p>
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {viewing.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Properties */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              Available Properties
            </h2>
            <Link href="/agent/properties" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-blue-200">No properties available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {properties
                .filter(p => (p.total_units || p.totalUnits || 0) > (p.occupied_units || p.occupiedUnits || 0))
                .slice(0, 3)
                .map((property) => (
                  <div
                    key={property.id}
                    className="bg-slate-900/50 border border-blue-500/20 rounded-lg overflow-hidden hover:border-blue-400/50 transition-all group"
                  >
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-white opacity-50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors mb-2">
                        {property.name}
                      </h3>
                      <p className="text-sm text-blue-200/70 mb-3">{property.address}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-400">
                          {((property.total_units || property.totalUnits || 0) - (property.occupied_units || property.occupiedUnits || 0))} units available
                        </span>
                        <Link
                          href="/agent/properties"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/agent/leads"
            className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-purple-500/20 transition-all group animate-fade-in-up"
            style={{ animationDelay: '0.7s' }}
          >
            <UserPlus className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              Add New Lead
            </h3>
            <p className="text-sm text-blue-200/70">Capture potential clients</p>
          </Link>

          <Link
            href="/agent/viewings"
            className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-green-500/20 transition-all group animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <Calendar className="w-10 h-10 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              Schedule Viewing
            </h3>
            <p className="text-sm text-blue-200/70">Book property tours</p>
          </Link>

          <Link
            href="/agent/earnings"
            className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-orange-500/20 transition-all group animate-fade-in-up"
            style={{ animationDelay: '0.9s' }}
          >
            <DollarSign className="w-10 h-10 text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              View Earnings
            </h3>
            <p className="text-sm text-blue-200/70">Track your commissions</p>
          </Link>
        </div>
      </div>
    </div>
  );
}


