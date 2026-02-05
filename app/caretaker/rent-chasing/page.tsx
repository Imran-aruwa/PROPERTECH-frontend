'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Loader2, MessageSquare, Send, Phone, AlertTriangle,
  CheckCircle, Clock, Globe, MessageCircle,
} from 'lucide-react';
import { tenantsApi, paymentsApi } from '@/app/lib/api-services';
import { useToast } from '@/app/lib/hooks';
import { ToastContainer } from '@/components/ui/Toast';
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

export default function CaretakerRentChasingPage() {
  const { toasts, removeToast, success } = useToast();
  const [summary, setSummary] = useState<RentChasingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [sentReminders, setSentReminders] = useState<Set<number>>(new Set());
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
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
  }, []);

  const tenants = summary?.tenants || [];

  const filteredTenants = filterLevel === 'all'
    ? tenants
    : tenants.filter(t => t.escalation === filterLevel);

  const markAsSent = (tenantId: number) => {
    setSentReminders(prev => new Set([...prev, tenantId]));
    success('Marked as sent');
  };

  if (loading) {
    return (
      <DashboardLayout role="caretaker">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading rent alerts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="caretaker">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-blue-600" />
              Rent Chasing Alerts
            </h1>
            <p className="text-gray-600 mt-1">Send reminders to tenants with overdue rent</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">To Chase</h3>
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalOverdue || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">Outstanding</h3>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalAmount || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">Urgent</h3>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {(summary?.byEscalation.urgent || 0) + (summary?.byEscalation.final || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs text-gray-500 font-medium">Sent Today</h3>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{sentReminders.size}</p>
          </div>
        </div>

        {/* Level Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterLevel('all')}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filterLevel === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({tenants.length})
          </button>
          {(Object.keys(ESCALATION_CONFIG) as EscalationLevel[]).map((level) => {
            const count = tenants.filter(t => t.escalation === level).length;
            if (count === 0) return null;
            return (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  filterLevel === level ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ESCALATION_CONFIG[level].color }} />
                {ESCALATION_CONFIG[level].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Tenant Alert Cards */}
        {filteredTenants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">All clear!</h3>
            <p className="text-gray-600">No overdue rent payments to follow up on</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTenants.map((tenant) => {
              const wasSent = sentReminders.has(tenant.tenantId);
              const msg = tenant.suggestedMessage;
              const smsText = language === 'sw' ? msg.smsSwahili : msg.sms;
              const waText = language === 'sw' ? msg.whatsappSwahili : msg.whatsapp;

              return (
                <div
                  key={tenant.tenantId}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${wasSent ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Tenant Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: ESCALATION_CONFIG[tenant.escalation].color + '20' }}
                      >
                        <span className="font-semibold text-sm" style={{ color: ESCALATION_CONFIG[tenant.escalation].color }}>
                          {tenant.tenantName.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{tenant.tenantName}</p>
                        <p className="text-sm text-gray-500">
                          {tenant.unitNumber} &middot; {formatCurrency(tenant.totalOverdue)}
                          {' '}&middot;{' '}
                          <span className={tenant.maxDaysOverdue > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {tenant.maxDaysOverdue > 0 ? `${tenant.maxDaysOverdue}d overdue` : `due in ${Math.abs(tenant.maxDaysOverdue)}d`}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getEscalationBgClass(tenant.escalation)}`}>
                        {ESCALATION_CONFIG[tenant.escalation].label}
                      </span>

                      {tenant.tenantPhone && !wasSent && (
                        <>
                          <a
                            href={getWhatsAppLink(tenant.tenantPhone, waText)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markAsSent(tenant.tenantId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                          <a
                            href={getSMSLink(tenant.tenantPhone, smsText)}
                            onClick={() => markAsSent(tenant.tenantId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">SMS</span>
                          </a>
                        </>
                      )}

                      {wasSent && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 bg-green-50 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Sent
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Preview (compact) */}
                  {!wasSent && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 line-clamp-2">
                      {language === 'sw' ? msg.smsSwahili : msg.sms}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reminder Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Reminder Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>&bull; <strong>Upcoming (due in 3 days):</strong> Send a gentle SMS reminder</li>
            <li>&bull; <strong>Friendly (1-3 days):</strong> Send a polite follow-up via SMS</li>
            <li>&bull; <strong>Firm (4-7 days):</strong> Send a WhatsApp message with payment arrangement offer</li>
            <li>&bull; <strong>Urgent (8-14 days):</strong> Send urgent WhatsApp + notify property owner</li>
            <li>&bull; <strong>Final (15+ days):</strong> Final notice — escalate to management immediately</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
