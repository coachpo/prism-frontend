import type { LoadBalancingStrategy, ModelType } from "./model-stats";

export interface ConfigEndpointExport {
  endpoint_id: number;
  name: string;
  base_url: string;
  api_key: string;
}

export interface ConfigPricingTemplateExport {
  pricing_template_id: number;
  name: string;
  description: string | null;
  pricing_unit: "PER_1M";
  pricing_currency_code: string;
  input_price: string;
  output_price: string;
  cached_input_price: string | null;
  cache_creation_price: string | null;
  reasoning_price: string | null;
  missing_special_token_price_policy: "MAP_TO_OUTPUT" | "ZERO_COST";
  version: number;
}

export interface ConfigConnectionExport {
  connection_id: number;
  endpoint_id: number;
  pricing_template_id: number | null;
  is_active: boolean;
  priority: number;
  name: string | null;
  auth_type: string | null;
  custom_headers: Record<string, string> | null;
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
  version: 2;
  exported_at: string;
  endpoints: ConfigEndpointExport[];
  pricing_templates: ConfigPricingTemplateExport[];
  models: ConfigModelExport[];
  user_settings?: ConfigUserSettingsExport | null;
  header_blocklist_rules: HeaderBlocklistRuleExport[];
}

export interface ConfigImportRequest {
  version: 2;
  exported_at?: string;
  endpoints: ConfigEndpointExport[];
  pricing_templates: ConfigPricingTemplateExport[];
  models: ConfigModelExport[];
  user_settings?: ConfigUserSettingsExport | null;
  header_blocklist_rules?: HeaderBlocklistRuleExport[];
}

export interface ConfigImportResponse {
  endpoints_imported: number;
  pricing_templates_imported: number;
  models_imported: number;
  connections_imported: number;
}

export interface AuditLogListItem {
  id: number;
  request_log_id: number | null;
  profile_id: number;
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
  profile_id: number;
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
}
