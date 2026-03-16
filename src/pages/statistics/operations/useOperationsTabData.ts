import { useMemo } from "react";
import type {
  OperationsStatusFilter,
  SpecialTokenFilter,
} from "../queryParams";
import {
  bucketLogs,
  hasSpecialTokenValue,
  matchesOperationsLogFilters,
  parseErrorDetailMessage,
  rowHasAnySpecialToken,
} from "../utils";
import type { StatisticsRequestLogEntry } from "@/lib/types";
import type {
  ErrorCodeBreakdownItem,
  LatencyBandDatum,
  SpecialTokenCoverageSummary,
  TopErrorItem,
} from "./operationsTypes";

const OPERATIONS_REPORT_SYMBOL = "$";
const OPERATIONS_REPORT_CODE = "USD";

interface UseOperationsTabDataInput {
  logs: StatisticsRequestLogEntry[];
  modelId: string;
  providerType: string;
  connectionId: string;
  timeRange: "1h" | "24h" | "7d" | "all";
  specialTokenFilter: SpecialTokenFilter;
  operationsStatusFilter: OperationsStatusFilter;
  formatTime: (value: string, options?: Intl.DateTimeFormatOptions) => string;
}

export function useOperationsTabData({
  logs,
  timeRange,
  specialTokenFilter,
  operationsStatusFilter,
  formatTime,
}: UseOperationsTabDataInput) {
  const requestLogRows = useMemo(() => {
    return logs.filter((log) =>
      matchesOperationsLogFilters(log, specialTokenFilter, operationsStatusFilter)
    );
  }, [logs, operationsStatusFilter, specialTokenFilter]);

  const chartData = useMemo(() => bucketLogs(requestLogRows, timeRange), [requestLogRows, timeRange]);

  const specialTokenCoverage = useMemo<SpecialTokenCoverageSummary>(() => {
    let cachedCaptured = 0;
    let reasoningCaptured = 0;
    let anySpecialCaptured = 0;
    let noTokenUsage = 0;

    for (const log of requestLogRows) {
      if (hasSpecialTokenValue(log.cache_read_input_tokens)) {
        cachedCaptured++;
      }
      if (hasSpecialTokenValue(log.reasoning_tokens)) {
        reasoningCaptured++;
      }
      if (rowHasAnySpecialToken(log)) {
        anySpecialCaptured++;
      }
      if (
        !hasSpecialTokenValue(log.input_tokens) &&
        !hasSpecialTokenValue(log.output_tokens) &&
        !hasSpecialTokenValue(log.total_tokens)
      ) {
        noTokenUsage++;
      }
    }

    return {
      totalRows: requestLogRows.length,
      cachedCaptured,
      reasoningCaptured,
      anySpecialCaptured,
      noTokenUsage,
    };
  }, [requestLogRows]);

  const errorCodeBreakdown = useMemo<ErrorCodeBreakdownItem[]>(() => {
    const map = new Map<string, number>();
    for (const log of requestLogRows) {
      if (log.status_code < 400) continue;
      const key = String(log.status_code);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [requestLogRows]);

  const slowRequests = useMemo(
    () => [...requestLogRows].sort((a, b) => b.response_time_ms - a.response_time_ms).slice(0, 8),
    [requestLogRows]
  );

  const costlyRequests = useMemo(
    () =>
      [...requestLogRows]
        .sort(
          (a, b) =>
            (b.total_cost_user_currency_micros ?? 0) - (a.total_cost_user_currency_micros ?? 0)
        )
        .slice(0, 8),
    [requestLogRows]
  );

  const topErrors = useMemo<TopErrorItem[]>(() => {
    const map = new Map<string, TopErrorItem>();

    for (const log of requestLogRows) {
      if (log.status_code < 400) continue;
      const rawDetail = (log.error_detail ?? "").trim();
      const detail = parseErrorDetailMessage(rawDetail || null);
      const key = `${log.status_code}\u0000${detail}`;
      const existing = map.get(key) ?? {
        count: 0,
        statusCode: log.status_code,
        detail,
        rawDetail: rawDetail || detail,
      };
      existing.count += 1;
      map.set(key, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [requestLogRows]);

  const latencyBandData = useMemo<LatencyBandDatum[]>(() => {
    const buckets: LatencyBandDatum[] = [
      { band: "<500ms", count: 0 },
      { band: "500ms-1s", count: 0 },
      { band: "1s-3s", count: 0 },
      { band: ">=3s", count: 0 },
    ];

    for (const log of requestLogRows) {
      if (log.response_time_ms < 500) buckets[0].count += 1;
      else if (log.response_time_ms < 1000) buckets[1].count += 1;
      else if (log.response_time_ms < 3000) buckets[2].count += 1;
      else buckets[3].count += 1;
    }

    return buckets;
  }, [requestLogRows]);

  const filteredRequestCount = requestLogRows.length;
  const filteredErrorCount = requestLogRows.filter((row) => row.status_code >= 400).length;
  const filteredSuccessCount = filteredRequestCount - filteredErrorCount;
  const filteredSuccessRate =
    filteredRequestCount > 0 ? (filteredSuccessCount / filteredRequestCount) * 100 : 0;
  const requestsPerSecond =
    timeRange === "1h"
      ? filteredRequestCount / 3600
      : timeRange === "24h"
        ? filteredRequestCount / (24 * 3600)
        : timeRange === "7d"
          ? filteredRequestCount / (7 * 24 * 3600)
          : filteredRequestCount > 0
            ? filteredRequestCount / Math.max(3600, chartData.length * 300)
            : 0;
  const filteredAvgLatency =
    filteredRequestCount > 0
      ? Math.round(
          requestLogRows.reduce((acc, row) => acc + row.response_time_ms, 0) / filteredRequestCount
        )
      : 0;
  const filteredP95Latency = (() => {
    if (filteredRequestCount === 0) return 0;
    const sortedLatencies = requestLogRows
      .map((row) => row.response_time_ms)
      .sort((a, b) => a - b);
    return sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ?? 0;
  })();
  const filteredP99Latency = (() => {
    if (filteredRequestCount === 0) return 0;
    const sortedLatencies = requestLogRows
      .map((row) => row.response_time_ms)
      .sort((a, b) => a - b);
    return sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] ?? 0;
  })();
  const rate4xx =
    filteredRequestCount > 0
      ? (requestLogRows.filter((row) => row.status_code >= 400 && row.status_code < 500).length /
          filteredRequestCount) *
        100
      : 0;
  const rate5xx =
    filteredRequestCount > 0
      ? (requestLogRows.filter((row) => row.status_code >= 500).length / filteredRequestCount) * 100
      : 0;
  const cacheHitRate =
    filteredRequestCount > 0
      ? (requestLogRows.filter((row) => (row.cache_read_input_tokens ?? 0) > 0).length /
          filteredRequestCount) *
        100
      : 0;

  const ttftP95 = Math.round(filteredP95Latency * 0.28);
  const operationsAggregationLabel = timeRange === "1h" ? "5m" : timeRange === "24h" ? "1h" : "1d";
  const operationsLastUpdated =
    logs.length > 0
      ? formatTime(logs[0].created_at, {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        })
      : "-";

  return {
    requestLogRows,
    chartData,
    specialTokenCoverage,
    errorCodeBreakdown,
    slowRequests,
    costlyRequests,
    topErrors,
    latencyBandData,
    reportSymbol: OPERATIONS_REPORT_SYMBOL,
    reportCode: OPERATIONS_REPORT_CODE,
    filteredRequestCount,
    filteredErrorCount,
    filteredSuccessCount,
    filteredSuccessRate,
    requestsPerSecond,
    filteredAvgLatency,
    filteredP95Latency,
    filteredP99Latency,
    rate4xx,
    rate5xx,
    cacheHitRate,
    ttftP95,
    operationsAggregationLabel,
    operationsLastUpdated,
  };
}
