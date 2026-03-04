'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { maintenanceApi, staffApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { Timer, Users, Search, Eye, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { MaintenanceRequest, Staff } from '@/app/lib/types';
import {
  calculateSLASummary,
  SLASummary,
  StaffPerformance,
  PERFORMANCE_GRADE_CONFIG,
  getGradeBgClass,
  formatHours,
} from '@/app/lib/maintenance-sla';

export default function MaintenanceSLAPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, removeToast } = useToast();
  const [summary, setSummary] = useState<SLASummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [maintenanceRes, staffRes] = await Promise.all([
          maintenanceApi.getAll(),
          staffApi.getAll(),
        ]);

        const requests: MaintenanceRequest[] = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : [];
        const staffList: Staff[] = Array.isArray(staffRes.data) ? staffRes.data : [];

        const slaSummary = calculateSLASummary(staffList, requests);
        setSummary(slaSummary);
      } catch (err) {
        console.error('Failed to load SLA data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated]);

  const performances = summary?.staffPerformances || [];

  const filteredPerformances = performances.filter(p => {
    if (filterGrade !== 'all' && p.grade !== filterGrade) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        p.staffName.toLowerCase().includes(search) ||
        p.department.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const excellentCount = performances.filter(p => p.grade === 'excellent').length;
  const goodCount = performances.filter(p => p.grade === 'good').length;
  const fairCount = performances.filter(p => p.grade === 'fair').length;
  const poorCount = performances.filter(p => p.grade === 'poor').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-secondary p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-bd rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Timer className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-tx-primary">Maintenance SLA Tracking</h1>
              <p className="text-tx-secondary mt-1">Track staff performance, response times, and SLA compliance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall SLA Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Total Requests</h3>
              <Clock className="w-5 h-5 text-tx-muted" />
            </div>
            <p className="text-3xl font-bold text-tx-primary">{summary?.totalRequests || 0}</p>
            <p className="text-xs text-tx-muted mt-1">{summary?.completedRequests || 0} completed</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Avg. Acknowledge</h3>
              <Timer className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {summary ? formatHours(summary.avgAcknowledgeHours) : '—'}
            </p>
            <p className="text-xs text-tx-muted mt-1">Time to first response</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Avg. Resolution</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {summary ? formatHours(summary.avgResolveHours) : '—'}
            </p>
            <p className="text-xs text-tx-muted mt-1">Time to completion</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">SLA Compliance</h3>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold" style={{ color: (summary?.overallSLACompliance || 0) >= 80 ? '#22C55E' : (summary?.overallSLACompliance || 0) >= 50 ? '#F59E0B' : '#EF4444' }}>
              {summary?.overallSLACompliance || 0}%
            </p>
            <p className="text-xs text-tx-muted mt-1">Resolved within target</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Staff Tracked</h3>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{performances.length}</p>
            <p className="text-xs text-tx-muted mt-1">With assignments</p>
          </div>
        </div>

        {/* Grade Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_GRADE_CONFIG.excellent.color }} />
            <div>
              <p className="text-sm text-tx-secondary">Excellent</p>
              <p className="text-xl font-bold" style={{ color: PERFORMANCE_GRADE_CONFIG.excellent.color }}>{excellentCount}</p>
            </div>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_GRADE_CONFIG.good.color }} />
            <div>
              <p className="text-sm text-tx-secondary">Good</p>
              <p className="text-xl font-bold" style={{ color: PERFORMANCE_GRADE_CONFIG.good.color }}>{goodCount}</p>
            </div>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_GRADE_CONFIG.fair.color }} />
            <div>
              <p className="text-sm text-tx-secondary">Fair</p>
              <p className="text-xl font-bold" style={{ color: PERFORMANCE_GRADE_CONFIG.fair.color }}>{fairCount}</p>
            </div>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_GRADE_CONFIG.poor.color }} />
            <div>
              <p className="text-sm text-tx-secondary">Poor</p>
              <p className="text-xl font-bold" style={{ color: PERFORMANCE_GRADE_CONFIG.poor.color }}>{poorCount}</p>
            </div>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tx-muted" />
              <input
                type="text"
                placeholder="Search by name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-bg-card"
            >
              <option value="all">All Grades</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        {/* Staff Performance Table */}
        {filteredPerformances.length === 0 ? (
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-12 text-center">
            <Timer className="w-16 h-16 text-tx-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tx-primary mb-2">No staff performance data</h3>
            <p className="text-tx-secondary">
              {performances.length === 0
                ? 'Assign staff to maintenance requests to start tracking SLA performance'
                : 'No staff match the current filter'}
            </p>
          </div>
        ) : (
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-bd">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Assigned</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Avg. Ack.</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Avg. Resolve</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">SLA %</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Repeats</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-tx-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd">
                  {filteredPerformances.map((perf) => {
                    const gradeColor = PERFORMANCE_GRADE_CONFIG[perf.grade].color;

                    return (
                      <tr key={perf.staffId} className="hover:bg-bg-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {perf.staffName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-tx-primary text-sm">{perf.staffName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-bg-secondary text-tx-secondary capitalize">
                            {perf.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-bd rounded-full h-2 w-24">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${perf.score}%`, backgroundColor: gradeColor }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-tx-primary w-8">{perf.score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getGradeBgClass(perf.grade)}`}>
                            {PERFORMANCE_GRADE_CONFIG[perf.grade].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-primary font-medium">
                          {perf.totalAssigned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                          {perf.completed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-secondary">
                          {formatHours(perf.avgAcknowledgeHours)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-secondary">
                          {formatHours(perf.avgResolveHours)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-sm font-semibold ${perf.slaComplianceRate >= 80 ? 'text-green-600' : perf.slaComplianceRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {perf.slaComplianceRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-secondary">
                          {perf.repeatIssueCount > 0 ? (
                            <span className="text-amber-600 font-medium">{perf.repeatIssueCount}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/owner/staff/${perf.staffId}`}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
