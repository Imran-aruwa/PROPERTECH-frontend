/**
 * Autopilot API client — typed wrappers for all 19 endpoints.
 * Uses the existing getAuthToken() pattern from api-services.ts.
 */
import {
  AutomationRule,
  AutomationExecution,
  AutopilotSettings,
  AutopilotHealth,
  AutomationTemplate,
  DryRunResult,
  Condition,
  ActionStep,
  AutopilotMode,
  TemplateCategory,
} from '@/types/automation';

// ── Token helper (mirrors api-services.ts pattern) ────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token')
  );
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(`/api${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const detail = json?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : detail?.message || json?.message || `HTTP ${res.status}`;
      return { success: false, error: msg };
    }
    return { success: true, data: json as T };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Rules ─────────────────────────────────────────────────────────────────────
export const automationRulesApi = {
  list: () => apiFetch<AutomationRule[]>('/automation/rules'),

  create: (body: {
    name: string;
    description?: string;
    trigger_event: string;
    trigger_conditions?: Condition[];
    action_chain: ActionStep[];
    delay_minutes?: number;
    requires_approval?: boolean;
    is_active?: boolean;
  }) => apiFetch<AutomationRule>('/automation/rules', { method: 'POST', body: JSON.stringify(body) }),

  get: (id: string) => apiFetch<AutomationRule>(`/automation/rules/${id}`),

  update: (id: string, body: Partial<AutomationRule>) =>
    apiFetch<AutomationRule>(`/automation/rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: string) => apiFetch<void>(`/automation/rules/${id}`, { method: 'DELETE' }),

  toggle: (id: string) => apiFetch<AutomationRule>(`/automation/rules/${id}/toggle`, { method: 'POST' }),

  dryRun: (id: string, payload: Record<string, unknown>) =>
    apiFetch<DryRunResult>(`/automation/rules/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }),
};

// ── Templates ─────────────────────────────────────────────────────────────────
export const automationTemplatesApi = {
  list: (category?: TemplateCategory) =>
    apiFetch<AutomationTemplate[]>(`/automation/templates${category ? `?category=${category}` : ''}`),

  activate: (templateId: string) =>
    apiFetch<AutomationRule>(`/automation/templates/${templateId}/activate`, { method: 'POST' }),

  createCustom: (body: {
    name: string;
    category: TemplateCategory;
    description?: string;
    trigger_event: string;
    default_conditions?: Condition[];
    default_action_chain: ActionStep[];
  }) => apiFetch<AutomationTemplate>('/automation/templates', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Executions ────────────────────────────────────────────────────────────────
export const automationExecutionsApi = {
  list: (params?: {
    rule_id?: string;
    status?: string;
    trigger_event?: string;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.rule_id) qs.set('rule_id', params.rule_id);
    if (params?.status) qs.set('status', params.status);
    if (params?.trigger_event) qs.set('trigger_event', params.trigger_event);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    return apiFetch<AutomationExecution[]>(`/automation/executions?${qs}`);
  },

  get: (id: string) => apiFetch<AutomationExecution>(`/automation/executions/${id}`),

  approve: (id: string) =>
    apiFetch<AutomationExecution>(`/automation/executions/${id}/approve`, { method: 'POST' }),

  reject: (id: string, reason: string) =>
    apiFetch<AutomationExecution>(`/automation/executions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  rollback: (id: string) =>
    apiFetch<AutomationExecution>(`/automation/executions/${id}/rollback`, { method: 'POST' }),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const autopilotSettingsApi = {
  get: () => apiFetch<AutopilotSettings>('/automation/settings'),

  update: (body: {
    is_enabled?: boolean;
    mode?: AutopilotMode;
    quiet_hours_start?: number;
    quiet_hours_end?: number;
    max_actions_per_day?: number;
    excluded_property_ids?: string[];
  }) =>
    apiFetch<AutopilotSettings>('/automation/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const autopilotHealthApi = {
  get: () => apiFetch<AutopilotHealth>('/automation/health'),
};

// ── Manual trigger ────────────────────────────────────────────────────────────
export const automationTriggerApi = {
  fire: (event_type: string, payload: Record<string, unknown> = {}) =>
    apiFetch('/automation/trigger', {
      method: 'POST',
      body: JSON.stringify({ event_type, payload }),
    }),
};
