import type { ComponentType } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CircleHelp,
  Clock,
  Coins,
  Columns,
  Database,
  FileText,
  Zap,
} from "lucide-react";

export type TimeRange = "1h" | "24h" | "7d" | "all";
export type StatusFamily = "all" | "2xx" | "4xx" | "5xx" | "error";
export type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";
export type StreamFilter = "all" | "stream" | "non_stream";
export type RequestView = "overview" | "performance" | "tokens" | "cost" | "cache" | "errors" | "all";
export type TriageFilter =
  | "none"
  | "slowest"
  | "expensive"
  | "most_tokens"
  | "errors_only"
  | "unpriced_only";
export type DetailTab = "request" | "audit" | "json";

type OptionWithIcon<T> = {
  value: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const TIME_RANGES: readonly TimeRange[] = ["1h", "24h", "7d", "all"];
export const STATUS_FAMILY_OPTIONS: readonly StatusFamily[] = ["all", "2xx", "4xx", "5xx", "error"];
export const SPECIAL_TOKEN_FILTERS: readonly SpecialTokenFilter[] = [
  "all",
  "has_cached",
  "has_reasoning",
  "has_any_special",
  "missing_special",
];
export const STREAM_FILTERS: readonly StreamFilter[] = ["all", "stream", "non_stream"];
export const REQUEST_LIMIT_OPTIONS = [25, 50, 100, 200] as const;
export const DEFAULT_REQUEST_LIMIT = 100;

export const REQUEST_VIEW_OPTIONS: OptionWithIcon<RequestView>[] = [
  { value: "overview", label: "Overview", icon: Activity },
  { value: "performance", label: "Performance", icon: Zap },
  { value: "tokens", label: "Tokens", icon: FileText },
  { value: "cost", label: "Cost & Billing", icon: Coins },
  { value: "cache", label: "Cache", icon: Database },
  { value: "errors", label: "Errors", icon: AlertTriangle },
  { value: "all", label: "All Columns", icon: Columns },
];

export const TRIAGE_OPTIONS: OptionWithIcon<Exclude<TriageFilter, "none">>[] = [
  { value: "slowest", label: "Slowest", icon: Clock },
  { value: "expensive", label: "Most Expensive", icon: Coins },
  { value: "most_tokens", label: "Most Tokens", icon: FileText },
  { value: "errors_only", label: "Errors Only", icon: AlertCircle },
  { value: "unpriced_only", label: "Unpriced Only", icon: CircleHelp },
];

export const LATENCY_BUCKETS = [
  { value: "all", label: "All latencies" },
  { value: "under_500ms", label: "< 500ms" },
  { value: "between_500ms_1s", label: "500ms - 1s" },
  { value: "between_1s_3s", label: "1s - 3s" },
  { value: "over_3s", label: ">= 3s" },
] as const;

export type LatencyBucket = (typeof LATENCY_BUCKETS)[number]["value"];

export function parseEnumParam<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (value === null) return fallback;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseNonNegativeIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function parsePositiveIntParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseIdFilterParam(value: string | null): string {
  if (!value) return "__all__";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "__all__";
}

export function parseOptionalNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBooleanParam(value: string | null): boolean {
  return value === "true";
}

export function parseRequestLimitParam(value: string | null): number {
  if (value === null) return DEFAULT_REQUEST_LIMIT;
  const parsed = Number.parseInt(value, 10);
  return REQUEST_LIMIT_OPTIONS.includes(parsed as (typeof REQUEST_LIMIT_OPTIONS)[number])
    ? parsed
    : DEFAULT_REQUEST_LIMIT;
}

export function parseTokenInputValue(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

type BuildLogsPathParams = {
  connectionId?: number | string;
  detailTab?: DetailTab;
  endpointId?: number | string;
  modelId?: string;
  provider?: string;
  range?: TimeRange;
  requestId?: number | string;
  requestView?: RequestView;
  search?: string;
  special?: SpecialTokenFilter;
  status?: StatusFamily;
  stream?: StreamFilter;
};

export function buildLogsPath(params: BuildLogsPathParams = {}): string {
  const search = new URLSearchParams();

  if (params.modelId) search.set("model", params.modelId);
  if (params.provider && params.provider !== "all") search.set("provider", params.provider);
  if (params.connectionId !== undefined) search.set("connection", String(params.connectionId));
  if (params.endpointId !== undefined) search.set("endpoint", String(params.endpointId));
  if (params.range && params.range !== "24h") search.set("range", params.range);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.search) search.set("search", params.search);
  if (params.requestView && params.requestView !== "overview") search.set("request_view", params.requestView);
  if (params.stream && params.stream !== "all") search.set("stream", params.stream);
  if (params.special && params.special !== "all") search.set("special", params.special);
  if (params.requestId !== undefined) search.set("request_id", String(params.requestId));
  if (params.detailTab && params.detailTab !== "request") search.set("detail_tab", params.detailTab);

  const query = search.toString();
  return query ? `/logs?${query}` : "/logs";
}
