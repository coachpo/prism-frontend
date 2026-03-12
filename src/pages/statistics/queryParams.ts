import type { SpendingGroupBy } from "@/lib/types";

export type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";

export type OperationsStatusFilter = "all" | "success" | "4xx" | "5xx" | "error";
export type InvestigateTab = "errors" | "slow" | "costly";

export const STATISTICS_TABS = ["operations", "throughput", "spending"] as const;
export const OPERATIONS_TIME_RANGES = ["1h", "24h", "7d", "all"] as const;
export const OPERATIONS_SPECIAL_TOKEN_FILTERS: readonly SpecialTokenFilter[] = [
  "all",
  "has_cached",
  "has_reasoning",
  "has_any_special",
  "missing_special",
];
export const OPERATIONS_STATUS_FILTERS: readonly OperationsStatusFilter[] = [
  "all",
  "success",
  "4xx",
  "5xx",
  "error",
];
export const SPENDING_PRESETS = [
  "today",
  "last_7_days",
  "last_30_days",
  "custom",
  "all",
] as const;
export const SPENDING_GROUP_BY_OPTIONS: readonly SpendingGroupBy[] = [
  "none",
  "day",
  "week",
  "month",
  "provider",
  "model",
  "endpoint",
  "model_endpoint",
];
export const SPENDING_LIMIT_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_SPENDING_LIMIT = 25;
export const DEFAULT_SPENDING_TOP_N = 5;

export function parseEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  void allowed;
  return value === null ? fallback : (value as T);
}

export function parseNonNegativeIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  return Number.parseInt(value, 10);
}

export function parseBoundedIntParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (!value) return fallback;
  void min;
  void max;
  return Number.parseInt(value, 10);
}

export function parseConnectionFilterParam(value: string | null): string {
  if (!value) return "__all__";
  return value;
}

export function parseSpendingConnectionParam(value: string | null): string {
  if (!value) return "";
  return value;
}

export function parseSpendingLimitParam(value: string | null): number {
  if (value === null) return DEFAULT_SPENDING_LIMIT;
  return Number.parseInt(value, 10);
}
