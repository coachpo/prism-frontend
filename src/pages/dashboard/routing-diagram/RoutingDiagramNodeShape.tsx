import type { RoutingDiagramNode } from "../routingDiagram";
import { truncateLabel } from "./routingDiagramChartUtils";
import type { RoutingNodeShapeProps } from "./routingDiagramChartTypes";

interface RoutingDiagramNodeShapeProps {
  compact: boolean;
  onActivate: (node: RoutingDiagramNode) => void;
  props: RoutingNodeShapeProps;
}

export function RoutingDiagramNodeShape({
  compact,
  onActivate,
  props,
}: RoutingDiagramNodeShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;

  if (!payload) {
    return null;
  }

  const rectFill = payload.kind === "endpoint" ? "var(--chart-2)" : "var(--chart-1)";
  const labelText = truncateLabel(payload.label, compact ? 12 : 22);
  const secondaryText =
    payload.kind === "endpoint" ? `${payload.activeConnectionCount} active` : payload.sublabel;
  const textAnchor = payload.kind === "endpoint" ? "end" : "start";
  const textX = payload.kind === "endpoint" ? x - 10 : x + width + 10;

  return (
    <g
      className="cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      aria-label={`${payload.kind === "endpoint" ? "Endpoint" : "Model"}: ${payload.label}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate(payload);
        }
      }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={Math.min(6, height / 3)}
        fill={rectFill}
        fillOpacity={0.88}
        stroke="var(--background)"
        strokeWidth={1.5}
      />
      <text
        x={textX}
        y={y + Math.max(12, height / 2 - 2)}
        textAnchor={textAnchor}
        fontSize={compact ? 10 : 11}
        fontWeight={600}
        fill="var(--foreground)"
      >
        {labelText}
      </text>
      {secondaryText ? (
        <text
          x={textX}
          y={y + Math.max(24, height / 2 + 12)}
          textAnchor={textAnchor}
          fontSize={compact ? 9 : 10}
          fill="var(--muted-foreground)"
        >
          {truncateLabel(secondaryText, compact ? 14 : 24)}
        </text>
      ) : null}
    </g>
  );
}
