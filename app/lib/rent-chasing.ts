import { Payment, Tenant } from './types';

// ==================== TYPES ====================

export type EscalationLevel = 'upcoming' | 'friendly' | 'firm' | 'urgent' | 'final';
export type MessageChannel = 'sms' | 'whatsapp' | 'email';

export interface OverdueTenant {
  tenantId: number;
  tenant: Tenant;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  unitNumber: string;
  propertyName: string;
  overduePayments: OverduePayment[];
  totalOverdue: number;
  maxDaysOverdue: number;
  escalation: EscalationLevel;
  suggestedMessage: MessageTemplate;
}

export interface OverduePayment {
  paymentId: number;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  paymentType: string;
}

export interface MessageTemplate {
  subject: string;
  sms: string;
  whatsapp: string;
  smsSwahili: string;
  whatsappSwahili: string;
  channel: MessageChannel;
  escalation: EscalationLevel;
}

export interface RentChasingSummary {
  totalOverdue: number;
  totalAmount: number;
  byEscalation: Record<EscalationLevel, number>;
  tenants: OverdueTenant[];
}

// ==================== CONSTANTS ====================

export const ESCALATION_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    color: '#6B7280',
    bgClass: 'bg-gray-100 text-gray-800',
    daysRange: 'Due in 3 days',
    icon: 'clock',
  },
  friendly: {
    label: 'Friendly Reminder',
    color: '#3B82F6',
    bgClass: 'bg-blue-100 text-blue-800',
    daysRange: '1-3 days overdue',
    icon: 'message',
  },
  firm: {
    label: 'Firm Notice',
    color: '#F59E0B',
    bgClass: 'bg-amber-100 text-amber-800',
    daysRange: '4-7 days overdue',
    icon: 'alert',
  },
  urgent: {
    label: 'Urgent',
    color: '#F97316',
    bgClass: 'bg-orange-100 text-orange-800',
    daysRange: '8-14 days overdue',
    icon: 'warning',
  },
  final: {
    label: 'Final Notice',
    color: '#EF4444',
    bgClass: 'bg-red-100 text-red-800',
    daysRange: '15+ days overdue',
    icon: 'alert-triangle',
  },
} as const;

/** Escalation thresholds in days overdue */
export const ESCALATION_THRESHOLDS = {
  upcoming: -3,   // 3 days before due
  friendly: 1,    // 1-3 days overdue
  firm: 4,        // 4-7 days overdue
  urgent: 8,      // 8-14 days overdue
  final: 15,      // 15+ days overdue
} as const;

// ==================== HELPERS ====================

export function getEscalationLevel(daysOverdue: number): EscalationLevel {
  if (daysOverdue < 1) return 'upcoming';
  if (daysOverdue <= 3) return 'friendly';
  if (daysOverdue <= 7) return 'firm';
  if (daysOverdue <= 14) return 'urgent';
  return 'final';
}

export function getEscalationColor(level: EscalationLevel): string {
  return ESCALATION_CONFIG[level].color;
}

export function getEscalationBgClass(level: EscalationLevel): string {
  return ESCALATION_CONFIG[level].bgClass;
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return 0;
  const now = new Date();
  // Reset time portion for accurate day calculation
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}

// ==================== MESSAGE TEMPLATES ====================

function generateMessage(
  tenantName: string,
  amount: number,
  daysOverdue: number,
  unitNumber: string,
  escalation: EscalationLevel
): MessageTemplate {
  const firstName = tenantName.split(' ')[0] || 'Tenant';
  const amountStr = formatCurrency(amount);

  switch (escalation) {
    case 'upcoming':
      return {
        subject: 'Rent Payment Reminder',
        escalation,
        channel: 'sms',
        sms: `Hi ${firstName}, this is a friendly reminder that your rent of ${amountStr} for unit ${unitNumber} is due in ${Math.abs(daysOverdue)} day(s). Please ensure timely payment. Thank you!`,
        whatsapp: `Hi ${firstName} 👋\n\nThis is a friendly reminder that your rent of *${amountStr}* for unit *${unitNumber}* is due in *${Math.abs(daysOverdue)} day(s)*.\n\nPlease ensure timely payment to avoid any inconvenience.\n\nThank you! 🙏`,
        smsSwahili: `Habari ${firstName}, hii ni kukumbushwa kwamba kodi yako ya ${amountStr} ya nyumba ${unitNumber} inapaswa kulipwa ndani ya siku ${Math.abs(daysOverdue)}. Tafadhali hakikisha malipo kwa wakati. Asante!`,
        whatsappSwahili: `Habari ${firstName} 👋\n\nHii ni kukumbushwa kwamba kodi yako ya *${amountStr}* ya nyumba *${unitNumber}* inapaswa kulipwa ndani ya *siku ${Math.abs(daysOverdue)}*.\n\nTafadhali hakikisha malipo kwa wakati.\n\nAsante! 🙏`,
      };

    case 'friendly':
      return {
        subject: 'Rent Payment Overdue - Friendly Reminder',
        escalation,
        channel: 'sms',
        sms: `Hi ${firstName}, we noticed your rent of ${amountStr} for unit ${unitNumber} is ${daysOverdue} day(s) overdue. Kindly make the payment at your earliest convenience. If already paid, please disregard. Thank you.`,
        whatsapp: `Hi ${firstName} 👋\n\nWe noticed your rent payment of *${amountStr}* for unit *${unitNumber}* is *${daysOverdue} day(s) overdue*.\n\nKindly make the payment at your earliest convenience. If you've already paid, please disregard this message.\n\nThank you 🙏`,
        smsSwahili: `Habari ${firstName}, tumeona kodi yako ya ${amountStr} ya nyumba ${unitNumber} imechelewa kwa siku ${daysOverdue}. Tafadhali fanya malipo haraka iwezekanavyo. Ikiwa tayari umelipa, tafadhali puuza ujumbe huu. Asante.`,
        whatsappSwahili: `Habari ${firstName} 👋\n\nTumeona malipo ya kodi yako ya *${amountStr}* ya nyumba *${unitNumber}* yamechelewa kwa *siku ${daysOverdue}*.\n\nTafadhali fanya malipo haraka iwezekanavyo. Ikiwa tayari umelipa, puuza ujumbe huu.\n\nAsante 🙏`,
      };

    case 'firm':
      return {
        subject: 'Rent Payment Overdue - Second Notice',
        escalation,
        channel: 'whatsapp',
        sms: `Dear ${firstName}, your rent of ${amountStr} for unit ${unitNumber} is now ${daysOverdue} days overdue. This is a second reminder. Please settle the outstanding amount immediately to avoid further action. Contact us if you need to discuss a payment arrangement.`,
        whatsapp: `Dear ${firstName},\n\nYour rent payment of *${amountStr}* for unit *${unitNumber}* is now *${daysOverdue} days overdue*.\n\nThis is a second reminder. Please settle the outstanding amount immediately to avoid further action.\n\nIf you're experiencing difficulties, please contact us to discuss a payment arrangement.\n\nRegards,\nProperty Management`,
        smsSwahili: `Mpendwa ${firstName}, kodi yako ya ${amountStr} ya nyumba ${unitNumber} sasa imechelewa kwa siku ${daysOverdue}. Hii ni ilani ya pili. Tafadhali lipa kiasi kilichobaki mara moja ili kuepuka hatua zaidi. Wasiliana nasi ikiwa unahitaji kujadili mpango wa malipo.`,
        whatsappSwahili: `Mpendwa ${firstName},\n\nMalipo ya kodi yako ya *${amountStr}* ya nyumba *${unitNumber}* sasa yamechelewa kwa *siku ${daysOverdue}*.\n\nHii ni ilani ya pili. Tafadhali lipa kiasi kilichobaki mara moja ili kuepuka hatua zaidi.\n\nIkiwa una changamoto, tafadhali wasiliana nasi kujadili mpango wa malipo.\n\nHeshima,\nUsimamizi wa Mali`,
      };

    case 'urgent':
      return {
        subject: 'Urgent: Rent Payment Seriously Overdue',
        escalation,
        channel: 'whatsapp',
        sms: `URGENT: ${firstName}, your rent of ${amountStr} for unit ${unitNumber} is ${daysOverdue} days overdue. Immediate payment is required. Failure to pay may result in formal action. Please contact the property office urgently.`,
        whatsapp: `⚠️ *URGENT NOTICE*\n\nDear ${firstName},\n\nYour rent payment of *${amountStr}* for unit *${unitNumber}* is now *${daysOverdue} days overdue*.\n\n*Immediate payment is required.* Continued non-payment may result in formal action as per your lease agreement.\n\nPlease contact the property office urgently to resolve this matter.\n\nRegards,\nProperty Management`,
        smsSwahili: `HARAKA: ${firstName}, kodi yako ya ${amountStr} ya nyumba ${unitNumber} imechelewa kwa siku ${daysOverdue}. Malipo ya haraka yanahitajika. Kutolipa kunaweza kusababisha hatua rasmi. Tafadhali wasiliana na ofisi ya mali haraka.`,
        whatsappSwahili: `⚠️ *ILANI YA HARAKA*\n\nMpendwa ${firstName},\n\nMalipo ya kodi yako ya *${amountStr}* ya nyumba *${unitNumber}* sasa yamechelewa kwa *siku ${daysOverdue}*.\n\n*Malipo ya haraka yanahitajika.* Kuendelea kutolipa kunaweza kusababisha hatua rasmi kwa mujibu wa mkataba wako.\n\nTafadhali wasiliana na ofisi ya mali haraka.\n\nHeshima,\nUsimamizi wa Mali`,
      };

    case 'final':
      return {
        subject: 'Final Notice: Rent Payment Required',
        escalation,
        channel: 'whatsapp',
        sms: `FINAL NOTICE: ${firstName}, your rent of ${amountStr} for unit ${unitNumber} is ${daysOverdue} days overdue. This is the final notice before formal proceedings begin. Please pay immediately or contact management today.`,
        whatsapp: `🔴 *FINAL NOTICE*\n\nDear ${firstName},\n\nYour rent payment of *${amountStr}* for unit *${unitNumber}* is now *${daysOverdue} days overdue*.\n\n*This is the final notice before formal proceedings are initiated.* Please make immediate payment or contact management today to discuss resolution.\n\nFailure to respond will result in action as per your lease terms.\n\nRegards,\nProperty Management`,
        smsSwahili: `ILANI YA MWISHO: ${firstName}, kodi yako ya ${amountStr} ya nyumba ${unitNumber} imechelewa kwa siku ${daysOverdue}. Hii ni ilani ya mwisho kabla ya hatua rasmi. Tafadhali lipa mara moja au wasiliana na usimamizi leo.`,
        whatsappSwahili: `🔴 *ILANI YA MWISHO*\n\nMpendwa ${firstName},\n\nMalipo ya kodi yako ya *${amountStr}* ya nyumba *${unitNumber}* sasa yamechelewa kwa *siku ${daysOverdue}*.\n\n*Hii ni ilani ya mwisho kabla ya hatua rasmi kuanza.* Tafadhali fanya malipo mara moja au wasiliana na usimamizi leo kujadili suluhu.\n\nKutoshughulikia kutasababisha hatua kwa mujibu wa masharti ya mkataba wako.\n\nHeshima,\nUsimamizi wa Mali`,
      };
  }
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Analyze a single tenant's overdue payments.
 * Returns null if no overdue or upcoming-due payments.
 */
export function analyzeTenantOverdue(
  tenant: Tenant,
  payments: Payment[]
): OverdueTenant | null {
  const rentPayments = payments.filter(
    p => p.payment_type === 'rent' &&
    (p.payment_status === 'pending' || p.payment_status === 'failed') &&
    p.due_date
  );

  if (rentPayments.length === 0) return null;

  const overduePayments: OverduePayment[] = [];

  for (const payment of rentPayments) {
    const days = getDaysOverdue(payment.due_date);
    // Include payments due within 3 days (upcoming) and overdue
    if (days >= -3) {
      overduePayments.push({
        paymentId: payment.id,
        amount: payment.amount,
        dueDate: payment.due_date,
        daysOverdue: days,
        paymentType: payment.payment_type,
      });
    }
  }

  if (overduePayments.length === 0) return null;

  // Sort by most overdue first
  overduePayments.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
  const maxDaysOverdue = overduePayments[0].daysOverdue;
  const escalation = getEscalationLevel(maxDaysOverdue);

  const tenantUser = (tenant as any).user;
  const tenantName = tenantUser?.full_name || 'Tenant';
  const tenantPhone = tenantUser?.phone || '';
  const tenantEmail = tenantUser?.email || '';
  const unitNumber = tenant.unit?.unit_number || 'N/A';
  const propertyName = tenant.unit?.property?.name || 'N/A';

  return {
    tenantId: tenant.id,
    tenant,
    tenantName,
    tenantPhone,
    tenantEmail,
    unitNumber,
    propertyName,
    overduePayments,
    totalOverdue,
    maxDaysOverdue,
    escalation,
    suggestedMessage: generateMessage(tenantName, totalOverdue, maxDaysOverdue, unitNumber, escalation),
  };
}

/**
 * Analyze all tenants for overdue rent payments.
 * Returns a sorted list with most overdue first.
 */
export function analyzeAllOverdue(
  tenants: Tenant[],
  allPayments: Payment[]
): OverdueTenant[] {
  // Group payments by tenant_id
  const paymentsByTenant = new Map<number, Payment[]>();
  for (const p of allPayments) {
    const existing = paymentsByTenant.get(p.tenant_id) || [];
    existing.push(p);
    paymentsByTenant.set(p.tenant_id, existing);
  }

  const results: OverdueTenant[] = [];

  for (const tenant of tenants) {
    const tenantPayments = paymentsByTenant.get(tenant.id) || [];
    const analysis = analyzeTenantOverdue(tenant, tenantPayments);
    if (analysis) {
      results.push(analysis);
    }
  }

  // Sort by most overdue first
  results.sort((a, b) => b.maxDaysOverdue - a.maxDaysOverdue);

  return results;
}

/**
 * Generate a full rent chasing summary.
 */
export function generateChasingSummary(
  tenants: Tenant[],
  allPayments: Payment[]
): RentChasingSummary {
  const overdueList = analyzeAllOverdue(tenants, allPayments);

  const byEscalation: Record<EscalationLevel, number> = {
    upcoming: 0,
    friendly: 0,
    firm: 0,
    urgent: 0,
    final: 0,
  };

  let totalAmount = 0;

  for (const item of overdueList) {
    byEscalation[item.escalation]++;
    totalAmount += item.totalOverdue;
  }

  return {
    totalOverdue: overdueList.length,
    totalAmount,
    byEscalation,
    tenants: overdueList,
  };
}

/**
 * Generate a WhatsApp deep link for sending a message.
 */
export function getWhatsAppLink(phone: string, message: string): string {
  // Clean phone number — remove spaces, dashes, and ensure country code
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // If starts with 0, replace with Kenya code
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  // If doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  // Remove the + for the wa.me link
  cleaned = cleaned.replace('+', '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate an SMS link (tel: URI with message body for mobile).
 */
export function getSMSLink(phone: string, message: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+254' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return `sms:${cleaned}?body=${encodeURIComponent(message)}`;
}
