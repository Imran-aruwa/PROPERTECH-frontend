// Autonomous Property Manager — TypeScript Type Definitions

export type TriggerEvent =
  | 'payment_received'
  | 'payment_overdue_3d'
  | 'payment_overdue_7d'
  | 'payment_overdue_14d'
  | 'lease_expiring_60d'
  | 'lease_expiring_30d'
  | 'lease_expiring_7d'
  | 'lease_expired'
  | 'unit_vacated'
  | 'unit_vacant_7d'
  | 'unit_vacant_30d'
  | 'maintenance_request_created'
  | 'maintenance_overdue'
  | 'tenant_onboarded'
  | 'manual'
  | 'scheduled';

export type AutopilotMode = 'full_auto' | 'approval_required' | 'notify_only';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'awaiting_approval';

export type ActionResultStatus = 'success' | 'failed' | 'skipped' | 'dry_run';

export type TemplateCategory = 'payments' | 'leases' | 'vacancy' | 'maintenance' | 'onboarding';

export interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}

export interface ActionStep {
  action_type: string;
  params: Record<string, unknown>;
  stop_on_failure: boolean;
}

export interface AutomationRule {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_event: string;
  trigger_conditions: Condition[] | null;
  action_chain: ActionStep[];
  delay_minutes: number;
  requires_approval: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionResult {
  action_type: string;
  status: ActionResultStatus;
  data: Record<string, unknown> | null;
  reversible: boolean;
  log_id: string | null;
}

export interface AutomationExecution {
  id: string;
  rule_id: string | null;
  owner_id: string;
  trigger_event: string;
  trigger_payload: Record<string, unknown> | null;
  status: ExecutionStatus;
  started_at: string;
  completed_at: string | null;
  actions_taken: ActionResult[] | null;
  error_message: string | null;
  rolled_back_at: string | null;
  rolled_back_by: string | null;
}

export interface AutopilotSettings {
  id: string;
  owner_id: string;
  is_enabled: boolean;
  mode: AutopilotMode;
  quiet_hours_start: number;
  quiet_hours_end: number;
  max_actions_per_day: number;
  excluded_property_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface AutopilotHealth {
  active_rules: number;
  executions_today: number;
  pending_approvals: number;
  last_execution_at: string | null;
  upcoming_scheduled_count: number;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string | null;
  trigger_event: string;
  default_conditions: Condition[] | null;
  default_action_chain: ActionStep[];
  is_system_template: boolean;
  created_by_owner_id: string | null;
  created_at: string;
}

export interface DryRunResult {
  rule_id: string;
  conditions_matched: boolean;
  conditions_evaluated: Array<{
    field: string;
    operator: string;
    expected: unknown;
    actual: unknown;
    passed: boolean;
  }>;
  actions_that_would_fire: Array<{
    action_type: string;
    resolved_params: Record<string, unknown>;
    stop_on_failure: boolean;
  }>;
  dry_run: boolean;
  note: string;
}
