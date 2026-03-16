import type { RequestLogEntry } from "@/lib/types";
import type { RoutingDiagramData } from "./routingDiagram";

export function isSuccessfulRequest(entry: RequestLogEntry) {
  if (entry.success_flag !== null && entry.success_flag !== undefined) {
    return entry.success_flag;
  }

  return entry.status_code < 400;
}

export function getEmptyRoutingDiagramData(): RoutingDiagramData {
  return {
    nodes: [],
    links: [],
    endpointCount: 0,
    modelCount: 0,
    activeConnectionTotal: 0,
    trafficRequestTotal24h: 0,
  };
}
