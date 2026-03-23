export const TIME_RANGE_OPTIONS = ["1h", "6h", "24h", "7d", "30d", "all"] as const;
export type TimeRange = (typeof TIME_RANGE_OPTIONS)[number];

export const OUTCOME_OPTIONS = ["all", "success", "error"] as const;
export type OutcomeFilter = (typeof OUTCOME_OPTIONS)[number];

export const STREAM_OPTIONS = ["all", "yes", "no"] as const;
export type StreamFilter = (typeof STREAM_OPTIONS)[number];

export const STATUS_FAMILY_OPTIONS = ["all", "4xx", "5xx"] as const;
export type StatusFamilyFilter = (typeof STATUS_FAMILY_OPTIONS)[number];

export const LATENCY_BUCKET_OPTIONS = ["all", "fast", "normal", "slow", "very_slow"] as const;
export type LatencyBucket = (typeof LATENCY_BUCKET_OPTIONS)[number];

export const VIEW_OPTIONS = ["all", "compact"] as const;
export type ViewMode = (typeof VIEW_OPTIONS)[number];

export const DETAIL_TAB_OPTIONS = ["overview", "audit"] as const;
export type DetailTab = (typeof DETAIL_TAB_OPTIONS)[number];

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const DEFAULTS = {
  limit: 50,
  offset: 0,
  time_range: "24h" as TimeRange,
  status_family: "all" as StatusFamilyFilter,
  outcome_filter: "all" as OutcomeFilter,
  stream_filter: "all" as StreamFilter,
  latency_bucket: "all" as LatencyBucket,
  view: "all" as ViewMode,
  detail_tab: "overview" as DetailTab,
  priced_only: false,
  billable_only: false,
  triage: false,
} as const;

export interface RequestLogPageState {
  // Server filters
  model_id: string;
  provider_type: string;
  connection_id: string;
  endpoint_id: string;
  time_range: TimeRange;
  status_family: StatusFamilyFilter;
  // Client filters
  search: string;
  outcome_filter: OutcomeFilter;
  stream_filter: StreamFilter;
  latency_bucket: LatencyBucket;
  token_min: string;
  token_max: string;
  priced_only: boolean;
  billable_only: boolean;
  special_token_filter: string;
  // Presentation
  view: ViewMode;
  triage: boolean;
  // Pagination
  limit: number;
  offset: number;
  // Investigation
  request_id: string;
  detail_tab: DetailTab;
}

function parseEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return fallback;
}

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function parsePageState(params: URLSearchParams): RequestLogPageState {
  return {
    model_id: params.get("model_id") ?? "",
    provider_type: params.get("provider_type") ?? "",
    connection_id: params.get("connection_id") ?? "",
    endpoint_id: params.get("endpoint_id") ?? "",
    time_range: parseEnum(params.get("time_range"), TIME_RANGE_OPTIONS, DEFAULTS.time_range),
    status_family: parseEnum(params.get("status_family"), STATUS_FAMILY_OPTIONS, DEFAULTS.status_family),
    search: params.get("search") ?? "",
    outcome_filter: parseEnum(params.get("outcome_filter"), OUTCOME_OPTIONS, DEFAULTS.outcome_filter),
    stream_filter: parseEnum(params.get("stream_filter"), STREAM_OPTIONS, DEFAULTS.stream_filter),
    latency_bucket: parseEnum(params.get("latency_bucket"), LATENCY_BUCKET_OPTIONS, DEFAULTS.latency_bucket),
    token_min: params.get("token_min") ?? "",
    token_max: params.get("token_max") ?? "",
    priced_only: params.get("priced_only") === "true",
    billable_only: params.get("billable_only") === "true",
    special_token_filter: params.get("special_token_filter") ?? "",
    view: parseEnum(params.get("view"), VIEW_OPTIONS, DEFAULTS.view),
    triage: params.get("triage") === "true",
    limit: parseIntParam(params.get("limit"), DEFAULTS.limit),
    offset: parseIntParam(params.get("offset"), DEFAULTS.offset),
    request_id: params.get("request_id") ?? "",
    detail_tab: parseEnum(params.get("detail_tab"), DETAIL_TAB_OPTIONS, DEFAULTS.detail_tab),
  };
}

export function stateToParams(state: RequestLogPageState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.model_id) p.set("model_id", state.model_id);
  if (state.provider_type) p.set("provider_type", state.provider_type);
  if (state.connection_id) p.set("connection_id", state.connection_id);
  if (state.endpoint_id) p.set("endpoint_id", state.endpoint_id);
  if (state.time_range !== DEFAULTS.time_range) p.set("time_range", state.time_range);
  if (state.status_family !== DEFAULTS.status_family) p.set("status_family", state.status_family);
  if (state.search) p.set("search", state.search);
  if (state.outcome_filter !== DEFAULTS.outcome_filter) p.set("outcome_filter", state.outcome_filter);
  if (state.stream_filter !== DEFAULTS.stream_filter) p.set("stream_filter", state.stream_filter);
  if (state.latency_bucket !== DEFAULTS.latency_bucket) p.set("latency_bucket", state.latency_bucket);
  if (state.token_min) p.set("token_min", state.token_min);
  if (state.token_max) p.set("token_max", state.token_max);
  if (state.priced_only) p.set("priced_only", "true");
  if (state.billable_only) p.set("billable_only", "true");
  if (state.special_token_filter) p.set("special_token_filter", state.special_token_filter);
  if (state.view !== DEFAULTS.view) p.set("view", state.view);
  if (state.triage) p.set("triage", "true");
  if (state.limit !== DEFAULTS.limit) p.set("limit", String(state.limit));
  if (state.offset !== DEFAULTS.offset) p.set("offset", String(state.offset));
  if (state.request_id) p.set("request_id", state.request_id);
  if (state.request_id && state.detail_tab !== DEFAULTS.detail_tab) p.set("detail_tab", state.detail_tab);
  return p;
}

export function timeRangeToFromTime(range: TimeRange): string | undefined {
  if (range === "all") return undefined;
  const now = Date.now();
  const ms: Record<string, number> = { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
  return new Date(now - (ms[range] ?? 86400000)).toISOString();
}
