import type {
  AutoRecovery,
  LoadBalancingStrategy,
  ModelType,
  ProxyTarget,
} from "./model-stats";
import type { ApiFamily } from "./vendor";

export interface ConfigEndpointExport {
  name: string;
  base_url: string;
  api_key: string;
  position?: number | null;
}

export type ConfigEndpointImport = ConfigEndpointExport;

export interface ConfigPricingTemplateExport {
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

export type ConfigPricingTemplateImport = ConfigPricingTemplateExport;

export interface ConfigLoadbalanceStrategyExport {
  name: string;
  strategy_type: LoadBalancingStrategy;
  auto_recovery: AutoRecovery;
}

export interface ConfigLoadbalanceStrategyImport {
  name: string;
  strategy_type: LoadBalancingStrategy;
  auto_recovery: AutoRecovery;
}

export interface ConfigConnectionExport {
  endpoint_name: string;
  pricing_template_name: string | null;
  is_active: boolean;
  priority: number;
  name: string | null;
  auth_type: string | null;
  custom_headers: Record<string, string> | null;
  qps_limit: number | null;
  max_in_flight_non_stream: number | null;
  max_in_flight_stream: number | null;
}

export interface ConfigConnectionImport {
  endpoint_name: string;
  pricing_template_name?: string | null;
  is_active: boolean;
  priority: number;
  name: string | null;
  auth_type: string | null;
  custom_headers: Record<string, string> | null;
  qps_limit?: number | null;
  max_in_flight_non_stream?: number | null;
  max_in_flight_stream?: number | null;
}

export interface ConfigModelExport {
  vendor_key: string;
  api_family: ApiFamily;
  model_id: string;
  display_name: string | null;
  model_type: ModelType;
  proxy_targets: ProxyTarget[];
  loadbalance_strategy_name: string | null;
  is_enabled: boolean;
  connections: ConfigConnectionExport[];
}

export interface ConfigModelImport {
  vendor_key: string;
  api_family: ApiFamily;
  model_id: string;
  display_name: string | null;
  model_type: ModelType;
  proxy_targets: ProxyTarget[];
  loadbalance_strategy_name: string | null;
  is_enabled: boolean;
  connections: ConfigConnectionImport[];
}

export interface ConfigEndpointFxRateExport {
  model_id: string;
  endpoint_name: string;
  fx_rate: string;
}

export interface ConfigEndpointFxRateImport {
  model_id: string;
  endpoint_name: string;
  fx_rate: string;
}

export interface ConfigUserSettingsExport {
  report_currency_code: string;
  report_currency_symbol: string;
  endpoint_fx_mappings: ConfigEndpointFxRateExport[];
  timezone_preference?: string | null;
}

export interface ConfigUserSettingsImport {
  report_currency_code?: string;
  report_currency_symbol?: string;
  endpoint_fx_mappings: ConfigEndpointFxRateImport[];
  timezone_preference?: string | null;
}

export interface ConfigVendorExport {
  key: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  audit_enabled: boolean;
  audit_capture_bodies: boolean;
}

export type ConfigVendorImport = ConfigVendorExport;

export interface ConfigExportResponse {
  version: 1;
  exported_at: string;
  vendors: ConfigVendorExport[];
  endpoints: ConfigEndpointExport[];
  pricing_templates: ConfigPricingTemplateExport[];
  loadbalance_strategies: ConfigLoadbalanceStrategyExport[];
  models: ConfigModelExport[];
  user_settings?: ConfigUserSettingsExport | null;
  header_blocklist_rules: HeaderBlocklistRuleExport[];
}

export interface ConfigImportRequest {
  version: 1;
  exported_at?: string;
  vendors: ConfigVendorImport[];
  endpoints: ConfigEndpointImport[];
  pricing_templates: ConfigPricingTemplateImport[];
  loadbalance_strategies: ConfigLoadbalanceStrategyImport[];
  models: ConfigModelImport[];
  user_settings?: ConfigUserSettingsImport | null;
  header_blocklist_rules?: HeaderBlocklistRuleExport[];
}

export interface ConfigImportResponse {
  endpoints_imported: number;
  pricing_templates_imported: number;
  strategies_imported: number;
  models_imported: number;
  connections_imported: number;
}

export interface AuditLogListItem {
  id: number;
  request_log_id: number | null;
  profile_id: number;
  vendor_id?: number;
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
  vendor_id?: number;
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
  request_log_id?: number;
  vendor_id?: number;
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
  accepted: boolean;
}

export interface BatchDeleteResponse {
  accepted: boolean;
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

export interface TimezonePreferenceResponse {
  timezone_preference?: string | null;
}

export interface CostingSettingsUpdate {
  report_currency_code: string;
  report_currency_symbol: string;
  endpoint_fx_mappings: EndpointFxMapping[];
  timezone_preference?: string | null;
}

export interface TimezonePreferenceUpdate {
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
