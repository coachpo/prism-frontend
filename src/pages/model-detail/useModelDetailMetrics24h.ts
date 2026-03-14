import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { api } from "@/lib/api";
import type { Connection, ModelConfig, StatsSummary } from "@/lib/types";
import {
  get24hFromTime,
  type ConnectionDerivedMetrics,
} from "./modelDetailMetricsAndPaths";

interface UseModelDetailMetrics24hInput {
  connectionMetricsEnabled: boolean;
  model: ModelConfig | null;
  connections: Connection[];
  revision: number;
  setConnectionMetricsLoading: Dispatch<SetStateAction<boolean>>;
  setMetrics24hLoading: Dispatch<SetStateAction<boolean>>;
  setConnectionMetrics24h: Dispatch<SetStateAction<Map<number, ConnectionDerivedMetrics>>>;
  setKpiSummary24h: Dispatch<SetStateAction<StatsSummary | null>>;
  setKpiSpend24hMicros: Dispatch<SetStateAction<number | null>>;
}

export function useModelDetailMetrics24h({
  connectionMetricsEnabled,
  model,
  connections,
  revision,
  setConnectionMetricsLoading,
  setMetrics24hLoading,
  setConnectionMetrics24h,
  setKpiSummary24h,
  setKpiSpend24hMicros,
}: UseModelDetailMetrics24hInput) {
  const modelId = model?.model_id ?? null;
  const connectionIdsKey = useMemo(
    () => [...connections].map((connection) => connection.id).sort((left, right) => left - right).join(","),
    [connections],
  );
  const connectionIds = useMemo(
    () => (connectionIdsKey.length > 0 ? connectionIdsKey.split(",").map((value) => Number(value)) : []),
    [connectionIdsKey],
  );

  useEffect(() => {
    if (!modelId) return;

    let cancelled = false;

    const fetch24hMetrics = async () => {
      const fromTime = get24hFromTime();
      setMetrics24hLoading(true);
      setConnectionMetricsLoading(connectionMetricsEnabled);
      setConnectionMetrics24h(new Map());

      try {
        const [summary24h, spend24h] = await Promise.all([
          api.stats.summary({ model_id: modelId, from_time: fromTime }),
          api.stats.spending({
            model_id: modelId,
            from_time: fromTime,
            preset: "custom",
            group_by: "none",
          }),
        ]);

        if (cancelled) return;
        setKpiSummary24h(summary24h);
        setKpiSpend24hMicros(spend24h.summary.total_cost_micros);

        if (!connectionMetricsEnabled || connectionIds.length === 0) {
          setConnectionMetrics24h(new Map());
          return;
        }

        const perConnection = await Promise.all(
          connectionIds.map(async (connectionId) => {
            const [connectionSummary, recentLogs] = await Promise.all([
              api.stats.summary({
                model_id: modelId,
                connection_id: connectionId,
                from_time: fromTime,
              }),
              api.stats.requests({
                model_id: modelId,
                connection_id: connectionId,
                from_time: fromTime,
                limit: 200,
              }),
            ]);

            const logs = recentLogs.items;
            const fiveXxCount = logs.filter((row) => row.status_code >= 500).length;
            const sampledCount = logs.length;
            const latestFailoverLike = logs
              .filter((row) => row.status_code >= 500)
              .sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]?.created_at ?? null;

            return {
              connectionId,
              successRate24h: connectionSummary.success_rate,
              p95LatencyMs: connectionSummary.p95_response_time_ms,
              requestCount24h: connectionSummary.total_requests,
              fiveXxRate: sampledCount > 0 ? (fiveXxCount / sampledCount) * 100 : null,
              heuristicFailoverEvents: fiveXxCount,
              lastFailoverLikeAt: latestFailoverLike,
            };
          })
        );

        if (cancelled) return;

        const nextConnectionMetrics = new Map<number, ConnectionDerivedMetrics>();
        for (const row of perConnection) {
          nextConnectionMetrics.set(row.connectionId, {
            success_rate_24h: row.successRate24h,
            p95_latency_ms: row.p95LatencyMs,
            five_xx_rate: row.fiveXxRate,
            request_count_24h: row.requestCount24h,
            heuristic_failover_events: row.heuristicFailoverEvents,
            last_failover_like_at: row.lastFailoverLikeAt,
          });
        }

        setConnectionMetrics24h(nextConnectionMetrics);
      } catch (error) {
        console.error("Failed to fetch 24h model metrics", error);
      } finally {
        if (!cancelled) {
          setMetrics24hLoading(false);
          setConnectionMetricsLoading(false);
        }
      }
    };

    void fetch24hMetrics();

    return () => {
      cancelled = true;
    };
  }, [
    connectionMetricsEnabled,
    connectionIds,
    connectionIdsKey,
    modelId,
    revision,
    setConnectionMetricsLoading,
    setConnectionMetrics24h,
    setKpiSpend24hMicros,
    setKpiSummary24h,
    setMetrics24hLoading,
  ]);
}
