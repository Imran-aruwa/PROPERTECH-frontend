import { Tenant, Payment, MaintenanceRequest } from './types';

// ==================== TYPES ====================
export type VacancyRisk = 'low' | 'medium' | 'high' | 'critical';

export interface VacancyAlert {
  tenantId: number;
  tenant: Tenant;
  unitNumber: string;
  propertyName: string;
  score: number; // 0-100
  risk: VacancyRisk;
  estimatedDays: string;
  factors: {
    leaseEndProximity: number;  // 0-100
    lateRentPattern: number;    // 0-100
    maintenanceFrequency: number; // 0-100
    paymentFailures: number;    // 0-100
  };
}

// ==================== CONSTANTS ====================
export const VACANCY_RISK_CONFIG = {
  low: { label: 'Low', color: '#22C55E', bgClass: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', color: '#F59E0B', bgClass: 'bg-amber-100 text-amber-800' },
  high: { label: 'High', color: '#F97316', bgClass: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: '#EF4444', bgClass: 'bg-red-100 text-red-800' },
} as const;

const WEIGHTS = {
  leaseEndProximity: 0.35,
  lateRentPattern: 0.25,
  maintenanceFrequency: 0.20,
  paymentFailures: 0.20,
};

// ==================== HELPERS ====================
export function getVacancyRisk(score: number): VacancyRisk {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

export function getVacancyColor(risk: VacancyRisk): string {
  return VACANCY_RISK_CONFIG[risk].color;
}

export function getVacancyBgClass(risk: VacancyRisk): string {
  return VACANCY_RISK_CONFIG[risk].bgClass;
}

export function estimateDaysToVacancy(score: number, leaseEnd: string): string {
  if (!leaseEnd) return 'Unknown';
  const end = new Date(leaseEnd);
  if (isNaN(end.getTime())) return 'Unknown';

  const now = new Date();
  const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilEnd <= 0) return 'Expired';
  if (score >= 75) return `~${Math.min(daysUntilEnd, 30)} days`;
  if (score >= 50) return `~${Math.min(daysUntilEnd, 60)} days`;
  if (score >= 25) return `~${Math.min(daysUntilEnd, 90)} days`;
  return `${daysUntilEnd}+ days`;
}

// ==================== FACTOR CALCULATIONS ====================

function calcLeaseEndProximity(leaseEnd: string): number {
  if (!leaseEnd) return 50;
  const end = new Date(leaseEnd);
  if (isNaN(end.getTime())) return 50;

  const now = new Date();
  const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilEnd <= 0) return 100;
  if (daysUntilEnd < 30) return 100;
  if (daysUntilEnd < 60) return 75;
  if (daysUntilEnd < 90) return 50;
  if (daysUntilEnd < 180) return 25;
  return 0;
}

function calcLateRentPattern(payments: Payment[]): number {
  const rentPayments = payments.filter(p => p.payment_type === 'rent' && p.payment_date && p.due_date);
  if (rentPayments.length === 0) return 0;

  let lateCount = 0;
  for (const p of rentPayments) {
    const paymentDate = new Date(p.payment_date!);
    const dueDate = new Date(p.due_date);
    if (paymentDate.getTime() > dueDate.getTime()) {
      lateCount++;
    }
  }

  const lateRatio = lateCount / rentPayments.length;

  // Check for increasing trend — compare first half vs second half
  const mid = Math.floor(rentPayments.length / 2);
  if (mid > 0) {
    const firstHalf = rentPayments.slice(0, mid);
    const secondHalf = rentPayments.slice(mid);
    const firstLate = firstHalf.filter(p => new Date(p.payment_date!).getTime() > new Date(p.due_date).getTime()).length / firstHalf.length;
    const secondLate = secondHalf.filter(p => new Date(p.payment_date!).getTime() > new Date(p.due_date).getTime()).length / secondHalf.length;

    // If trend is increasing, add 15% bonus
    if (secondLate > firstLate) {
      return Math.min(100, Math.round(lateRatio * 100 + 15));
    }
  }

  return Math.round(lateRatio * 100);
}

function calcMaintenanceFrequency(requests: MaintenanceRequest[]): number {
  if (requests.length === 0) return 0;

  const priorityWeights: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4,
  };

  let weightedSum = 0;
  for (const req of requests) {
    weightedSum += priorityWeights[req.priority] || 1;
  }

  // Normalize: 10 weighted points = score 50, 20+ = score 100
  return Math.min(100, Math.round((weightedSum / 20) * 100));
}

function calcPaymentFailures(payments: Payment[]): number {
  const rentPayments = payments.filter(p => p.payment_type === 'rent');
  if (rentPayments.length === 0) return 0;

  const badStatuses = ['failed', 'refunded'];
  const badCount = rentPayments.filter(p => badStatuses.includes(p.payment_status)).length;
  const badRatio = badCount / rentPayments.length;

  return Math.round(badRatio * 100);
}

// ==================== MAIN FUNCTIONS ====================

export function predictVacancy(
  tenant: Tenant,
  payments: Payment[],
  maintenance: MaintenanceRequest[]
): VacancyAlert {
  const factors = {
    leaseEndProximity: calcLeaseEndProximity(tenant.lease_end),
    lateRentPattern: calcLateRentPattern(payments),
    maintenanceFrequency: calcMaintenanceFrequency(maintenance),
    paymentFailures: calcPaymentFailures(payments),
  };

  const score = Math.round(
    factors.leaseEndProximity * WEIGHTS.leaseEndProximity +
    factors.lateRentPattern * WEIGHTS.lateRentPattern +
    factors.maintenanceFrequency * WEIGHTS.maintenanceFrequency +
    factors.paymentFailures * WEIGHTS.paymentFailures
  );

  return {
    tenantId: tenant.id,
    tenant,
    unitNumber: tenant.unit?.unit_number || 'N/A',
    propertyName: tenant.unit?.property?.name || 'N/A',
    score,
    risk: getVacancyRisk(score),
    estimatedDays: estimateDaysToVacancy(score, tenant.lease_end),
    factors,
  };
}

export function predictAllVacancies(
  tenants: Tenant[],
  allPayments: Payment[],
  allMaintenance: MaintenanceRequest[]
): VacancyAlert[] {
  // Group payments by tenant_id
  const paymentsByTenant = new Map<number, Payment[]>();
  for (const p of allPayments) {
    const existing = paymentsByTenant.get(p.tenant_id) || [];
    existing.push(p);
    paymentsByTenant.set(p.tenant_id, existing);
  }

  // Group maintenance by tenant_id
  const maintenanceByTenant = new Map<number, MaintenanceRequest[]>();
  for (const m of allMaintenance) {
    const existing = maintenanceByTenant.get(m.tenant_id) || [];
    existing.push(m);
    maintenanceByTenant.set(m.tenant_id, existing);
  }

  const alerts = tenants.map(tenant =>
    predictVacancy(
      tenant,
      paymentsByTenant.get(tenant.id) || [],
      maintenanceByTenant.get(tenant.id) || []
    )
  );

  // Sort descending by score (highest vacancy risk first)
  alerts.sort((a, b) => b.score - a.score);

  return alerts;
}
