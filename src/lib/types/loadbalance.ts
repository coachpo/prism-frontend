export type LoadbalanceEventType =
  | "opened"
  | "extended"
  | "max_cooldown_strike"
  | "banned"
  | "probe_eligible"
  | "recovered"
  | "not_opened";

export type LoadbalanceBanMode = "off" | "temporary" | "manual";

export type LoadbalanceFailureKind =
  | "transient_http"
  | "auth_like"
  | "connect_error"
  | "timeout";

export type LoadbalanceCurrentStateValue =
  | "counting"
  | "blocked"
  | "probe_eligible"
  | "banned";

export interface LoadbalanceCurrentStateItem {
  connection_id: number;
  consecutive_failures: number;
  last_failure_kind: LoadbalanceFailureKind | null;
  last_cooldown_seconds: number;
  blocked_until_at: string | null;
  probe_eligible_logged: boolean;
  max_cooldown_strikes: number;
  ban_mode: LoadbalanceBanMode;
  banned_until_at: string | null;
  state: LoadbalanceCurrentStateValue;
  created_at: string;
  updated_at: string;
}

export interface LoadbalanceCurrentStateListResponse {
  items: LoadbalanceCurrentStateItem[];
}

export interface LoadbalanceCurrentStateResetResponse {
  connection_id: number;
  cleared: boolean;
}

export interface LoadbalanceEventSummary {
  event: string;
  reason: string;
  operation: string;
  cooldown: string;
}

export interface LoadbalanceEvent {
  id: number;
  profile_id: number;
  connection_id: number;
  event_type: LoadbalanceEventType;
  failure_kind: LoadbalanceFailureKind | null;
  consecutive_failures: number;
  cooldown_seconds: number;
  blocked_until_mono: number | null;
  model_id: string | null;
  endpoint_id: number | null;
  provider_id: number | null;
  summary: LoadbalanceEventSummary;
  created_at: string;
}

export interface LoadbalanceEventDetail extends LoadbalanceEvent {
  failure_threshold: number | null;
  backoff_multiplier: number | null;
  max_cooldown_seconds: number | null;
  max_cooldown_strikes: number | null;
  ban_mode: LoadbalanceBanMode | null;
  banned_until_at: string | null;
}

export interface LoadbalanceEventListResponse {
  items: LoadbalanceEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface LoadbalanceEventDeleteResponse {
  accepted: boolean;
}
