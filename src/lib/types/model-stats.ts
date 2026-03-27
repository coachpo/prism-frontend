import type { ApiFamily, Vendor } from "./vendor";
import type { Connection } from "./routing";
import type { LoadbalanceBanMode } from "./loadbalance";

export type ModelType = "native" | "proxy";
export type LoadBalancingStrategy = "single" | "fill-first" | "round-robin" | "failover";

export interface ProxyTarget {
  target_model_id: string;
  position: number;
}

export interface LoadbalanceStrategySummary {
  id: number;
  name: string;
  strategy_type: LoadBalancingStrategy;
  failover_recovery_enabled: boolean;
  failover_cooldown_seconds: number;
  failover_failure_threshold: number;
  failover_backoff_multiplier: number;
  failover_max_cooldown_seconds: number;
  failover_jitter_ratio: number;
  failover_auth_error_cooldown_seconds: number;
  failover_ban_mode: LoadbalanceBanMode;
  failover_max_cooldown_strikes_before_ban: number;
  failover_ban_duration_seconds: number;
}

export interface LoadbalanceStrategy {
  id: number;
  profile_id: number;
  name: string;
  strategy_type: LoadBalancingStrategy;
  failover_recovery_enabled: boolean;
  failover_cooldown_seconds: number;
  failover_failure_threshold: number;
  failover_backoff_multiplier: number;
  failover_max_cooldown_seconds: number;
  failover_jitter_ratio: number;
  failover_auth_error_cooldown_seconds: number;
  failover_ban_mode: LoadbalanceBanMode;
  failover_max_cooldown_strikes_before_ban: number;
  failover_ban_duration_seconds: number;
  attached_model_count: number;
  created_at: string;
  updated_at: string;
}

export interface LoadbalanceStrategyCreate {
  name: string;
  strategy_type?: LoadBalancingStrategy;
  failover_recovery_enabled?: boolean;
  failover_cooldown_seconds?: number;
  failover_failure_threshold?: number;
  failover_backoff_multiplier?: number;
  failover_max_cooldown_seconds?: number;
  failover_jitter_ratio?: number;
  failover_auth_error_cooldown_seconds?: number;
  failover_ban_mode?: LoadbalanceBanMode;
  failover_max_cooldown_strikes_before_ban?: number;
  failover_ban_duration_seconds?: number;
}

export interface LoadbalanceStrategyUpdate {
  name?: string;
  strategy_type?: LoadBalancingStrategy;
  failover_recovery_enabled?: boolean;
  failover_cooldown_seconds?: number;
  failover_failure_threshold?: number;
  failover_backoff_multiplier?: number;
  failover_max_cooldown_seconds?: number;
  failover_jitter_ratio?: number;
  failover_auth_error_cooldown_seconds?: number;
  failover_ban_mode?: LoadbalanceBanMode;
  failover_max_cooldown_strikes_before_ban?: number;
  failover_ban_duration_seconds?: number;
}

export interface ModelConfig {
  id: number;
  vendor_id?: number;
  vendor?: Vendor;
  api_family?: ApiFamily;
  model_id: string;
  display_name: string | null;
  model_type: ModelType;
  proxy_targets: ProxyTarget[];
  loadbalance_strategy_id: number | null;
  loadbalance_strategy: LoadbalanceStrategySummary | null;
  is_enabled: boolean;
  connections: Connection[];
  created_at: string;
  updated_at: string;
}

export interface ModelConfigListItem {
  id: number;
  vendor_id?: number;
  vendor?: Vendor;
  api_family?: ApiFamily;
  model_id: string;
  display_name: string | null;
  model_type: ModelType;
  proxy_targets: ProxyTarget[];
  loadbalance_strategy_id: number | null;
  loadbalance_strategy: LoadbalanceStrategySummary | null;
  is_enabled: boolean;
  connection_count: number;
  active_connection_count: number;
  health_success_rate: number | null;
  health_total_requests: number;
  created_at: string;
  updated_at: string;
}

export interface ModelConfigCreate {
  vendor_id?: number;
  api_family?: ApiFamily;
  model_id: string;
  display_name?: string | null;
  model_type?: ModelType;
  proxy_targets?: ProxyTarget[];
  loadbalance_strategy_id?: number | null;
  is_enabled?: boolean;
}

export interface ModelConfigUpdate {
  vendor_id?: number;
  api_family?: ApiFamily;
  model_id?: string;
  display_name?: string | null;
  model_type?: ModelType;
  proxy_targets?: ProxyTarget[];
  loadbalance_strategy_id?: number | null;
  is_enabled?: boolean;
}

export interface RequestLogEntry {
  id: number;
  model_id: string;
  resolved_target_model_id: string | null;
  profile_id: number;
  api_family?: ApiFamily;
  vendor_id?: number | null;
  vendor_key?: string | null;
  vendor_name?: string | null;
  endpoint_id: number | null;
  connection_id: number | null;
  ingress_request_id: string | null;
  attempt_number: number | null;
  provider_correlation_id: string | null;
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

export type StatisticsRequestLogEntry = Pick<
  RequestLogEntry,
  | "id"
  | "model_id"
  | "api_family"
  | "status_code"
  | "response_time_ms"
  | "input_tokens"
  | "output_tokens"
  | "total_tokens"
  | "cache_read_input_tokens"
  | "cache_creation_input_tokens"
  | "reasoning_tokens"
  | "total_cost_user_currency_micros"
  | "error_detail"
  | "created_at"
>;

export interface StatisticsRequestLogListResponse {
  items: StatisticsRequestLogEntry[];
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

export type RequestStatusFamily = "4xx" | "5xx";

export interface StatsRequestParams {
  request_id?: number;
  ingress_request_id?: string;
  model_id?: string;
  api_family?: ApiFamily;
  status_family?: RequestStatusFamily;
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
  group_by?: "model" | "api_family" | "endpoint";
  model_id?: string;
  api_family?: ApiFamily;
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

export interface ConnectionMetricsBatchParams {
  model_id: string;
  connection_ids: number[];
  summary_window_hours?: number;
}

export interface ConnectionMetricsBatchItem {
  connection_id: number;
  success_rate_24h: number | null;
  request_count_24h: number;
  p95_latency_ms: number | null;
  five_xx_rate: number | null;
  heuristic_failover_events: number;
  last_failover_like_at: string | null;
}

export interface ConnectionMetricsBatchResponse {
  items: ConnectionMetricsBatchItem[];
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
  | "api_family"
  | "model"
  | "endpoint"
  | "model_endpoint";

export interface SpendingReportParams {
  preset?: "today" | "last_7_days" | "last_30_days" | "custom" | "all";
  from_time?: string;
  to_time?: string;
  api_family?: ApiFamily;
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
  rpm: number;
}

export interface ThroughputStatsResponse {
  average_rpm: number;
  peak_rpm: number;
  current_rpm: number;
  total_requests: number;
  time_window_seconds: number;
  buckets: ThroughputBucket[];
}

export interface DashboardRouteSnapshot {
  model_id: string;
  model_config_id: number | null;
  model_label: string;
  endpoint_id: number;
  endpoint_label: string;
  active_connection_count: number;
  traffic_request_count_24h: number;
  request_count_24h: number;
  success_count_24h: number;
  error_count_24h: number;
  success_rate_24h: number | null;
}

export interface DashboardRealtimeUpdatePayload {
  request_log: RequestLogEntry;
  stats_summary_24h: StatsSummary;
  api_family_summary_24h: StatsSummary;
  spending_summary_30d: SpendingReportResponse;
  throughput_24h: ThroughputStatsResponse;
  routing_route_24h: DashboardRouteSnapshot | null;
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
