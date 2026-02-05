'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/auth-context';
import { tenantsApi, paymentsApi } from '@/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/Toast';
import {
  MessageSquare, Search, Eye, Clock, AlertTriangle, Send,
  Phone, MessageCircle, Globe,
} from 'lucide-react';
import Link from 'next/link';
import { Tenant, Payment } from '@/app/lib/types';
import {
  generateChasingSummary,
  RentChasingSummary,
  OverdueTenant,
  ESCALATION_CONFIG,
  EscalationLevel,
  getEscalationBgClass,
  formatCurrency,
  getWhatsAppLink,
  getSMSLink,
} from '@/app/lib/rent-chasing';

export default function RentChasingPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth('owner');
  const { toasts, removeToast, success, info } = useToast();
  const [summary, setSummary] = useState<RentChasingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [expandedTenant, setExpandedTenant] = useState<number | null>(null);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [tenantsRes, paymentsRes] = await Promise.all([
          tenantsApi.getAll(),
          paymentsApi.getAll(),
        ]);

        const tenants: Tenant[] = Array.isArray(tenantsRes.data) ? tenantsRes.data : [];
        const payments: Payment[] = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];

        const result = generateChasingSummary(tenants, payments);
        setSummary(result);
      } catch (err) {
        console.error('Failed to load rent chasing data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, isAuthenticated]);

  const tenants = summary?.tenants || [];

  const filteredTenants = tenants.filter(t => {
    if (filterLevel !== 'all' && t.escalation !== filterLevel) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        t.tenantName.toLowerCase().includes(search) ||
        t.unitNumber.toLowerCase().includes(search) ||
        t.propertyName.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleCopyMessage = (tenant: OverdueTenant, channel: 'sms' | 'whatsapp') => {
    const msg = language === 'sw'
      ? (channel === 'whatsapp' ? tenant.suggestedMessage.whatsappSwahili : tenant.suggestedMessage.smsSwahili)
      : (channel === 'whatsapp' ? tenant.suggestedMessage.whatsapp : tenant.suggestedMessage.sms);
    navigator.clipboard.writeText(msg);
    success('Message copied to clipboard');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse" />
          <TableSkeleton rows={8} cols={7} />
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
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Auto-Chase Rent</h1>
                <p className="text-gray-600 mt-1">Automated rent reminders and escalation — no awkward calls</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'sw')}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Tenants to Chase</h3>
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{summary?.totalOverdue || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Overdue or upcoming</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Outstanding</h3>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(summary?.totalAmount || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Across all tenants</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Urgent + Final</h3>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {(summary?.byEscalation.urgent || 0) + (summary?.byEscalation.final || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Need immediate action</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Friendly Reminders</h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {(summary?.byEscalation.upcoming || 0) + (summary?.byEscalation.friendly || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Gentle nudges</p>
          </div>
        </div>

        {/* Escalation Pipeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Escalation Pipeline</h3>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(ESCALATION_CONFIG) as EscalationLevel[]).map((level) => (
              <div
                key={level}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ESCALATION_CONFIG[level].color }} />
                <div>
                  <p className="text-xs font-medium text-gray-900">{ESCALATION_CONFIG[level].label}</p>
                  <p className="text-xs text-gray-500">{ESCALATION_CONFIG[level].daysRange}</p>
                </div>
                <span className="text-sm font-bold ml-1" style={{ color: ESCALATION_CONFIG[level].color }}>
                  {summary?.byEscalation[level] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter + Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, unit, or property..."
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
              <option value="final">Final Notice</option>
              <option value="urgent">Urgent</option>
              <option value="firm">Firm Notice</option>
              <option value="friendly">Friendly Reminder</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </div>

        {/* Tenant List */}
        {filteredTenants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tenants.length === 0 ? 'All caught up!' : 'No tenants match the filter'}
            </h3>
            <p className="text-gray-600">
              {tenants.length === 0
                ? 'No overdue or upcoming rent payments found'
                : 'Try adjusting your search or filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTenants.map((tenant) => {
              const isExpanded = expandedTenant === tenant.tenantId;
              const message = tenant.suggestedMessage;
              const displayMsg = language === 'sw'
                ? (message.channel === 'whatsapp' ? message.whatsappSwahili : message.smsSwahili)
                : (message.channel === 'whatsapp' ? message.whatsapp : message.sms);

              return (
                <div key={tenant.tenantId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Main Row */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedTenant(isExpanded ? null : tenant.tenantId)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: ESCALATION_CONFIG[tenant.escalation].color + '20' }}
                      >
                        <span className="font-semibold text-sm" style={{ color: ESCALATION_CONFIG[tenant.escalation].color }}>
                          {tenant.tenantName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tenant.tenantName}</p>
                        <p className="text-sm text-gray-500">
                          {tenant.unitNumber} &middot; {tenant.propertyName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(tenant.totalOverdue)}</p>
                        <p className="text-xs text-gray-500">
                          {tenant.maxDaysOverdue > 0
                            ? `${tenant.maxDaysOverdue} days overdue`
                            : `Due in ${Math.abs(tenant.maxDaysOverdue)} days`}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEscalationBgClass(tenant.escalation)}`}>
                        {ESCALATION_CONFIG[tenant.escalation].label}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Payment Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Overdue Payments</h4>
                          <div className="space-y-2">
                            {tenant.overduePayments.map((p) => (
                              <div key={p.paymentId} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
                                  <p className="text-xs text-gray-500">Due: {new Date(p.dueDate).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-xs font-medium ${p.daysOverdue > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {p.daysOverdue > 0 ? `${p.daysOverdue}d overdue` : `in ${Math.abs(p.daysOverdue)}d`}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Contact Info */}
                          <div className="mt-4 space-y-1">
                            {tenant.tenantPhone && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5" /> {tenant.tenantPhone}
                              </p>
                            )}
                            {tenant.tenantEmail && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <MessageCircle className="w-3.5 h-3.5" /> {tenant.tenantEmail}
                              </p>
                            )}
                          </div>

                          <div className="mt-4">
                            <Link
                              href={`/owner/tenants/${tenant.tenantId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Tenant
                            </Link>
                          </div>
                        </div>

                        {/* Message Preview + Actions */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Suggested Message
                            <span className="text-xs font-normal text-gray-500 ml-2">
                              ({language === 'sw' ? 'Kiswahili' : 'English'})
                            </span>
                          </h4>
                          <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {displayMsg}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {tenant.tenantPhone && (
                              <>
                                <a
                                  href={getWhatsAppLink(
                                    tenant.tenantPhone,
                                    language === 'sw' ? message.whatsappSwahili : message.whatsapp
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  WhatsApp
                                </a>
                                <a
                                  href={getSMSLink(
                                    tenant.tenantPhone,
                                    language === 'sw' ? message.smsSwahili : message.sms
                                  )}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  SMS
                                </a>
                              </>
                            )}
                            <button
                              onClick={() => handleCopyMessage(tenant, 'whatsapp')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Copy Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
