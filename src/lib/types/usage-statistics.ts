import type { ApiFamily } from "./vendor";

export const USAGE_SNAPSHOT_PRESETS = ["all", "7h", "24h", "7d"] as const;
export type UsageSnapshotPreset = (typeof USAGE_SNAPSHOT_PRESETS)[number];

export const USAGE_CHART_GRANULARITIES = ["hourly", "daily"] as const;
export type UsageChartGranularity = (typeof USAGE_CHART_GRANULARITIES)[number];

export interface UsageStatisticsChartGranularityState {
  requestTrends: UsageChartGranularity;
  tokenUsageTrends: UsageChartGranularity;
  tokenTypeBreakdown: UsageChartGranularity;
  costOverview: UsageChartGranularity;
}

export type UsageStatisticsChartKey = keyof UsageStatisticsChartGranularityState;

export interface UsageStatisticsPageState {
  selectedTimeRange: UsageSnapshotPreset;
  selectedModelLines: string[];
  chartGranularity: UsageStatisticsChartGranularityState;
}

export interface UsageSnapshotTimeRange {
  preset: UsageSnapshotPreset;
  start_at: string | null;
  end_at: string;
}

export interface UsageSnapshotCurrency {
  code: string;
  symbol: string;
}

export interface UsageSnapshotOverview {
  total_requests: number;
  success_requests: number;
  failed_requests: number;
  success_rate: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  average_rpm: number;
  average_tpm: number;
  total_cost_micros: number;
  rolling_window_minutes?: number;
  rolling_request_count?: number;
  rolling_token_count?: number;
  rolling_rpm?: number;
  rolling_tpm?: number;
}

export interface UsageServiceHealthPoint {
  bucket_start: string;
  request_count: number;
  success_count: number;
  failed_count: number;
  availability_percentage: number | null;
}

export type UsageServiceHealthCellStatus = "ok" | "degraded" | "down" | "empty";

export interface UsageServiceHealthCell {
  bucket_start: string;
  request_count: number;
  success_count: number;
  failed_count: number;
  availability_percentage: number | null;
  status: UsageServiceHealthCellStatus;
}

export interface UsageServiceHealth {
  availability_percentage: number | null;
  request_count: number;
  success_count: number;
  failed_count: number;
  days?: number;
  interval_minutes?: number;
  daily: UsageServiceHealthPoint[];
  cells?: UsageServiceHealthCell[];
}

export interface UsageRequestTrendPoint {
  bucket_start: string;
  request_count: number;
  success_count: number;
  failed_count: number;
  rpm: number;
}

export interface UsageRequestTrendSeries {
  key: string;
  label: string;
  total_requests: number;
  points: UsageRequestTrendPoint[];
}

export interface UsageRequestTrends {
  hourly: UsageRequestTrendSeries[];
  daily: UsageRequestTrendSeries[];
}

export interface UsageTokenTrendPoint {
  bucket_start: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  tpm: number;
}

export interface UsageTokenTrendSeries {
  key: string;
  label: string;
  total_tokens: number;
  points: UsageTokenTrendPoint[];
}

export interface UsageTokenUsageTrends {
  hourly: UsageTokenTrendSeries[];
  daily: UsageTokenTrendSeries[];
}

export interface UsageTokenTypeBreakdownPoint {
  bucket_start: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
}

export interface UsageTokenTypeBreakdown {
  hourly: UsageTokenTypeBreakdownPoint[];
  daily: UsageTokenTypeBreakdownPoint[];
}

export interface UsageCostOverviewPoint {
  bucket_start: string;
  total_cost_micros: number;
}

export interface UsageCostOverview {
  total_cost_micros: number;
  priced_request_count: number;
  unpriced_request_count: number;
  hourly: UsageCostOverviewPoint[];
  daily: UsageCostOverviewPoint[];
}

export interface UsageEndpointModelStatistic {
  model_id: string;
  model_label: string;
  request_count: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  total_tokens: number;
  total_cost_micros: number;
}

export interface UsageEndpointStatistic {
  endpoint_id: number | null;
  endpoint_label: string;
  request_count: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  total_tokens: number;
  total_cost_micros: number;
  models: UsageEndpointModelStatistic[];
}

export interface UsageModelStatistic {
  model_id: string;
  model_label: string;
  api_family: ApiFamily;
  request_count: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  total_tokens: number;
  total_cost_micros: number;
}

export interface UsageProxyApiKeyReference {
  label: string | null;
  key_prefix: string | null;
}

export interface UsageRequestEventModelFilter {
  model_id: string;
  label: string;
}

export interface UsageRequestEventEndpointFilter {
  endpoint_id: number | null;
  label: string;
}

export interface UsageRequestEventApiFamilyFilter {
  api_family: ApiFamily;
  label: string;
}

export interface UsageRequestEventProxyApiKeyFilter {
  proxy_api_key_id: number | null;
  label: string;
  key_prefix: string | null;
}

export interface UsageRequestEventAvailableFilters {
  models: UsageRequestEventModelFilter[];
  endpoints: UsageRequestEventEndpointFilter[];
  api_families: UsageRequestEventApiFamilyFilter[];
  proxy_api_keys: UsageRequestEventProxyApiKeyFilter[];
}

export interface UsageSnapshotRequestEventItem {
  ingress_request_id: string;
  created_at: string;
  model_id: string;
  model_label: string;
  resolved_target_model_id: string | null;
  api_family: ApiFamily;
  endpoint_id: number | null;
  endpoint_label: string;
  connection_id: number | null;
  status_code: number;
  success_flag: boolean;
  attempt_count: number;
  request_path: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
  total_cost_micros: number;
  proxy_api_key: UsageProxyApiKeyReference;
}

export interface UsageRequestEventsSection {
  total: number;
  shown_count?: number;
  render_limit?: number;
  available_filters?: UsageRequestEventAvailableFilters;
  items: UsageSnapshotRequestEventItem[];
}

export interface UsageProxyApiKeyStatistic {
  proxy_api_key_id: number | null;
  proxy_api_key_label: string;
  key_prefix: string | null;
  request_count: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  total_tokens: number;
  total_cost_micros: number;
}

export interface UsageSnapshotResponse {
  generated_at: string;
  time_range: UsageSnapshotTimeRange;
  currency: UsageSnapshotCurrency;
  overview: UsageSnapshotOverview;
  service_health: UsageServiceHealth;
  request_trends: UsageRequestTrends;
  token_usage_trends: UsageTokenUsageTrends;
  token_type_breakdown: UsageTokenTypeBreakdown;
  cost_overview: UsageCostOverview;
  endpoint_statistics: UsageEndpointStatistic[];
  model_statistics: UsageModelStatistic[];
  request_events: UsageRequestEventsSection;
  proxy_api_key_statistics: UsageProxyApiKeyStatistic[];
}
