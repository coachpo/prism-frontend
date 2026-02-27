// TypeScript types matching backend Pydantic schemas exactly

// --- Provider ---
export interface Provider {
  id: number;
  name: string;
  provider_type: string;
  description: string | null;
  audit_enabled: boolean;
  audit_capture_bodies: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderUpdate {
  audit_enabled?: boolean;
  audit_capture_bodies?: boolean;
}

// --- Endpoint (Global) ---
export interface Endpoint {
  id: number;
  name: string;
  base_url: string;
  api_key: string; // Masked in responses usually, but present
  created_at: string;
  updated_at: string;
}

export interface EndpointCreate {
  name: string;
  base_url: string;
  api_key: string;
}

export interface EndpointUpdate {
  name?: string;
  base_url?: string;
  api_key?: string;
}

// --- Connection (Model-scoped) ---
export interface Connection {
  id: number;
  model_config_id: number;
  endpoint_id: number;
  endpoint?: Endpoint; // Optional expanded endpoint details
  is_active: boolean;
  priority: number;
  description: string | null;
  auth_type: string | null;
  custom_headers: Record<string, string> | null;
  pricing_enabled: boolean;
  pricing_unit: "PER_1K" | "PER_1M" | null;
  pricing_currency_code: string | null;
  input_price: string | null;
  output_price: string | null;
  cached_input_price: string | null;
  cache_creation_price: string | null;
  reasoning_price: string | null;
  missing_special_token_price_policy: "MAP_TO_OUTPUT" | "ZERO_COST";
  forward_stream_options: boolean;
  pricing_config_version: number;
  health_status: string;
  health_detail: string | null;
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionCreate {
  endpoint_id?: number; // One of endpoint_id or endpoint_create is required
  endpoint_create?: EndpointCreate;
  is_active?: boolean;
  priority?: number;
  description?: string | null;
  auth_type?: string | null;
  custom_headers?: Record<string, string> | null;
  pricing_enabled?: boolean;
  pricing_unit?: "PER_1K" | "PER_1M" | null;
  pricing_currency_code?: string | null;
  input_price?: string | null;
  output_price?: string | null;
  cached_input_price?: string | null;
  cache_creation_price?: string | null;
  reasoning_price?: string | null;
  missing_special_token_price_policy?: "MAP_TO_OUTPUT" | "ZERO_COST";
  forward_stream_options?: boolean;
}

export interface ConnectionUpdate {
  endpoint_id?: number;
  endpoint_create?: EndpointCreate;
  is_active?: boolean;
  priority?: number;
  description?: string | null;
  auth_type?: string | null;
  custom_headers?: Record<string, string> | null;
  pricing_enabled?: boolean;
  pricing_unit?: "PER_1K" | "PER_1M" | null;
  pricing_currency_code?: string | null;
  input_price?: string | null;
  output_price?: string | null;
  cached_input_price?: string | null;
  cache_creation_price?: string | null;
  reasoning_price?: string | null;
  missing_special_token_price_policy?: "MAP_TO_OUTPUT" | "ZERO_COST";
  forward_stream_options?: boolean;
}

export interface HealthCheckResponse {
  connection_id: number;
  health_status: string;
  checked_at: string;
  detail: string;
  response_time_ms: number;
}

export interface ConnectionOwnerResponse {
  connection_id: number;
  model_config_id: number;
  model_id: string;
  connection_description: string | null;
  endpoint_id: number;
  endpoint_name: string;
  endpoint_base_url: string;
}

export interface ConnectionDropdownItem {
  id: number;
  endpoint_id: number;
  description: string | null;
}

export interface ConnectionDropdownResponse {
  items: ConnectionDropdownItem[];
}

// --- Model Config ---
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
  model_id?: string;
  provider_type?: string;
  status_code?: number;
  success?: boolean;
  from_time?: string;
  to_time?: string;
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

export interface ConnectionSuccessRate {
  connection_id: number;
  total_requests: number;
  success_count: number;
  error_count: number;
  success_rate: number | null;
}

export interface ConfigEndpointExport {
  endpoint_id?: number | null;
  name: string;
  base_url: string;
  api_key: string;
}

export interface ConfigConnectionExport {
  connection_id?: number | null;
  endpoint_id: number;
  is_active: boolean;
  priority: number;
  description: string | null;
  auth_type: string | null;
  custom_headers: Record<string, string> | null;
  pricing_enabled: boolean;
  pricing_unit: "PER_1K" | "PER_1M" | null;
  pricing_currency_code: string | null;
  input_price: string | null;
  output_price: string | null;
  cached_input_price: string | null;
  cache_creation_price: string | null;
  reasoning_price: string | null;
  missing_special_token_price_policy: "MAP_TO_OUTPUT" | "ZERO_COST";
  pricing_config_version: number;
  forward_stream_options: boolean;
}

export interface ConfigModelExport {
  provider_type: string;
  model_id: string;
  display_name: string | null;
  model_type: ModelType;
  redirect_to: string | null;
  lb_strategy: LoadBalancingStrategy;
  is_enabled: boolean;
  failover_recovery_enabled: boolean;
  failover_recovery_cooldown_seconds: number;
  connections: ConfigConnectionExport[];
}

export interface ConfigProviderExport {
  name: string;
  provider_type: string;
  description: string | null;
  audit_enabled: boolean;
  audit_capture_bodies: boolean;
}

export interface ConfigEndpointFxRateExport {
  model_id: string;
  endpoint_id: number;
  fx_rate: string;
}

export interface ConfigUserSettingsExport {
  report_currency_code: string;
  report_currency_symbol: string;
  endpoint_fx_mappings: ConfigEndpointFxRateExport[];
  timezone_preference?: string | null;
}

export interface ConfigExportResponse {
  version: 5;
  exported_at: string;
  providers: ConfigProviderExport[];
  endpoints: ConfigEndpointExport[];
  models: ConfigModelExport[];
  user_settings?: ConfigUserSettingsExport | null;
  header_blocklist_rules: HeaderBlocklistRuleExport[];
}

export interface ConfigImportRequest {
  version: 5;
  exported_at?: string;
  providers: ConfigProviderExport[];
  endpoints: ConfigEndpointExport[];
  models: ConfigModelExport[];
  user_settings?: ConfigUserSettingsExport | null;
  header_blocklist_rules?: HeaderBlocklistRuleExport[];
}

export interface ConfigImportResponse {
  providers_imported: number;
  endpoints_imported: number;
  models_imported: number;
  connections_imported: number;
}

export interface AuditLogListItem {
  id: number;
  request_log_id: number | null;
  provider_id: number;
  model_id: string;
  endpoint_id: number | null;
  connection_id: number | null;
  endpoint_base_url: string | null;
  endpoint_description: string | null;
  request_method: string;
  request_url: string;
  request_headers: string;
  request_body_preview: string | null;
  response_status: number;
  is_stream: boolean;
  duration_ms: number;
  created_at: string;
}

export interface AuditLogDetail {
  id: number;
  request_log_id: number | null;
  provider_id: number;
  model_id: string;
  endpoint_id: number | null;
  connection_id: number | null;
  endpoint_base_url: string | null;
  endpoint_description: string | null;
  request_method: string;
  request_url: string;
  request_headers: string;
  request_body: string | null;
  response_status: number;
  response_headers: string | null;
  response_body: string | null;
  is_stream: boolean;
  duration_ms: number;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLogListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogParams {
  provider_id?: number;
  model_id?: string;
  status_code?: number;
  endpoint_id?: number;
  connection_id?: number;
  from_time?: string;
  to_time?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogDeleteResponse {
  deleted_count: number;
}

export interface BatchDeleteResponse {
  deleted_count: number;
}

export interface EndpointFxMapping {
  model_id: string;
  endpoint_id: number;
  fx_rate: string;
}

export interface CostingSettingsResponse {
  report_currency_code: string;
  report_currency_symbol: string;
  endpoint_fx_mappings: EndpointFxMapping[];
  timezone_preference?: string | null;
}

export interface CostingSettingsUpdate {
  report_currency_code: string;
  report_currency_symbol: string;
  endpoint_fx_mappings: EndpointFxMapping[];
  timezone_preference?: string | null;
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
  preset?: "today" | "24h" | "last_7_days" | "7d" | "last_30_days" | "30d" | "custom" | "all";
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

export interface HeaderBlocklistRule {
  id: number;
  name: string;
  match_type: "exact" | "prefix";
  pattern: string;
  enabled: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeaderBlocklistRuleCreate {
  name: string;
  match_type: "exact" | "prefix";
  pattern: string;
  enabled?: boolean;
}

export interface HeaderBlocklistRuleUpdate {
  name?: string;
  match_type?: "exact" | "prefix";
  pattern?: string;
  enabled?: boolean;
}

export interface HeaderBlocklistRuleExport {
  name: string;
  match_type: "exact" | "prefix";
  pattern: string;
  enabled: boolean;
  is_system: boolean;
}
