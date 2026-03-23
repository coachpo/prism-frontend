export type LoadbalanceEventType =
  | "opened"
  | "extended"
  | "probe_eligible"
  | "recovered"
  | "not_opened";

export type LoadbalanceFailureKind =
  | "transient_http"
  | "auth_like"
  | "connect_error"
  | "timeout";

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
