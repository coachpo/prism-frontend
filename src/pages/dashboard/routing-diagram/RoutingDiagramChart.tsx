import { RoutingDiagramChartShell } from "./RoutingDiagramChartShell";
import { RoutingDiagramDrilldownHints } from "./RoutingDiagramDrilldownHints";
import { RoutingDiagramLegend } from "./RoutingDiagramLegend";
import type { RoutingDiagramChartProps } from "./routingDiagramChartTypes";

export function RoutingDiagramChart({
  chartData,
  chartHeight,
  isCompact,
  onActivateLink,
  onActivateNode,
}: RoutingDiagramChartProps) {
  return (
    <>
      <RoutingDiagramChartShell
        chartData={chartData}
        chartHeight={chartHeight}
        isCompact={isCompact}
        onActivateLink={onActivateLink}
        onActivateNode={onActivateNode}
      >
        <RoutingDiagramLegend />
      </RoutingDiagramChartShell>

      <RoutingDiagramDrilldownHints />
    </>
  );
}
