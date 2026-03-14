import { useCallback, useEffect, useRef, useState } from "react";
import { useCoalescedReconcile } from "@/hooks/useCoalescedReconcile";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import type { RequestLogEntry, SpendingReportResponse, StatsSummary } from "@/lib/types";
import { isSuccessfulRequest } from "./dashboardDataUtils";

type Params = {
  fetchDashboardData: (args?: { silent?: boolean }) => Promise<void>;
  latestDashboardRequestIdRef: React.MutableRefObject<number>;
  selectedProfileId: number | null;
  setRecentRequests: React.Dispatch<React.SetStateAction<RequestLogEntry[]>>;
  setSpending: React.Dispatch<React.SetStateAction<SpendingReportResponse | null>>;
  setStats: React.Dispatch<React.SetStateAction<StatsSummary | null>>;
};

export function useDashboardRealtime({
  fetchDashboardData,
  latestDashboardRequestIdRef,
  selectedProfileId,
  setRecentRequests,
  setSpending,
  setStats,
}: Params) {
  const [recentNewIds, setRecentNewIds] = useState<Set<number>>(() => new Set());
  const [metricsHighlighted, setMetricsHighlighted] = useState(false);
  const markSyncCompleteRef = useRef<() => void>(() => undefined);
  const metricHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerMetricHighlight = useCallback(() => {
    setMetricsHighlighted(true);
    if (metricHighlightTimerRef.current) {
      clearTimeout(metricHighlightTimerRef.current);
    }

    metricHighlightTimerRef.current = setTimeout(() => {
      setMetricsHighlighted(false);
    }, 1500);
  }, []);

  const applyDashboardUpdate = useCallback(
    (entry: RequestLogEntry) => {
      if (entry.id <= latestDashboardRequestIdRef.current) {
        return;
      }

      latestDashboardRequestIdRef.current = entry.id;

      setRecentRequests((prev) => [entry, ...prev].slice(0, 12));
      setRecentNewIds((prev) => new Set(prev).add(entry.id));

      setStats((prev) => {
        if (!prev) {
          return prev;
        }

        const nextTotalRequests = prev.total_requests + 1;
        const nextSuccessCount = prev.success_count + (isSuccessfulRequest(entry) ? 1 : 0);
        const nextAverageLatency =
          nextTotalRequests > 0
            ? (prev.avg_response_time_ms * prev.total_requests + entry.response_time_ms) /
              nextTotalRequests
            : 0;

        return {
          ...prev,
          total_requests: nextTotalRequests,
          success_count: nextSuccessCount,
          error_count: nextTotalRequests - nextSuccessCount,
          success_rate:
            nextTotalRequests > 0
              ? Math.round((nextSuccessCount / nextTotalRequests) * 10000) / 100
              : 0,
          avg_response_time_ms: Math.round(nextAverageLatency * 10) / 10,
        };
      });

      setSpending((prev) => {
        if (!prev) {
          return prev;
        }

        const costDelta =
          entry.total_cost_user_currency_micros ?? entry.total_cost_original_micros ?? 0;

        return {
          ...prev,
          summary: {
            ...prev.summary,
            total_cost_micros: prev.summary.total_cost_micros + costDelta,
          },
        };
      });

      triggerMetricHighlight();
    },
    [latestDashboardRequestIdRef, setRecentRequests, setSpending, setStats, triggerMetricHighlight]
  );

  const reconcileDashboard = useCallback(async () => {
    await fetchDashboardData({ silent: true });
    markSyncCompleteRef.current();
  }, [fetchDashboardData]);

  const requestRealtimeReconciliation = useCoalescedReconcile({
    reconcile: reconcileDashboard,
    intervalMs: 300000,
    visibilityReloadThresholdMs: 30000,
  });

  const { connectionState, isSyncing, markSyncComplete } = useRealtimeData({
    profileId: selectedProfileId,
    channel: "dashboard",
    onData: applyDashboardUpdate,
    onDirty: requestRealtimeReconciliation,
    onReconnect: requestRealtimeReconciliation,
  });

  useEffect(() => {
    markSyncCompleteRef.current = markSyncComplete;
  }, [markSyncComplete]);

  useEffect(() => {
    return () => {
      if (metricHighlightTimerRef.current) {
        clearTimeout(metricHighlightTimerRef.current);
      }
    };
  }, []);

  const clearRecentRequestHighlight = useCallback((requestId: number) => {
    setRecentNewIds((prev) => {
      if (!prev.has(requestId)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(requestId);
      return next;
    });
  }, []);

  return {
    clearRecentRequestHighlight,
    connectionState,
    isSyncing,
    metricsHighlighted,
    recentNewIds,
  };
}
