'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Loader2, Timer, CheckCircle, Clock, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { maintenanceApi, staffApi } from '@/app/lib/api-services';
import { useAuth } from '@/app/lib/auth-context';
import { MaintenanceRequest, Staff } from '@/app/lib/types';
import {
  calculateStaffPerformance,
  calculateRequestSLA,
  StaffPerformance,
  SLA_TARGETS,
  PERFORMANCE_GRADE_CONFIG,
  getGradeBgClass,
  formatHours,
} from '@/app/lib/maintenance-sla';

export default function CaretakerPerformancePage() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<StaffPerformance | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [maintenanceRes, staffRes] = await Promise.all([
          maintenanceApi.getAll(),
          staffApi.getAll(),
        ]);

        const allRequests: MaintenanceRequest[] = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : [];
        const allStaff: Staff[] = Array.isArray(staffRes.data) ? staffRes.data : [];

        // Find this caretaker's staff record by matching user_id
        const myStaff = allStaff.find(s => s.user_id === user?.id);

        if (myStaff) {
          // Get requests assigned to this staff member
          const myRequests = allRequests.filter(r => r.assigned_to === myStaff.id);
          setRequests(myRequests);

          if (myRequests.length > 0) {
            const perf = calculateStaffPerformance(myStaff, myRequests);
            setPerformance(perf);
          }
        } else {
          // If no staff record found, show all requests (caretaker may manage them all)
          setRequests(allRequests);
        }
      } catch (err) {
        console.error('Failed to load performance data:', err);
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Weekly summary: group completed requests by week
  const weeklySummary = (() => {
    const completed = requests.filter(r => r.status === 'completed' && r.completed_date);
    const now = new Date();
    const weeks: { label: string; count: number; avgResolveHours: number }[] = [];

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekLabel = `${weekStart.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}`;

      const weekRequests = completed.filter(r => {
        const d = new Date(r.completed_date!);
        return d >= weekStart && d < weekEnd;
      });

      let totalHours = 0;
      for (const req of weekRequests) {
        if (req.reported_date && req.completed_date) {
          const diff = (new Date(req.completed_date).getTime() - new Date(req.reported_date).getTime()) / (1000 * 60 * 60);
          totalHours += Math.max(0, diff);
        }
      }

      weeks.push({
        label: weekLabel,
        count: weekRequests.length,
        avgResolveHours: weekRequests.length > 0 ? totalHours / weekRequests.length : 0,
      });
    }

    return weeks;
  })();

  // Recent requests with SLA status
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <DashboardLayout role="caretaker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="caretaker">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Timer className="w-7 h-7 text-blue-600" />
            My Performance
          </h1>
          <p className="text-gray-600 mt-1">Track your maintenance response times and SLA compliance</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">{error}. Showing available data.</p>
          </div>
        )}

        {/* Performance Score Card */}
        {performance ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Score Circle */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div
                  className="w-28 h-28 rounded-full border-4 flex items-center justify-center"
                  style={{ borderColor: PERFORMANCE_GRADE_CONFIG[performance.grade].color }}
                >
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: PERFORMANCE_GRADE_CONFIG[performance.grade].color }}>
                      {performance.score}
                    </p>
                    <p className="text-xs text-gray-500">/ 100</p>
                  </div>
                </div>
                <span className={`mt-2 px-3 py-1 text-sm font-medium rounded-full ${getGradeBgClass(performance.grade)}`}>
                  {PERFORMANCE_GRADE_CONFIG[performance.grade].label}
                </span>
              </div>

              {/* Factor Breakdown */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Acknowledgement</p>
                  <p className="text-xl font-bold text-gray-900">{performance.factors.acknowledgement}</p>
                  <div className="bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${performance.factors.acknowledgement}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Resolution Speed</p>
                  <p className="text-xl font-bold text-gray-900">{performance.factors.resolution}</p>
                  <div className="bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${performance.factors.resolution}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Completion Rate</p>
                  <p className="text-xl font-bold text-gray-900">{performance.factors.completionRate}</p>
                  <div className="bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${performance.factors.completionRate}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Repeat Issues</p>
                  <p className="text-xl font-bold text-gray-900">{performance.factors.repeatIssues}</p>
                  <div className="bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${performance.factors.repeatIssues}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No assignments found yet. Performance scores will appear once maintenance requests are assigned to you.</p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">Total Assigned</h3>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{performance?.totalAssigned || requests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">Completed</h3>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{performance?.completed || requests.filter(r => r.status === 'completed').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">Avg. Response</h3>
              <Timer className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {performance ? formatHours(performance.avgAcknowledgeHours) : '—'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">SLA Compliance</h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className={`text-2xl font-bold ${(performance?.slaComplianceRate || 0) >= 80 ? 'text-green-600' : (performance?.slaComplianceRate || 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {performance?.slaComplianceRate || 0}%
            </p>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Weekly Summary
          </h2>
          {weeklySummary.every(w => w.count === 0) ? (
            <p className="text-gray-500 text-center py-4">No completed requests in the last 4 weeks</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {weeklySummary.map((week, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">{week.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{week.count}</p>
                  <p className="text-xs text-gray-500">completed</p>
                  {week.count > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Avg. resolve: {formatHours(week.avgResolveHours)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests with SLA */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            Recent Requests
          </h2>
          {recentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No maintenance requests found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">SLA Target</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">SLA Met</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentRequests.map((req) => {
                    const sla = calculateRequestSLA(req);
                    const target = SLA_TARGETS[req.priority] || SLA_TARGETS.medium;

                    const statusColors: Record<string, string> = {
                      pending: 'bg-yellow-100 text-yellow-800',
                      in_progress: 'bg-blue-100 text-blue-800',
                      completed: 'bg-green-100 text-green-800',
                      cancelled: 'bg-gray-100 text-gray-800',
                    };

                    const priorityColors: Record<string, string> = {
                      low: 'bg-gray-100 text-gray-800',
                      medium: 'bg-blue-100 text-blue-800',
                      high: 'bg-orange-100 text-orange-800',
                      urgent: 'bg-red-100 text-red-800',
                    };

                    return (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{req.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.unit?.unit_number || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColors[req.priority]}`}>
                            {req.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[req.status]}`}>
                            {req.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {formatHours(target.resolve)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {sla.resolveTimeHours !== null ? formatHours(sla.resolveTimeHours) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {req.status === 'completed' ? (
                            sla.withinSLA ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-xs text-gray-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
