import type {
  RoutingDiagramLink,
  RoutingDiagramNode,
} from "../routingDiagram";

export const ROUTE_HEALTH_COLOR = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  failing: "#ef4444",
  noData: "#64748b",
} as const;

export function truncateLabel(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(limit - 3, 1))}...`;
}

export function getChartPayload(item: unknown): unknown {
  if (!isRecord(item)) {
    return undefined;
  }

  return item.payload;
}

export function getRouteHealthColor(successRate: number | null, requestCount: number): string {
  if (requestCount <= 0 || successRate === null) {
    return ROUTE_HEALTH_COLOR.noData;
  }

  if (successRate >= 99) {
    return ROUTE_HEALTH_COLOR.healthy;
  }

  if (successRate >= 95) {
    return ROUTE_HEALTH_COLOR.degraded;
  }

  return ROUTE_HEALTH_COLOR.failing;
}

export function getRouteHealthLabel(successRate: number | null, requestCount: number): string {
  if (requestCount <= 0 || successRate === null) {
    return "No recent request data";
  }

  if (successRate >= 99) {
    return "Healthy";
  }

  if (successRate >= 95) {
    return "Degraded";
  }

  return "Failing";
}

export function formatSuccessRate(successRate: number | null, requestCount: number): string {
  if (requestCount <= 0 || successRate === null) {
    return "No data";
  }

  return `${successRate.toFixed(2)}%`;
}

export function isRoutingDiagramNode(value: unknown): value is RoutingDiagramNode {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.kind === "endpoint" || value.kind === "model")
  );
}

export function isRoutingDiagramLink(value: unknown): value is RoutingDiagramLink {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.modelId === "string" &&
    typeof value.modelConfigId === "number" &&
    typeof value.endpointId === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
