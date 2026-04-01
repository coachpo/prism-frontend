export interface MonitoringSettingsResponse {
  profile_id: number | null;
  monitoring_probe_interval_seconds: number;
}

export interface MonitoringSettingsUpdate {
  monitoring_probe_interval_seconds: number;
}

export interface MonitoringOverviewVendor {
  vendor_id: number;
  vendor_key: string;
  vendor_name: string;
  icon_key: string | null;
  model_count: number;
  connection_count: number;
  healthy_connection_count: number;
  degraded_connection_count: number;
  models: MonitoringOverviewModel[];
}

export interface MonitoringOverviewResponse {
  generated_at: string;
  vendors: MonitoringOverviewVendor[];
}

export interface MonitoringVendorModel {
  model_config_id: number;
  model_id: string;
  display_name: string | null;
  fused_status: string;
  connection_count: number;
  connections?: MonitoringOverviewConnection[];
}

export interface MonitoringOverviewModel extends MonitoringVendorModel {
  connections: MonitoringOverviewConnection[];
}

export interface MonitoringVendorResponse {
  generated_at: string;
  vendor_id: number;
  vendor_key: string;
  vendor_name: string;
  models: MonitoringVendorModel[];
}

export interface MonitoringConnectionHistoryPoint {
  checked_at: string;
  endpoint_ping_status: string;
  endpoint_ping_ms: number | null;
  conversation_status: string;
  conversation_delay_ms: number | null;
  failure_kind: string | null;
}

interface MonitoringConnectionBase {
  connection_id: number;
  connection_name: string | null;
  endpoint_id: number;
  endpoint_name: string;
  last_probe_status: string | null;
  circuit_state: string | null;
  live_p95_latency_ms: number | null;
  last_live_failure_kind: string | null;
  last_live_failure_at: string | null;
  last_live_success_at: string | null;
  endpoint_ping_status: string;
  endpoint_ping_ms: number | null;
  conversation_status: string;
  conversation_delay_ms: number | null;
  fused_status: string;
  recent_history: MonitoringConnectionHistoryPoint[];
}

export interface MonitoringOverviewConnection extends MonitoringConnectionBase {
  monitoring_probe_interval_seconds: number;
  last_probe_at: string | null;
}

export interface MonitoringModelConnection extends MonitoringConnectionBase {}

export interface MonitoringModelResponse {
  generated_at: string;
  vendor_id: number;
  vendor_key: string;
  vendor_name: string;
  model_config_id: number;
  model_id: string;
  display_name: string | null;
  connections: MonitoringModelConnection[];
}

export interface MonitoringManualProbeResult {
  connection_id: number;
  checked_at: string;
  endpoint_ping_status: string;
  endpoint_ping_ms: number | null;
  conversation_status: string;
  conversation_delay_ms: number | null;
  fused_status: string;
  failure_kind: string | null;
  detail: string;
}
