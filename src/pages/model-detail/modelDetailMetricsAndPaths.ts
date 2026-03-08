import type { Connection } from "@/lib/types";
import { buildLogsPath } from "@/pages/logs/queryParams";

export type ConnectionDerivedMetrics = {
  success_rate_24h: number | null;
  p95_latency_ms: number | null;
  five_xx_rate: number | null;
  request_count_24h: number;
  heuristic_failover_events: number;
  last_failover_like_at: string | null;
};

export const get24hFromTime = (): string =>
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

export const formatLatencyForDisplay = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return "-";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}s`;
  return `${Math.round(value)}ms`;
};

export const buildLogsDeepLink = (params: {
  modelId: string;
  connectionId?: number;
  status?: "all" | "2xx" | "error";
  timeRange?: "1h" | "24h" | "7d" | "all";
}): string => {
  return buildLogsPath({
    connectionId: params.connectionId,
    modelId: params.modelId,
    range: params.timeRange,
    status: params.status,
  });
};

export const getConnectionName = (
  connection: Pick<Connection, "id" | "name" | "endpoint">
): string => {
  const explicitName = connection.name?.trim();
  if (explicitName && explicitName.length > 0) {
    return explicitName;
  }
  const endpointName = connection.endpoint?.name?.trim();
  if (endpointName && endpointName.length > 0) {
    return endpointName;
  }
  return `Connection ${connection.id}`;
};
