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
export type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";
export type OutcomeFilter = "all" | "success" | "error";
export type StreamFilter = "all" | "stream" | "non_stream";
export type LatencyBucket = "all" | "under_500ms" | "between_500ms_1s" | "between_1s_3s" | "over_3s";
export type ViewType = "overview" | "performance" | "tokens" | "cost" | "cache" | "errors" | "all";
export type TriageFilter = "none" | "slowest" | "expensive" | "most_tokens" | "errors_only" | "unpriced_only";
export const REQUEST_DETAIL_TABS = ["overview", "audit"] as const;
export type RequestDetailTab = (typeof REQUEST_DETAIL_TABS)[number];

export type OptionWithIcon<T> = {
  value: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const REQUEST_TIME_RANGES: readonly TimeRange[] = ["1h", "24h", "7d", "all"];
export const REQUEST_SPECIAL_TOKEN_FILTERS: readonly SpecialTokenFilter[] = [
  "all",
  "has_cached",
  "has_reasoning",
  "has_any_special",
  "missing_special",
];
export const REQUEST_OUTCOME_FILTERS: readonly OutcomeFilter[] = ["all", "success", "error"];
export const REQUEST_STREAM_FILTERS: readonly StreamFilter[] = ["all", "stream", "non_stream"];
export const REQUEST_LIMIT_OPTIONS = [25, 50, 100, 200] as const;
export const DEFAULT_REQUEST_LIMIT = 100;

export const LATENCY_BUCKETS: { value: LatencyBucket; label: string }[] = [
  { value: "all", label: "All latencies" },
  { value: "under_500ms", label: "< 500ms" },
  { value: "between_500ms_1s", label: "500ms - 1s" },
  { value: "between_1s_3s", label: "1s - 3s" },
  { value: "over_3s", label: ">= 3s" },
];

export const VIEW_OPTIONS: OptionWithIcon<ViewType>[] = [
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

export function parseEnumParam<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (value === null) return fallback;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseNonNegativeIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function parseOptionalNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseIdFilterParam(value: string | null): string {
  if (!value) return "__all__";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "__all__";
}

export function parseRequestLimitParam(value: string | null): number {
  if (value === null) return DEFAULT_REQUEST_LIMIT;
  const parsed = Number.parseInt(value, 10);
  return REQUEST_LIMIT_OPTIONS.includes(parsed as (typeof REQUEST_LIMIT_OPTIONS)[number])
    ? parsed
    : DEFAULT_REQUEST_LIMIT;
}

export function parsePositiveIntParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseBooleanParam(value: string | null): boolean {
  return value === "true";
}

export function parseTokenInputValue(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function getFromTime(timeRange: TimeRange): string | undefined {
  const now = new Date();
  if (timeRange === "1h") {
    return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  }
  if (timeRange === "24h") {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
  if (timeRange === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  return undefined;
}
