import type { Provider } from "./profile-provider";
import type { Connection } from "./routing";

export type ModelType = "native" | "proxy";
export type LoadBalancingStrategy = "single" | "failover";

export interface ModelConfig {
  id: number;
  provider_id: number;
  provider: Provider;
  model_id: string;
  display_name: string | null;
  model_type: ModelType;
  redirect_to: string | null;
  lb_strategy: LoadBalancingStrategy;
  is_enabled: boolean;
  failover_recovery_enabled: boolean;
  failover_recovery_cooldown_seconds: number;
  connections: Connection[];
  created_at: string;
  updated_at: string;
}

export interface ModelConfigListItem {
  id: number;
  provider_id: number;
  provider: Provider;
  model_id: string;
  display_name: string | null;
  model_type: ModelType;
  redirect_to: string | null;
  lb_strategy: LoadBalancingStrategy;
  is_enabled: boolean;
  failover_recovery_enabled: boolean;
  failover_recovery_cooldown_seconds: number;
  connection_count: number;
  active_connection_count: number;
  health_success_rate: number | null;
  health_total_requests: number;
  created_at: string;
  updated_at: string;
}

export interface ModelConfigCreate {
  provider_id: number;
  model_id: string;
  display_name?: string | null;
  model_type?: ModelType;
  redirect_to?: string | null;
  lb_strategy?: LoadBalancingStrategy;
  is_enabled?: boolean;
  failover_recovery_enabled?: boolean;
  failover_recovery_cooldown_seconds?: number;
}

export interface ModelConfigUpdate {
  provider_id?: number;
  model_id?: string;
  display_name?: string | null;
  model_type?: ModelType;
  redirect_to?: string | null;
  lb_strategy?: LoadBalancingStrategy;
  is_enabled?: boolean;
  failover_recovery_enabled?: boolean;
  failover_recovery_cooldown_seconds?: number;
}

export interface RequestLogEntry {
  id: number;
  model_id: string;
  profile_id: number;
  provider_type: string;
  endpoint_id: number | null;
  connection_id: number | null;
  endpoint_base_url: string | null;
  endpoint_description: string | null;
  status_code: number;
  response_time_ms: number;
  is_stream: boolean;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  success_flag: boolean | null;
  billable_flag: boolean | null;
  priced_flag: boolean | null;
  unpriced_reason: string | null;
  cache_read_input_tokens: number | null;
  cache_creation_input_tokens: number | null;
  reasoning_tokens: number | null;
  input_cost_micros: number | null;
  output_cost_micros: number | null;
  cache_read_input_cost_micros: number | null;
  cache_creation_input_cost_micros: number | null;
  reasoning_cost_micros: number | null;
  total_cost_original_micros: number | null;
  total_cost_user_currency_micros: number | null;
  currency_code_original: string | null;
  report_currency_code: string | null;
  report_currency_symbol: string | null;
  fx_rate_used: string | null;
  fx_rate_source: string | null;
  pricing_snapshot_unit: string | null;
  pricing_snapshot_input: string | null;
  pricing_snapshot_output: string | null;
  pricing_snapshot_cache_read_input: string | null;
  pricing_snapshot_cache_creation_input: string | null;
  pricing_snapshot_reasoning: string | null;
  pricing_snapshot_missing_special_token_price_policy: string | null;
  pricing_config_version_used: number | null;
  request_path: string;
  error_detail: string | null;
  created_at: string;
}

export interface RequestLogListResponse {
  items: RequestLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface StatGroup {
  key: string;
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_response_time_ms: number;
  total_tokens: number;
}

export interface StatsSummary {
  total_requests: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  groups: StatGroup[];
}

export interface StatsRequestParams {
  request_id?: number;
  model_id?: string;
  provider_type?: string;
  status_code?: number;
  success?: boolean;
  from_time?: string;
  to_time?: string;
  endpoint_id?: number;
  connection_id?: number;
  limit?: number;
  offset?: number;
}

export interface StatsSummaryParams {
  from_time?: string;
  to_time?: string;
  group_by?: "model" | "provider" | "endpoint";
  model_id?: string;
  provider_type?: string;
  endpoint_id?: number;
  connection_id?: number;
}

export interface ModelMetricsBatchParams {
  model_ids: string[];
  summary_window_hours?: number;
  spending_preset?: "today" | "last_7_days" | "last_30_days" | "custom" | "all";
}

export interface ModelMetricsBatchItem {
  model_id: string;
  success_rate: number;
  request_count_24h: number;
  p95_latency_ms: number;
  spend_30d_micros: number;
}

export interface ModelMetricsBatchResponse {
  items: ModelMetricsBatchItem[];
}

export interface ConnectionSuccessRate {
  connection_id: number;
  total_requests: number;
  success_count: number;
  error_count: number;
  success_rate: number | null;
}

export interface ConnectionSuccessRateParams {
  from_time?: string;
  to_time?: string;
}

export type SpendingGroupBy =
  | "none"
  | "day"
  | "week"
  | "month"
  | "provider"
  | "model"
  | "endpoint"
  | "model_endpoint";

export interface SpendingReportParams {
  preset?: "today" | "last_7_days" | "last_30_days" | "custom" | "all";
  from_time?: string;
  to_time?: string;
  provider_type?: string;
  model_id?: string;
  connection_id?: number;
  group_by?: SpendingGroupBy;
  limit?: number;
  offset?: number;
  top_n?: number;
}

export interface SpendingSummary {
  total_cost_micros: number;
  successful_request_count: number;
  priced_request_count: number;
  unpriced_request_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_read_input_tokens: number;
  total_cache_creation_input_tokens: number;
  total_reasoning_tokens: number;
  total_tokens: number;
  avg_cost_per_successful_request_micros: number;
}

export interface SpendingGroupRow {
  key: string;
  total_cost_micros: number;
  total_requests: number;
  priced_requests: number;
  unpriced_requests: number;
  total_tokens: number;
}

export interface SpendingTopModel {
  model_id: string;
  total_cost_micros: number;
}

export interface SpendingTopEndpoint {
  endpoint_id: number | null;
  endpoint_label: string;
  total_cost_micros: number;
}

export interface SpendingReportResponse {
  summary: SpendingSummary;
  groups: SpendingGroupRow[];
  groups_total: number;
  top_spending_models: SpendingTopModel[];
  top_spending_endpoints: SpendingTopEndpoint[];
  unpriced_breakdown: Record<string, number>;
  report_currency_code: string;
  report_currency_symbol: string;
}

export interface ThroughputBucket {
  timestamp: string;
  request_count: number;
  tps: number;
}

export interface ThroughputStatsResponse {
  average_tps: number;
  peak_tps: number;
  current_tps: number;
  total_requests: number;
  time_window_seconds: number;
  buckets: ThroughputBucket[];
}

export interface EndpointModelsBatchParams {
  endpoint_ids: number[];
}

export interface EndpointModelsBatchItem {
  endpoint_id: number;
  models: ModelConfigListItem[];
}

export interface EndpointModelsBatchResponse {
  items: EndpointModelsBatchItem[];
}
