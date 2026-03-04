'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { tenantsApi, paymentsApi, maintenanceApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { ShieldAlert, Users, Eye, Search } from 'lucide-react';
import Link from 'next/link';
import { Tenant, Payment, MaintenanceRequest } from '@/app/lib/types';
import {
  calculateAllTenantRiskScores,
  TenantRiskScore,
  RISK_LEVEL_CONFIG,
  getRiskBgClass,
} from '@/app/lib/risk-score';

export default function RiskScoresPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, removeToast } = useToast();
  const [riskScores, setRiskScores] = useState<TenantRiskScore[]>([]);
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

        const scores = calculateAllTenantRiskScores(tenants, payments, maintenance);
        setRiskScores(scores);
      } catch (err) {
        console.error('Failed to load risk scores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated]);

  const filteredScores = riskScores.filter(rs => {
    if (filterLevel !== 'all' && rs.level !== filterLevel) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const tenantUser = (rs.tenant as any).user;
      return (
        tenantUser?.full_name?.toLowerCase().includes(search) ||
        tenantUser?.email?.toLowerCase().includes(search) ||
        rs.tenant.unit?.unit_number?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const lowCount = riskScores.filter(r => r.level === 'low').length;
  const mediumCount = riskScores.filter(r => r.level === 'medium').length;
  const highCount = riskScores.filter(r => r.level === 'high').length;

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
            <ShieldAlert className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-tx-primary">Tenant Risk Scores</h1>
              <p className="text-tx-secondary mt-1">Assess tenant reliability based on payment, maintenance, and lease data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Total Scored</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-tx-primary">{riskScores.length}</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Low Risk</h3>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_LEVEL_CONFIG.low.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: RISK_LEVEL_CONFIG.low.color }}>{lowCount}</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">Medium Risk</h3>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_LEVEL_CONFIG.medium.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: RISK_LEVEL_CONFIG.medium.color }}>{mediumCount}</p>
          </div>
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-tx-secondary text-sm font-medium">High Risk</h3>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_LEVEL_CONFIG.high.color }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: RISK_LEVEL_CONFIG.high.color }}>{highCount}</p>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tx-muted" />
              <input
                type="text"
                placeholder="Search by name, email, or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border border-bd-strong rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-bg-card"
            >
              <option value="all">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredScores.length === 0 ? (
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd p-12 text-center">
            <ShieldAlert className="w-16 h-16 text-tx-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-tx-primary mb-2">No tenants found</h3>
            <p className="text-tx-secondary">
              {riskScores.length === 0
                ? 'Add tenants to start seeing risk scores'
                : 'No tenants match the current filter'}
            </p>
          </div>
        ) : (
          <div className="bg-bg-card rounded-lg shadow-sm border border-bd overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-bd">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Risk Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-tx-muted uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Late</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Maint.</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-tx-muted uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-tx-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd">
                  {filteredScores.map((rs) => {
                    const tenantUser = (rs.tenant as any).user;
                    const riskColor = RISK_LEVEL_CONFIG[rs.level].color;

                    return (
                      <tr key={rs.tenantId} className="hover:bg-bg-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">
                                {tenantUser?.full_name?.charAt(0) || 'T'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-tx-primary text-sm">{tenantUser?.full_name || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tx-primary">
                          {rs.tenant.unit?.unit_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-tx-muted">
                          {rs.tenant.unit?.property?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-bd rounded-full h-2 w-24">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ width: `${rs.score}%`, backgroundColor: riskColor }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-tx-primary w-8">{rs.score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskBgClass(rs.level)}`}>
                            {RISK_LEVEL_CONFIG[rs.level].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-secondary">{rs.factors.paymentHistory}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-secondary">{rs.factors.latePayments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-secondary">{rs.factors.maintenance}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-tx-secondary">{rs.factors.occupancyDuration}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/owner/tenants/${rs.tenantId}`}
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
