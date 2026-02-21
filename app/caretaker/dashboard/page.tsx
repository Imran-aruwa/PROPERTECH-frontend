'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { DollarSign, Clock, Wrench, Users, Loader2, CheckSquare } from 'lucide-react';
import { caretakerApi } from '@/app/lib/api-services';

interface DashboardStats {
  rentCollected: number;
  pendingPayments: number;
  maintenanceRequests: number;
  totalTenants: number;
}

interface Task {
  id: string;
  description: string;
  completed: boolean;
  priority: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  reportedAt: string;
  priority: 'high' | 'medium' | 'low';
}

export default function CaretakerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await caretakerApi.getDashboard();

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            rentCollected: data.rent_collected || data.rentCollected || 0,
            pendingPayments: data.pending_payments || data.pendingPayments || 0,
            maintenanceRequests: data.maintenance_requests || data.maintenanceRequests || 0,
            totalTenants: data.total_tenants || data.totalTenants || 0,
          });
          setTasks(data.tasks || data.today_tasks || []);
          setIssues(data.issues || data.urgent_issues || []);
        } else {
          setStats({
            rentCollected: 0,
            pendingPayments: 0,
            maintenanceRequests: 0,
            totalTenants: 0,
          });
          setTasks([]);
          setIssues([]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
        setStats({
          rentCollected: 0,
          pendingPayments: 0,
          maintenanceRequests: 0,
          totalTenants: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(0)}K`;
    return `KES ${amount.toLocaleString()}`;
  };

  const statsCards = stats ? [
    {
      title: 'Rent Collected',
      label: 'This month',
      value: formatCurrency(stats.rentCollected),
      icon: DollarSign,
      trend: "up" as const,
    },
    {
      title: 'Pending Payments',
      label: 'Awaiting',
      value: stats.pendingPayments.toString(),
      icon: Clock,
      trend: "up" as const,
    },
    {
      title: 'Maintenance Requests',
      label: 'Open tickets',
      value: stats.maintenanceRequests.toString(),
      icon: Wrench,
      trend: "up" as const,
    },
    {
      title: 'Total Tenants',
      label: 'Active tenants',
      value: stats.totalTenants.toString(),
      icon: Users,
      trend: "up" as const,
    },
  ] : [];

  if (isLoading) {
    return (
      <DashboardLayout role="caretaker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage daily property operations</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              Today's Tasks
            </h2>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No tasks for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                    <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-red-600" />
              Urgent Issues
            </h2>
            {issues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No urgent issues</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 border-l-4 rounded ${
                      issue.priority === 'high'
                        ? 'border-red-500 bg-red-50'
                        : 'border-orange-500 bg-orange-50'
                    }`}
                  >
                    <p className={`font-medium ${
                      issue.priority === 'high' ? 'text-red-900' : 'text-orange-900'
                    }`}>
                      {issue.title}
                    </p>
                    <p className={`text-sm ${
                      issue.priority === 'high' ? 'text-red-700' : 'text-orange-700'
                    }`}>
                      {issue.reportedAt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
