import { Tenant, Payment, MaintenanceRequest } from './types';

// ==================== TYPES ====================
export type RiskLevel = 'low' | 'medium' | 'high';

export interface TenantRiskScore {
  tenantId: number;
  tenant: Tenant;
  score: number;
  level: RiskLevel;
  factors: {
    paymentHistory: number;   // 0-100
    latePayments: number;     // 0-100
    maintenance: number;      // 0-100
    occupancyDuration: number; // 0-100
  };
}

// ==================== CONSTANTS ====================
export const RISK_LEVEL_CONFIG = {
  low: { label: 'Low Risk', color: '#22C55E', bgClass: 'bg-green-100 text-green-800', borderClass: 'border-green-500' },
  medium: { label: 'Medium Risk', color: '#F59E0B', bgClass: 'bg-orange-100 text-orange-800', borderClass: 'border-orange-500' },
  high: { label: 'High Risk', color: '#EF4444', bgClass: 'bg-red-100 text-red-800', borderClass: 'border-red-500' },
} as const;

const WEIGHTS = {
  paymentHistory: 0.4,
  latePayments: 0.3,
  maintenance: 0.15,
  occupancyDuration: 0.15,
};

// ==================== HELPERS ====================
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 35) return 'low';
  if (score <= 65) return 'medium';
  return 'high';
}

export function getRiskColor(level: RiskLevel): string {
  return RISK_LEVEL_CONFIG[level].color;
}

export function getRiskBgClass(level: RiskLevel): string {
  return RISK_LEVEL_CONFIG[level].bgClass;
}

// ==================== FACTOR CALCULATIONS ====================

function calcPaymentHistoryScore(payments: Payment[]): number {
  const rentPayments = payments.filter(p => p.payment_type === 'rent');
  if (rentPayments.length === 0) return 50; // neutral - no data

  const badStatuses = ['failed', 'refunded'];
  const badCount = rentPayments.filter(p => badStatuses.includes(p.payment_status)).length;
  const badRatio = badCount / rentPayments.length;

  // 0 bad = score 0, all bad = score 100
  return Math.round(badRatio * 100);
}

function calcLatePaymentScore(payments: Payment[]): number {
  const rentPayments = payments.filter(p => p.payment_type === 'rent' && p.payment_date && p.due_date);
  if (rentPayments.length === 0) return 50; // neutral - no data

  let totalLateDays = 0;
  let lateCount = 0;

  for (const p of rentPayments) {
    const paymentDate = new Date(p.payment_date!);
    const dueDate = new Date(p.due_date);
    const diffDays = Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      totalLateDays += diffDays;
      lateCount++;
    }
  }

  if (lateCount === 0) return 0; // always on time

  const avgLateDays = totalLateDays / rentPayments.length;
  // Cap at 30 days late avg = score 100
  return Math.min(100, Math.round((avgLateDays / 30) * 100));
}

function calcMaintenanceScore(requests: MaintenanceRequest[]): number {
  if (requests.length === 0) return 0; // no requests = good

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

function calcOccupancyDurationScore(leaseStart: string): number {
  if (!leaseStart) return 80; // no data = treat as new tenant (high unknown risk)
  const start = new Date(leaseStart);
  if (isNaN(start.getTime())) return 80; // invalid date = treat as new tenant
  const now = new Date();
  const monthsOccupied = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

  // New tenant (< 3 months) = high unknown risk (score 80)
  // 3-6 months = medium (score 50)
  // 6-12 months = lower (score 30)
  // 12+ months = low (score 10)
  if (monthsOccupied < 3) return 80;
  if (monthsOccupied < 6) return 50;
  if (monthsOccupied < 12) return 30;
  return 10;
}

// ==================== MAIN FUNCTIONS ====================

export function calculateTenantRiskScore(
  tenant: Tenant,
  payments: Payment[],
  maintenanceRequests: MaintenanceRequest[]
): TenantRiskScore {
  const factors = {
    paymentHistory: calcPaymentHistoryScore(payments),
    latePayments: calcLatePaymentScore(payments),
    maintenance: calcMaintenanceScore(maintenanceRequests),
    occupancyDuration: calcOccupancyDurationScore(tenant.lease_start),
  };

  const score = Math.round(
    factors.paymentHistory * WEIGHTS.paymentHistory +
    factors.latePayments * WEIGHTS.latePayments +
    factors.maintenance * WEIGHTS.maintenance +
    factors.occupancyDuration * WEIGHTS.occupancyDuration
  );

  return {
    tenantId: tenant.id,
    tenant,
    score,
    level: getRiskLevel(score),
    factors,
  };
}

export function calculateAllTenantRiskScores(
  tenants: Tenant[],
  allPayments: Payment[],
  allMaintenance: MaintenanceRequest[]
): TenantRiskScore[] {
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

  const scores = tenants.map(tenant =>
    calculateTenantRiskScore(
      tenant,
      paymentsByTenant.get(tenant.id) || [],
      maintenanceByTenant.get(tenant.id) || []
    )
  );

  // Sort descending by score (highest risk first)
  scores.sort((a, b) => b.score - a.score);

  return scores;
}
