import { MaintenanceRequest, Staff } from './types';

// ==================== TYPES ====================
export type PerformanceGrade = 'excellent' | 'good' | 'fair' | 'poor';

export interface SLAMetrics {
  /** Hours from reported_date to first status change (pending -> in_progress) */
  acknowledgeTimeHours: number | null;
  /** Hours from reported_date to completed_date */
  resolveTimeHours: number | null;
  /** Whether the request met the SLA target */
  withinSLA: boolean;
}

export interface StaffPerformance {
  staffId: number;
  staff: Staff;
  staffName: string;
  department: string;
  score: number; // 0-100
  grade: PerformanceGrade;
  totalAssigned: number;
  completed: number;
  pending: number;
  inProgress: number;
  avgAcknowledgeHours: number;
  avgResolveHours: number;
  slaComplianceRate: number; // 0-100 percentage
  repeatIssueCount: number;
  factors: {
    acknowledgement: number;  // 0-100
    resolution: number;       // 0-100
    completionRate: number;   // 0-100
    repeatIssues: number;     // 0-100 (lower is better, inverted for score)
  };
}

export interface SLASummary {
  totalRequests: number;
  completedRequests: number;
  avgAcknowledgeHours: number;
  avgResolveHours: number;
  overallSLACompliance: number;
  staffPerformances: StaffPerformance[];
}

// ==================== CONSTANTS ====================

/** SLA targets in hours by priority */
export const SLA_TARGETS = {
  urgent: { acknowledge: 1, resolve: 24 },
  high: { acknowledge: 4, resolve: 48 },
  medium: { acknowledge: 12, resolve: 96 },
  low: { acknowledge: 24, resolve: 168 },
} as const;

export const PERFORMANCE_GRADE_CONFIG = {
  excellent: { label: 'Excellent', color: '#22C55E', bgClass: 'bg-green-100 text-green-800' },
  good: { label: 'Good', color: '#3B82F6', bgClass: 'bg-blue-100 text-blue-800' },
  fair: { label: 'Fair', color: '#F59E0B', bgClass: 'bg-amber-100 text-amber-800' },
  poor: { label: 'Poor', color: '#EF4444', bgClass: 'bg-red-100 text-red-800' },
} as const;

const WEIGHTS = {
  acknowledgement: 0.25,
  resolution: 0.30,
  completionRate: 0.30,
  repeatIssues: 0.15,
};

// ==================== HELPERS ====================

export function getPerformanceGrade(score: number): PerformanceGrade {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

export function getGradeColor(grade: PerformanceGrade): string {
  return PERFORMANCE_GRADE_CONFIG[grade].color;
}

export function getGradeBgClass(grade: PerformanceGrade): string {
  return PERFORMANCE_GRADE_CONFIG[grade].bgClass;
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const remainHours = Math.round(hours % 24);
  if (remainHours === 0) return `${days}d`;
  return `${days}d ${remainHours}h`;
}

// ==================== SLA CALCULATIONS ====================

function hoursBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.max(0, (b.getTime() - a.getTime()) / (1000 * 60 * 60));
}

/**
 * Calculate SLA metrics for a single maintenance request.
 * Uses real timestamps from the request data.
 */
export function calculateRequestSLA(request: MaintenanceRequest): SLAMetrics {
  const target = SLA_TARGETS[request.priority] || SLA_TARGETS.medium;

  // Acknowledge time: reported_date -> updated_at (when status first changed)
  // If still pending, acknowledge time is null (not yet acknowledged)
  let acknowledgeTimeHours: number | null = null;
  if (request.status !== 'pending' && request.updated_at && request.reported_date) {
    // Use the time between reported and first update as acknowledge proxy
    // If scheduled_date exists, use that as the acknowledge signal
    const acknowledgeDate = request.scheduled_date || request.updated_at;
    acknowledgeTimeHours = hoursBetween(request.reported_date, acknowledgeDate);
  }

  // Resolution time: reported_date -> completed_date
  let resolveTimeHours: number | null = null;
  if (request.status === 'completed' && request.completed_date && request.reported_date) {
    resolveTimeHours = hoursBetween(request.reported_date, request.completed_date);
  }

  // Within SLA if completed and resolution time meets target
  const withinSLA = resolveTimeHours !== null && resolveTimeHours <= target.resolve;

  return { acknowledgeTimeHours, resolveTimeHours, withinSLA };
}

// ==================== FACTOR CALCULATIONS ====================

/**
 * Score based on average acknowledgement time vs SLA targets.
 * Fast acknowledgement = high score, slow = low score.
 */
function calcAcknowledgementScore(requests: MaintenanceRequest[]): number {
  const acknowledged = requests.filter(r => r.status !== 'pending');
  if (acknowledged.length === 0) return 50; // neutral if no data

  let totalRatio = 0;
  for (const req of acknowledged) {
    const target = SLA_TARGETS[req.priority] || SLA_TARGETS.medium;
    const acknowledgeDate = req.scheduled_date || req.updated_at;
    if (!acknowledgeDate || !req.reported_date) continue;
    const hours = hoursBetween(req.reported_date, acknowledgeDate);
    // Ratio: 0 = instant, 1 = at SLA limit, >1 = over SLA
    const ratio = hours / target.acknowledge;
    totalRatio += Math.min(ratio, 3); // cap at 3x SLA
  }

  const avgRatio = totalRatio / acknowledged.length;
  // Convert: ratio 0 = score 100, ratio 1 = score 50, ratio 2+ = score 0
  return Math.max(0, Math.min(100, Math.round(100 - avgRatio * 50)));
}

/**
 * Score based on average resolution time vs SLA targets.
 * Fast resolution = high score, slow = low score.
 */
function calcResolutionScore(requests: MaintenanceRequest[]): number {
  const completed = requests.filter(r => r.status === 'completed' && r.completed_date && r.reported_date);
  if (completed.length === 0) return 50; // neutral if no data

  let totalRatio = 0;
  for (const req of completed) {
    const target = SLA_TARGETS[req.priority] || SLA_TARGETS.medium;
    const hours = hoursBetween(req.reported_date, req.completed_date!);
    const ratio = hours / target.resolve;
    totalRatio += Math.min(ratio, 3);
  }

  const avgRatio = totalRatio / completed.length;
  return Math.max(0, Math.min(100, Math.round(100 - avgRatio * 50)));
}

/**
 * Score based on completion rate (completed / total assigned).
 * High completion = high score.
 */
function calcCompletionRateScore(requests: MaintenanceRequest[]): number {
  if (requests.length === 0) return 50;
  const completed = requests.filter(r => r.status === 'completed').length;
  const rate = completed / requests.length;
  return Math.round(rate * 100);
}

/**
 * Score based on repeat issues (same unit + similar title).
 * More repeats = lower score. We invert so high = good.
 */
function calcRepeatIssueScore(requests: MaintenanceRequest[]): number {
  if (requests.length <= 1) return 100; // no repeats possible

  // Group by unit_id and check for similar titles
  const unitRequests = new Map<number, string[]>();
  for (const req of requests) {
    const titles = unitRequests.get(req.unit_id) || [];
    titles.push((req.title || '').toLowerCase());
    unitRequests.set(req.unit_id, titles);
  }

  let repeatCount = 0;
  for (const titles of unitRequests.values()) {
    if (titles.length <= 1) continue;
    // Check for similar titles (simple substring match)
    for (let i = 0; i < titles.length; i++) {
      for (let j = i + 1; j < titles.length; j++) {
        const a = titles[i];
        const b = titles[j];
        // Consider repeat if titles share significant words
        const wordsA = a.split(/\s+/).filter(w => w.length > 3);
        const wordsB = b.split(/\s+/).filter(w => w.length > 3);
        const overlap = wordsA.filter(w => wordsB.includes(w)).length;
        if (overlap >= 1) repeatCount++;
      }
    }
  }

  // 0 repeats = 100, 5+ repeats = 0
  return Math.max(0, Math.min(100, 100 - repeatCount * 20));
}

function countRepeatIssues(requests: MaintenanceRequest[]): number {
  if (requests.length <= 1) return 0;

  const unitRequests = new Map<number, string[]>();
  for (const req of requests) {
    const titles = unitRequests.get(req.unit_id) || [];
    titles.push((req.title || '').toLowerCase());
    unitRequests.set(req.unit_id, titles);
  }

  let repeatCount = 0;
  for (const titles of unitRequests.values()) {
    if (titles.length <= 1) continue;
    for (let i = 0; i < titles.length; i++) {
      for (let j = i + 1; j < titles.length; j++) {
        const wordsA = titles[i].split(/\s+/).filter(w => w.length > 3);
        const wordsB = titles[j].split(/\s+/).filter(w => w.length > 3);
        const overlap = wordsA.filter(w => wordsB.includes(w)).length;
        if (overlap >= 1) repeatCount++;
      }
    }
  }

  return repeatCount;
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Calculate performance score for a single staff member based on their assigned requests.
 */
export function calculateStaffPerformance(
  staffMember: Staff,
  assignedRequests: MaintenanceRequest[]
): StaffPerformance {
  const completed = assignedRequests.filter(r => r.status === 'completed');
  const pending = assignedRequests.filter(r => r.status === 'pending');
  const inProgress = assignedRequests.filter(r => r.status === 'in_progress');

  const factors = {
    acknowledgement: calcAcknowledgementScore(assignedRequests),
    resolution: calcResolutionScore(assignedRequests),
    completionRate: calcCompletionRateScore(assignedRequests),
    repeatIssues: calcRepeatIssueScore(assignedRequests),
  };

  const score = Math.round(
    factors.acknowledgement * WEIGHTS.acknowledgement +
    factors.resolution * WEIGHTS.resolution +
    factors.completionRate * WEIGHTS.completionRate +
    factors.repeatIssues * WEIGHTS.repeatIssues
  );

  // Calculate average times from completed requests
  let totalAckHours = 0;
  let ackCount = 0;
  let totalResolveHours = 0;

  for (const req of assignedRequests) {
    if (req.status !== 'pending') {
      const ackDate = req.scheduled_date || req.updated_at;
      if (ackDate && req.reported_date) {
        totalAckHours += hoursBetween(req.reported_date, ackDate);
        ackCount++;
      }
    }
  }

  for (const req of completed) {
    if (req.completed_date && req.reported_date) {
      totalResolveHours += hoursBetween(req.reported_date, req.completed_date);
    }
  }

  // SLA compliance rate
  let slaMetCount = 0;
  for (const req of completed) {
    const sla = calculateRequestSLA(req);
    if (sla.withinSLA) slaMetCount++;
  }

  const staffUser = (staffMember as any).user;

  return {
    staffId: staffMember.id,
    staff: staffMember,
    staffName: staffUser?.full_name || 'Unknown',
    department: staffMember.department,
    score,
    grade: getPerformanceGrade(score),
    totalAssigned: assignedRequests.length,
    completed: completed.length,
    pending: pending.length,
    inProgress: inProgress.length,
    avgAcknowledgeHours: ackCount > 0 ? totalAckHours / ackCount : 0,
    avgResolveHours: completed.length > 0 ? totalResolveHours / completed.length : 0,
    slaComplianceRate: completed.length > 0 ? Math.round((slaMetCount / completed.length) * 100) : 0,
    repeatIssueCount: countRepeatIssues(assignedRequests),
    factors,
  };
}

/**
 * Calculate performance for all staff members who have maintenance assignments.
 */
export function calculateAllStaffPerformance(
  allStaff: Staff[],
  allRequests: MaintenanceRequest[]
): StaffPerformance[] {
  // Group requests by assigned_to
  const requestsByStaff = new Map<number, MaintenanceRequest[]>();
  for (const req of allRequests) {
    if (req.assigned_to) {
      const existing = requestsByStaff.get(req.assigned_to) || [];
      existing.push(req);
      requestsByStaff.set(req.assigned_to, existing);
    }
  }

  // Calculate performance for each staff member that has assignments
  const performances: StaffPerformance[] = [];

  for (const staffMember of allStaff) {
    const assigned = requestsByStaff.get(staffMember.id);
    if (!assigned || assigned.length === 0) continue;
    performances.push(calculateStaffPerformance(staffMember, assigned));
  }

  // Sort by score descending (best performers first)
  performances.sort((a, b) => b.score - a.score);

  return performances;
}

/**
 * Generate overall SLA summary across all requests.
 */
export function calculateSLASummary(
  allStaff: Staff[],
  allRequests: MaintenanceRequest[]
): SLASummary {
  const completed = allRequests.filter(r => r.status === 'completed');

  let totalAckHours = 0;
  let ackCount = 0;
  let totalResolveHours = 0;
  let slaMetCount = 0;

  for (const req of allRequests) {
    if (req.status !== 'pending') {
      const ackDate = req.scheduled_date || req.updated_at;
      if (ackDate && req.reported_date) {
        totalAckHours += hoursBetween(req.reported_date, ackDate);
        ackCount++;
      }
    }
  }

  for (const req of completed) {
    if (req.completed_date && req.reported_date) {
      totalResolveHours += hoursBetween(req.reported_date, req.completed_date);
    }
    const sla = calculateRequestSLA(req);
    if (sla.withinSLA) slaMetCount++;
  }

  return {
    totalRequests: allRequests.length,
    completedRequests: completed.length,
    avgAcknowledgeHours: ackCount > 0 ? totalAckHours / ackCount : 0,
    avgResolveHours: completed.length > 0 ? totalResolveHours / completed.length : 0,
    overallSLACompliance: completed.length > 0 ? Math.round((slaMetCount / completed.length) * 100) : 0,
    staffPerformances: calculateAllStaffPerformance(allStaff, allRequests),
  };
}
