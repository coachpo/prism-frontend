import { getRouteHealthColor } from "./routingDiagramChartUtils";
import type { RoutingLinkShapeProps } from "./routingDiagramChartTypes";

export function RoutingDiagramLinkShape({ props }: { props: RoutingLinkShapeProps }) {
  const {
    sourceX = 0,
    sourceY = 0,
    sourceControlX = 0,
    targetX = 0,
    targetY = 0,
    targetControlX = 0,
    linkWidth = 0,
    payload,
  } = props;

  const strokeColor = getRouteHealthColor(payload?.successRate24h ?? null, payload?.requestCount24h ?? 0);
  const strokeOpacity = payload?.requestCount24h ? 0.38 : 0.24;

  return (
    <path
      className="transition-opacity duration-150 hover:opacity-95"
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={strokeColor}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeOpacity={strokeOpacity}
      strokeLinecap="butt"
      aria-label={payload ? `Route from ${payload.endpointLabel} to ${payload.modelLabel}` : "Routing link"}
    />
  );
}
