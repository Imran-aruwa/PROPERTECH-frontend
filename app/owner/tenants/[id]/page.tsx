'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/auth-context';
import { tenantsApi, paymentsApi, maintenanceApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import {
  Users, ArrowLeft, Edit, Trash2, Phone, Mail, Home,
  Calendar, DollarSign, FileText, Clock, CheckCircle, AlertCircle, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { Tenant, Payment, MaintenanceRequest } from '@/app/lib/types';
import { calculateTenantRiskScore, TenantRiskScore, RISK_LEVEL_CONFIG, getRiskBgClass } from '@/app/lib/risk-score';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, success, error: showError, removeToast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [riskScore, setRiskScore] = useState<TenantRiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tenantId = params.id as string;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !tenantId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [tenantResponse, paymentsResponse, maintenanceResponse] = await Promise.all([
          tenantsApi.get(tenantId),
          paymentsApi.getAll(),
          maintenanceApi.getAll(),
        ]);

        if (tenantResponse.success && tenantResponse.data) {
          setTenant(tenantResponse.data);
        } else {
          showError('Tenant not found');
          router.push('/owner/tenants');
          return;
        }

        const tenantPayments: Payment[] = [];
        if (paymentsResponse.success && Array.isArray(paymentsResponse.data)) {
          const filtered = paymentsResponse.data.filter(
            (p: Payment) => p.tenant_id === parseInt(tenantId)
          );
          tenantPayments.push(...filtered);
          setPayments(filtered);
        }

        const tenantMaintenance: MaintenanceRequest[] = [];
        if (maintenanceResponse.success && Array.isArray(maintenanceResponse.data)) {
          tenantMaintenance.push(
            ...maintenanceResponse.data.filter(
              (m: MaintenanceRequest) => m.tenant_id === parseInt(tenantId)
            )
          );
        }

        // Calculate risk score
        if (tenantResponse.data) {
          const score = calculateTenantRiskScore(tenantResponse.data, tenantPayments, tenantMaintenance);
          setRiskScore(score);
        }
      } catch (err: any) {
        console.error('Failed to load tenant:', err);
        showError('Failed to load tenant details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated, tenantId, router, showError]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await tenantsApi.delete(tenantId);

      if (!response.success) {
        showError(response.error || 'Failed to delete tenant');
        return;
      }

      success('Tenant deleted successfully');
      router.push('/owner/tenants');
    } catch (err: any) {
      showError(err.message || 'Failed to delete tenant');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getLeaseStatus = () => {
    if (!tenant) return { status: 'unknown', color: 'gray', label: 'Unknown' };
    const endDate = new Date(tenant.lease_end);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'red', label: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'yellow', label: `Expiring in ${daysUntilExpiry} days` };
    }
    return { status: 'active', color: 'green', label: 'Active' };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading tenant details..." />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tenant Not Found</h2>
          <p className="text-gray-600 mb-4">The tenant you're looking for doesn't exist.</p>
          <Link
            href="/owner/tenants"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tenants
          </Link>
        </div>
      </div>
    );
  }

  const tenantUser = (tenant as any).user;
  const leaseStatus = getLeaseStatus();

  const statusColors = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/owner/tenants"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600">
                    {tenantUser?.full_name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{tenantUser?.full_name || 'Unknown Tenant'}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Home className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{tenant.unit?.unit_number || 'No unit assigned'}</span>
                    <span className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${statusColors[leaseStatus.color as keyof typeof statusColors]}`}>
                      {leaseStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/owner/tenants/${tenantId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{tenantUser?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{tenantUser?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {(tenant as any).emergency_contact_name && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{(tenant as any).emergency_contact_name}</p>
                      <p className="text-sm text-gray-600">{(tenant as any).emergency_contact_phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lease Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Lease Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Lease Start</p>
                  <p className="font-medium text-gray-900">{formatDate(tenant.lease_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lease End</p>
                  <p className="font-medium text-gray-900">{formatDate(tenant.lease_end)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="font-bold text-lg text-gray-900">{formatCurrency(tenant.unit?.rent_amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Security Deposit</p>
                  <p className="font-medium text-gray-900">{formatCurrency((tenant as any).deposit_amount || 0)}</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Recent Payments
              </h2>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No payment records found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {payment.payment_status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{payment.payment_type} Payment</p>
                          <p className="text-sm text-gray-600">
                            {payment.payment_date ? formatDate(payment.payment_date) : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(payment.amount ?? 0)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.payment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Unit Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Information</h2>
              {tenant.unit ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Unit Number</span>
                    <span className="font-bold text-gray-900">{tenant.unit.unit_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bedrooms</span>
                    <span className="font-medium text-gray-900">{tenant.unit.bedrooms ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bathrooms</span>
                    <span className="font-medium text-gray-900">{tenant.unit.bathrooms ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Size</span>
                    <span className="font-medium text-gray-900">{(tenant.unit as any).square_feet ?? tenant.unit.size_sqm ?? 0} m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Floor</span>
                    <span className="font-medium text-gray-900">{(tenant.unit as any).floor ?? 0}</span>
                  </div>
                  <Link
                    href={`/owner/units/${tenant.unit.id}`}
                    className="block w-full text-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors mt-4"
                  >
                    View Unit Details
                  </Link>
                </div>
              ) : (
                <p className="text-gray-600">No unit assigned</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(payments.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + (p.amount ?? 0), 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-bold text-yellow-600">
                    {formatCurrency(payments.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + (p.amount ?? 0), 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payments Made</span>
                  <span className="font-medium text-gray-900">{payments.length}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            {riskScore && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  Risk Assessment
                </h2>
                <div className="flex flex-col items-center mb-6">
                  <div
                    className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${RISK_LEVEL_CONFIG[riskScore.level].borderClass}`}
                  >
                    <span className="text-3xl font-bold text-gray-900">{riskScore.score}</span>
                  </div>
                  <span className={`mt-3 px-4 py-1.5 text-sm font-medium rounded-full ${getRiskBgClass(riskScore.level)}`}>
                    {RISK_LEVEL_CONFIG[riskScore.level].label}
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Payment History', value: riskScore.factors.paymentHistory, weight: '40%' },
                    { label: 'Late Payments', value: riskScore.factors.latePayments, weight: '30%' },
                    { label: 'Maintenance', value: riskScore.factors.maintenance, weight: '15%' },
                    { label: 'Lease Duration', value: riskScore.factors.occupancyDuration, weight: '15%' },
                  ].map((factor) => (
                    <div key={factor.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{factor.label}</span>
                        <span className="text-gray-500 text-xs">{factor.value}/100 ({factor.weight})</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${factor.value}%`,
                            backgroundColor: factor.value <= 35 ? '#22C55E' : factor.value <= 65 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FileText className="w-4 h-4" />
                  Generate Invoice
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Renew Lease
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This action cannot be undone and will remove all associated data."
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
