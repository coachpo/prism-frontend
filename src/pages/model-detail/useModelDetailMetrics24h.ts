import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { api } from "@/lib/api";
import type { Connection, ModelConfig, StatsSummary } from "@/lib/types";
import {
  get24hFromTime,
  type ConnectionDerivedMetrics,
} from "./modelDetailMetricsAndPaths";

interface UseModelDetailMetrics24hInput {
  model: ModelConfig | null;
  connections: Connection[];
  revision: number;
  setMetrics24hLoading: Dispatch<SetStateAction<boolean>>;
  setConnectionMetrics24h: Dispatch<SetStateAction<Map<number, ConnectionDerivedMetrics>>>;
  setKpiSummary24h: Dispatch<SetStateAction<StatsSummary | null>>;
  setKpiSpend24hMicros: Dispatch<SetStateAction<number | null>>;
}

export function useModelDetailMetrics24h({
  model,
  connections,
  revision,
  setMetrics24hLoading,
  setConnectionMetrics24h,
  setKpiSummary24h,
  setKpiSpend24hMicros,
}: UseModelDetailMetrics24hInput) {
  useEffect(() => {
    if (!model) return;

    let cancelled = false;

    const fetch24hMetrics = async () => {
      const fromTime = get24hFromTime();
      setMetrics24hLoading(true);

      try {
        const [summary24h, spend24h, perConnection] = await Promise.all([
          api.stats.summary({ model_id: model.model_id, from_time: fromTime }),
          api.stats.spending({
            model_id: model.model_id,
            from_time: fromTime,
            preset: "custom",
            group_by: "none",
          }),
          Promise.all(
            connections.map(async (connection) => {
              const [connectionSummary, recentLogs] = await Promise.all([
                api.stats.summary({
                  model_id: model.model_id,
                  connection_id: connection.id,
                  from_time: fromTime,
                }),
                api.stats.requests({
                  model_id: model.model_id,
                  connection_id: connection.id,
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
                  (a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]?.created_at ?? null;

              return {
                connectionId: connection.id,
                successRate24h: connectionSummary.success_rate,
                p95LatencyMs: connectionSummary.p95_response_time_ms,
                requestCount24h: connectionSummary.total_requests,
                fiveXxRate: sampledCount > 0 ? (fiveXxCount / sampledCount) * 100 : null,
                heuristicFailoverEvents: fiveXxCount,
                lastFailoverLikeAt: latestFailoverLike,
              };
            })
          ),
        ]);

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
        setKpiSummary24h(summary24h);
        setKpiSpend24hMicros(spend24h.summary.total_cost_micros);
      } catch (error) {
        console.error("Failed to fetch 24h model metrics", error);
      } finally {
        if (!cancelled) {
          setMetrics24hLoading(false);
        }
      }
    };

    void fetch24hMetrics();

    return () => {
      cancelled = true;
    };
  }, [
    connections,
    model,
    revision,
    setConnectionMetrics24h,
    setKpiSpend24hMicros,
    setKpiSummary24h,
    setMetrics24hLoading,
  ]);
}
