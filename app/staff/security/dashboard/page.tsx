'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Shield, AlertTriangle, Clock, TrendingUp, Loader2, Users } from 'lucide-react';
import { securityApi } from '@/app/lib/api-services';

interface DashboardStats {
  incidentsToday: number;
  onDutyStaff: number;
  hoursLogged: number;
  responseTime: string;
}

interface Incident {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  reportedAt: string;
}

interface StaffOnDuty {
  id: string;
  name: string;
  post: string;
  status: string;
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [staffOnDuty, setStaffOnDuty] = useState<StaffOnDuty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await securityApi.getDashboard();

        if (response.success && response.data) {
          const data = response.data;
          setStats({
            incidentsToday: data.incidents_today || data.incidentsToday || 0,
            onDutyStaff: data.on_duty_staff || data.onDutyStaff || 0,
            hoursLogged: data.hours_logged || data.hoursLogged || 0,
            responseTime: data.response_time || data.responseTime || '-',
          });
          setIncidents(data.recent_incidents || data.recentIncidents || []);
          setStaffOnDuty(data.staff_on_duty || data.staffOnDuty || []);
        } else {
          setStats({
            incidentsToday: 0,
            onDutyStaff: 0,
            hoursLogged: 0,
            responseTime: '-',
          });
          setIncidents([]);
          setStaffOnDuty([]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
        setStats({
          incidentsToday: 0,
          onDutyStaff: 0,
          hoursLogged: 0,
          responseTime: '-',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statsCards = stats ? [
    { title: 'Incidents', label: 'Incidents Today', value: stats.incidentsToday.toString(), change: 'Today', icon: AlertTriangle, trend: "up" as const },
    { title: 'Staff', label: 'On Duty Staff', value: stats.onDutyStaff.toString(), change: 'Active', icon: Shield, trend: "up" as const },
    { title: 'Hours', label: 'Hours Logged', value: stats.hoursLogged.toString(), change: 'Today', icon: Clock, trend: "up" as const },
    { title: 'Response', label: 'Response Time', value: stats.responseTime, change: 'Average', icon: TrendingUp, trend: "up" as const },
  ] : [];

  if (isLoading) {
    return (
      <DashboardLayout role="security">
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
    <DashboardLayout role="security">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage security operations</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing empty state.</p>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatCard key={index} title={stat.title} label={stat.label} value={stat.value} change={stat.change} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Recent Incidents
            </h2>
            {incidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No incidents reported</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={`p-3 border-l-4 rounded ${
                      incident.priority === 'high'
                        ? 'border-red-500 bg-red-50'
                        : incident.priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <p className={`font-medium ${
                      incident.priority === 'high' ? 'text-red-900' :
                      incident.priority === 'medium' ? 'text-yellow-900' : 'text-blue-900'
                    }`}>
                      {incident.title}
                    </p>
                    <p className={`text-sm ${
                      incident.priority === 'high' ? 'text-red-700' :
                      incident.priority === 'medium' ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      {incident.reportedAt} - {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)} Priority
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Staff on Duty
            </h2>
            {staffOnDuty.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No staff currently on duty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {staffOnDuty.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                      <p className="text-xs text-gray-500">{staff.post}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      staff.status === 'active' || staff.status === 'Active'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {staff.status}
                    </span>
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
