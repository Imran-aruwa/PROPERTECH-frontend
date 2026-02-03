'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { tenantsApi, paymentsApi, maintenanceApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import { Users, Plus, Eye, Phone, Mail, Calendar, Home, Download, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Tenant, Payment, MaintenanceRequest } from '@/app/lib/types';
import { calculateAllTenantRiskScores, TenantRiskScore, getRiskBgClass, RISK_LEVEL_CONFIG } from '@/app/lib/risk-score';

export default function OwnerTenantsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskScores, setRiskScores] = useState<Map<number, TenantRiskScore>>(new Map());

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchTenants = async () => {
      try {
        setLoading(true);
        const [tenantsRes, paymentsRes, maintenanceRes] = await Promise.all([
          tenantsApi.getAll(),
          paymentsApi.getAll(),
          maintenanceApi.getAll(),
        ]);

        const tenantsArray: Tenant[] = Array.isArray(tenantsRes.data) ? tenantsRes.data : [];
        const payments: Payment[] = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
        const maintenance: MaintenanceRequest[] = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : [];

        setTenants(tenantsArray);

        const scores = calculateAllTenantRiskScores(tenantsArray, payments, maintenance);
        const scoreMap = new Map<number, TenantRiskScore>();
        for (const s of scores) {
          scoreMap.set(s.tenantId, s);
        }
        setRiskScores(scoreMap);
      } catch (err: any) {
        console.error('Failed to load tenants:', err);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [authLoading, isAuthenticated]);

  const filteredTenants = tenants.filter(tenant => {
    const searchLower = searchTerm.toLowerCase();
    const tenantUser = (tenant as any).user;
    return (
      tenantUser?.full_name?.toLowerCase().includes(searchLower) ||
      tenantUser?.email?.toLowerCase().includes(searchLower) ||
      tenantUser?.phone?.toLowerCase().includes(searchLower) ||
      tenant.unit?.unit_number?.toLowerCase().includes(searchLower)
    );
  });

  const isLeaseExpiringSoon = (leaseEnd: string) => {
    const endDate = new Date(leaseEnd);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const isLeaseExpired = (leaseEnd: string) => {
    return new Date(leaseEnd) < new Date();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={6} />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
                <p className="text-gray-600 mt-1">Manage all your tenants</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
              <Link
                href="/owner/tenants/new"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Tenant
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Tenants</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Active Leases</h3>
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {tenants.filter(t => !isLeaseExpired(t.lease_end)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Expiring Soon</h3>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {tenants.filter(t => isLeaseExpiringSoon(t.lease_end)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Expired</h3>
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              {tenants.filter(t => isLeaseExpired(t.lease_end)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">High Risk</h3>
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              {Array.from(riskScores.values()).filter(r => r.level === 'high').length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, phone, or unit number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Tenants Table */}
        {filteredTenants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tenants.length === 0 ? 'No tenants yet' : 'No tenants found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {tenants.length === 0 
                ? 'Get started by adding your first tenant'
                : 'No tenants match your search criteria'}
            </p>
            {tenants.length === 0 && (
              <Link
                href="/owner/tenants/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-5 h-5" />
                Add Your First Tenant
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lease Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTenants.map((tenant) => {
                    const tenantUser = (tenant as any).user;
                    const leaseStatus = isLeaseExpired(tenant.lease_end) 
                      ? 'expired' 
                      : isLeaseExpiringSoon(tenant.lease_end) 
                      ? 'expiring' 
                      : 'active';

                    const statusColors = {
                      active: 'bg-green-100 text-green-800',
                      expiring: 'bg-orange-100 text-orange-800',
                      expired: 'bg-red-100 text-red-800'
                    };

                    return (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-semibold">
                                {tenantUser?.full_name?.charAt(0) || 'T'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">
                                {tenantUser?.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {tenant.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {tenantUser?.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {tenantUser?.phone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {tenant.unit?.unit_number || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {new Date(tenant.lease_start).toLocaleDateString()}
                            </div>
                            <div className="text-gray-500">
                              to {new Date(tenant.lease_end).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[leaseStatus]}`}>
                            {leaseStatus === 'active' && 'Active'}
                            {leaseStatus === 'expiring' && 'Expiring Soon'}
                            {leaseStatus === 'expired' && 'Expired'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {riskScores.has(tenant.id) ? (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskBgClass(riskScores.get(tenant.id)!.level)}`}>
                              {RISK_LEVEL_CONFIG[riskScores.get(tenant.id)!.level].label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/owner/tenants/${tenant.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
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