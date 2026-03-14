import type {
  RoutingDiagramChartLink,
  RoutingDiagramChartNode,
  RoutingDiagramData,
  RoutingDiagramLink,
} from "./routingDiagramContracts";

export function getRoutingDiagramChartData(
  data: RoutingDiagramData,
): { nodes: RoutingDiagramChartNode[]; links: RoutingDiagramChartLink[] } {
  const filteredLinks = data.links
    .filter((link) => link.activeConnectionCount > 0)
    .sort(compareLinksByPriority);

  if (filteredLinks.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodeIds = new Set<string>();
  for (const link of filteredLinks) {
    nodeIds.add(link.sourceNodeId);
    nodeIds.add(link.targetNodeId);
  }

  const nodes = data.nodes
    .filter((node) => nodeIds.has(node.id))
    .map<RoutingDiagramChartNode>((node) => ({
      ...node,
      value: Math.max(node.activeConnectionCount, 1),
    }));

  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));

  return {
    nodes,
    links: filteredLinks.map<RoutingDiagramChartLink>((link) => ({
      ...link,
      source: nodeIndex.get(link.sourceNodeId) ?? 0,
      target: nodeIndex.get(link.targetNodeId) ?? 0,
      value: Math.max(link.activeConnectionCount, 1),
    })),
  };
}

export function getRoutingDiagramEmptyState(
  data: RoutingDiagramData,
): { title: string; description: string } {
  if (data.links.length === 0) {
    return {
      title: "No active routes",
      description:
        "Activate at least one model connection to map live routing paths across endpoints and models.",
    };
  }

  return {
    title: "No routed traffic in the last 24h",
    description:
      "Active routes are configured, but no successful request traffic was recorded for the current profile in the last 24 hours.",
  };
}

function compareLinksByPriority(left: RoutingDiagramLink, right: RoutingDiagramLink): number {
  if (right.activeConnectionCount !== left.activeConnectionCount) {
    return right.activeConnectionCount - left.activeConnectionCount;
  }

  if (right.trafficRequestCount24h !== left.trafficRequestCount24h) {
    return right.trafficRequestCount24h - left.trafficRequestCount24h;
  }

  return left.endpointLabel.localeCompare(right.endpointLabel);
}
