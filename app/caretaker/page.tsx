'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { maintenanceApi, propertiesApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import {
  Home,
  Wrench,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function CaretakerDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('caretaker');
  const { toasts, error: showError, removeToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [propertiesData, maintenanceData] = await Promise.all([
        propertiesApi.getAll(),
        maintenanceApi.getAll(),
      ]);

      setProperties(propertiesData.data || []);
      setMaintenanceRequests(
        (maintenanceData.data || []).filter(
          (m: any) => m.status !== 'completed',
        ),
      );

      // Mock daily tasks
      setDailyTasks([
        {
          id: 1,
          task: 'Morning property inspection',
          property: 'Sunset Apartments',
          status: 'pending',
        },
        {
          id: 2,
          task: 'Check water supply',
          property: 'Palm Gardens',
          status: 'completed',
        },
        {
          id: 3,
          task: 'Collect garbage bins',
          property: 'Sunset Apartments',
          status: 'pending',
        },
      ]);
    } catch (err: any) {
      showError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, fetchDashboardData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-300">Loading caretaker dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Properties Managed',
      value: properties.length,
      icon: Home,
      color: 'from-blue-500 to-cyan-500',
      link: '/caretaker/properties',
    },
    {
      title: 'Active Requests',
      value: maintenanceRequests.length,
      icon: Wrench,
      color: 'from-orange-500 to-red-500',
      link: '/caretaker/maintenance',
    },
    {
      title: 'Completed Today',
      value: dailyTasks.filter((t) => t.status === 'completed').length,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      link: '/caretaker/tasks',
    },
    {
      title: 'Pending Tasks',
      value: dailyTasks.filter((t) => t.status === 'pending').length,
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      link: '/caretaker/tasks',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 opacity-90" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse" />
      </div>

      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-blue-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {user?.full_name || 'Caretaker'}
              </span>!
            </h1>
            <p className="text-blue-300">Property Caretaker Dashboard</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Link
              key={index}
              href={stat.link}
              className="group bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-500/20 transition-all animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-blue-200 text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-4xl font-bold text-white">{stat.value}</p>
            </Link>
          ))}
        </div>

        {/* Today's Tasks */}
        <div
          className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              Today&apos;s Tasks
            </h2>
            <Link
              href="/caretaker/tasks"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {dailyTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
              <p className="text-blue-200">
                All tasks completed! Great work! 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                        {task.task}
                      </h3>
                      <p className="text-sm text-blue-300/70 mt-1">
                        {task.property}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        task.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {task.status === 'completed' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Maintenance Requests */}
        <div
          className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-400" />
              Active Requests
            </h2>
            <Link
              href="/caretaker/maintenance"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {maintenanceRequests.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
              <p className="text-blue-200">
                No active maintenance requests
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {maintenanceRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-4 hover:border-blue-400/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                      {request.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.priority === 'urgent'
                          ? 'bg-red-500/20 text-red-400'
                          : request.priority === 'high'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {request.priority}
                    </span>
                  </div>
                  <p className="text-sm text-blue-200/70 line-clamp-2 mb-2">
                    {request.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-300/70">
                      Unit: {request.unit?.unit_number}
                    </span>
                    <span
                      className={`px-2 py-1 rounded ${
                        request.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/caretaker/maintenance"
            className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-orange-500/20 transition-all group animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            <Wrench className="w-10 h-10 text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              Report Issue
            </h3>
            <p className="text-sm text-blue-200/70">
              Submit maintenance requests
            </p>
          </Link>

          <Link
            href="/caretaker/tasks"
            className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-purple-500/20 transition-all group animate-fade-in-up"
            style={{ animationDelay: '0.7s' }}
          >
            <Clock className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              Daily Tasks
            </h3>
            <p className="text-sm text-blue-200/70">
              View and complete tasks
            </p>
          </Link>

          <Link
            href="/caretaker/properties"
            className="bg-slate-800/50 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-500/20 transition-all group animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <Home className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
              My Properties
            </h3>
            <p className="text-sm text-blue-200/70">
              View assigned properties
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}