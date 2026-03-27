import {
  USAGE_CHART_GRANULARITIES,
  USAGE_SNAPSHOT_PRESETS,
  type UsageChartGranularity,
  type UsageSnapshotPreset,
  type UsageStatisticsChartGranularityState,
  type UsageStatisticsPageState,
} from "@/lib/types";

export const USAGE_STATISTICS_STORAGE_KEY = "prism.statistics.usage-state";

const DEFAULT_CHART_GRANULARITY: UsageStatisticsChartGranularityState = {
  costOverview: "hourly",
  requestTrends: "hourly",
  tokenTypeBreakdown: "hourly",
  tokenUsageTrends: "hourly",
};

export function getDefaultUsageStatisticsPageState(): UsageStatisticsPageState {
  return {
    chartGranularity: { ...DEFAULT_CHART_GRANULARITY },
    selectedModelLines: [],
    selectedTimeRange: "24h",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUsageSnapshotPreset(value: unknown): value is UsageSnapshotPreset {
  return typeof value === "string" && USAGE_SNAPSHOT_PRESETS.includes(value as UsageSnapshotPreset);
}

function isUsageChartGranularity(value: unknown): value is UsageChartGranularity {
  return typeof value === "string" && USAGE_CHART_GRANULARITIES.includes(value as UsageChartGranularity);
}

function parseChartGranularity(value: unknown): UsageStatisticsChartGranularityState {
  if (!isRecord(value)) {
    return { ...DEFAULT_CHART_GRANULARITY };
  }

  return {
    costOverview: isUsageChartGranularity(value.costOverview)
      ? value.costOverview
      : DEFAULT_CHART_GRANULARITY.costOverview,
    requestTrends: isUsageChartGranularity(value.requestTrends)
      ? value.requestTrends
      : DEFAULT_CHART_GRANULARITY.requestTrends,
    tokenTypeBreakdown: isUsageChartGranularity(value.tokenTypeBreakdown)
      ? value.tokenTypeBreakdown
      : DEFAULT_CHART_GRANULARITY.tokenTypeBreakdown,
    tokenUsageTrends: isUsageChartGranularity(value.tokenUsageTrends)
      ? value.tokenUsageTrends
      : DEFAULT_CHART_GRANULARITY.tokenUsageTrends,
  };
}

export function readUsageStatisticsPageState(): UsageStatisticsPageState {
  if (typeof window === "undefined") {
    return getDefaultUsageStatisticsPageState();
  }

  const raw = window.localStorage.getItem(USAGE_STATISTICS_STORAGE_KEY);
  if (!raw) {
    return getDefaultUsageStatisticsPageState();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return getDefaultUsageStatisticsPageState();
    }

    return {
      chartGranularity: parseChartGranularity(parsed.chartGranularity),
      selectedModelLines: Array.isArray(parsed.selectedModelLines)
        ? parsed.selectedModelLines.filter((value): value is string => typeof value === "string")
        : [],
      selectedTimeRange: isUsageSnapshotPreset(parsed.selectedTimeRange)
        ? parsed.selectedTimeRange
        : "24h",
    };
  } catch {
    return getDefaultUsageStatisticsPageState();
  }
}

export function writeUsageStatisticsPageState(state: UsageStatisticsPageState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USAGE_STATISTICS_STORAGE_KEY, JSON.stringify(state));
}
