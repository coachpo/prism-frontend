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

// --- Endpoint ---
export interface Endpoint {
  id: number;
  model_config_id: number;
  base_url: string;
  api_key: string;
  is_active: boolean;
  priority: number;
  description: string | null;
  auth_type: string | null;
  custom_headers: Record<string, string> | null;
  health_status: string;
  health_detail: string | null;
  last_health_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface EndpointCreate {
  base_url: string;
  api_key: string;
  is_active?: boolean;
  priority?: number;
  description?: string | null;
  auth_type?: string | null;
  custom_headers?: Record<string, string> | null;
}

export interface EndpointUpdate {
  base_url?: string;
  api_key?: string;
  is_active?: boolean;
  priority?: number;
  description?: string | null;
  auth_type?: string | null;
  custom_headers?: Record<string, string> | null;
}

export interface HealthCheckResponse {
  endpoint_id: number;
  health_status: string;
  checked_at: string;
  detail: string;
  response_time_ms: number;
}

export interface EndpointOwnerResponse {
  endpoint_id: number;
  model_config_id: number;
  model_id: string;
  endpoint_description: string | null;
  endpoint_base_url: string;
}

// --- Model Config ---
export interface ModelConfig {
  id: number;
  provider_id: number;
  provider: Provider;
  model_id: string;
  display_name: string | null;
  model_type: string;
  redirect_to: string | null;
  lb_strategy: string;
  is_enabled: boolean;
  endpoints: Endpoint[];
  created_at: string;
  updated_at: string;
}

export interface ModelConfigListItem {
  id: number;
  provider_id: number;
  provider: Provider;
  model_id: string;
  display_name: string | null;
  model_type: string;
  redirect_to: string | null;
  lb_strategy: string;
  is_enabled: boolean;
  endpoint_count: number;
  active_endpoint_count: number;
  health_success_rate: number | null;
  health_total_requests: number;
  created_at: string;
  updated_at: string;
}

export interface ModelConfigCreate {
  provider_id: number;
  model_id: string;
  display_name?: string | null;
  model_type?: string;
  redirect_to?: string | null;
  lb_strategy?: string;
  is_enabled?: boolean;
}

export interface ModelConfigUpdate {
  provider_id?: number;
  model_id?: string;
  display_name?: string | null;
  model_type?: string;
  redirect_to?: string | null;
  lb_strategy?: string;
  is_enabled?: boolean;
}

export interface RequestLogEntry {
  id: number;
  model_id: string;
  provider_type: string;
  endpoint_id: number | null;
  endpoint_base_url: string | null;
  endpoint_description: string | null;
  status_code: number;
  response_time_ms: number;
  is_stream: boolean;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
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
  endpoint_id?: number;
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
}

export interface EndpointSuccessRate {
  endpoint_id: number;
  total_requests: number;
  success_count: number;
  error_count: number;
  success_rate: number | null;
}

export interface ConfigEndpointExport {
  base_url: string;
  api_key: string;
  is_active: boolean;
  priority: number;
  description: string | null;
  auth_type: string | null;
  custom_headers: Record<string, string> | null;
}

export interface ConfigModelExport {
  provider_type: string;
  model_id: string;
  display_name: string | null;
  model_type: string;
  redirect_to: string | null;
  lb_strategy: string;
  is_enabled: boolean;
  endpoints: ConfigEndpointExport[];
}

export interface ConfigProviderExport {
  name: string;
  provider_type: string;
  description: string | null;
  audit_enabled: boolean;
  audit_capture_bodies: boolean;
}

export interface ConfigExportResponse {
  version: number;
  exported_at: string;
  providers: ConfigProviderExport[];
  models: ConfigModelExport[];
  header_blocklist_rules: HeaderBlocklistRuleExport[];
}

export interface ConfigImportRequest {
  version: number;
  exported_at?: string;
  providers: ConfigProviderExport[];
  models: ConfigModelExport[];
  header_blocklist_rules?: HeaderBlocklistRuleExport[];
}

export interface ConfigImportResponse {
  providers_imported: number;
  models_imported: number;
  endpoints_imported: number;
}

export interface AuditLogListItem {
  id: number;
  request_log_id: number | null;
  provider_id: number;
  model_id: string;
  endpoint_id: number | null;
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
