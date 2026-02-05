'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { tenantsApi, paymentsApi, maintenanceApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { AlertTriangle, Users, Eye, Search } from 'lucide-react';
import Link from 'next/link';
import { Tenant, Payment, MaintenanceRequest } from '@/app/lib/types';
import {
  predictAllVacancies,
  VacancyAlert,
  VACANCY_RISK_CONFIG,
  getVacancyBgClass,
} from '@/app/lib/vacancy-prediction';

export default function VacancyAlertsPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, removeToast } = useToast();
  const [alerts, setAlerts] = useState<VacancyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [tenantsRes, paymentsRes, maintenanceRes] = await Promise.all([
          tenantsApi.getAll(),
          paymentsApi.getAll(),
          maintenanceApi.getAll(),
        ]);

        const tenants: Tenant[] = Array.isArray(tenantsRes.data) ? tenantsRes.data : [];
        const payments: Payment[] = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
        const maintenance: MaintenanceRequest[] = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : [];

        const predictions = predictAllVacancies(tenants, payments, maintenance);
        setAlerts(predictions);
      } catch (err) {
        console.error('Failed to load vacancy predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated]);

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel !== 'all' && a.risk !== filterLevel) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const tenantUser = (a.tenant as any).user;
      return (
        tenantUser?.full_name?.toLowerCase().includes(search) ||
        tenantUser?.email?.toLowerCase().includes(search) ||
        a.unitNumber?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalCount = alerts.length;
  const criticalCount = alerts.filter(a => a.risk === 'critical').length;
  const highCount = alerts.filter(a => a.risk === 'high').length;
  const mediumCount = alerts.filter(a => a.risk === 'medium').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Predictive Vacancy Alerts</h1>
              <p className="text-gray-600 mt-1">Predict which units are likely to become vacant based on tenant behavior</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Monitored</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Critical</h3>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: VACANCY_RISK_CONFIG.critical.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: VACANCY_RISK_CONFIG.critical.color }}>{criticalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">High Risk</h3>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: VACANCY_RISK_CONFIG.high.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: VACANCY_RISK_CONFIG.high.color }}>{highCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Medium Risk</h3>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: VACANCY_RISK_CONFIG.medium.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: VACANCY_RISK_CONFIG.medium.color }}>{mediumCount}</p>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-600">
              {alerts.length === 0
                ? 'Add tenants to start seeing vacancy predictions'
                : 'No tenants match the current filter'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vacancy Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lease End</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Late %</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Maint.</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => {
                    const tenantUser = (alert.tenant as any).user;
                    const riskColor = VACANCY_RISK_CONFIG[alert.risk].color;

                    return (
                      <tr key={alert.tenantId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {alert.unitNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">
                                {tenantUser?.full_name?.charAt(0) || 'T'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900 text-sm">{tenantUser?.full_name || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {alert.propertyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {alert.estimatedDays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${alert.score}%`, backgroundColor: riskColor }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-8">{alert.score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getVacancyBgClass(alert.risk)}`}>
                            {VACANCY_RISK_CONFIG[alert.risk].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {alert.factors.leaseEndProximity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {alert.factors.lateRentPattern}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                          {alert.factors.maintenanceFrequency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/owner/tenants/${alert.tenantId}`}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
