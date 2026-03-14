import { ROUTE_HEALTH_COLOR } from "./routingDiagramChartUtils";

export function RoutingDiagramLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <HealthLegendPill label="Healthy" description="99%+" color={ROUTE_HEALTH_COLOR.healthy} />
      <HealthLegendPill label="Degraded" description="95-98.99%" color={ROUTE_HEALTH_COLOR.degraded} />
      <HealthLegendPill label="Failing" description="<95%" color={ROUTE_HEALTH_COLOR.failing} />
      <HealthLegendPill label="No data" description="No recent requests" color={ROUTE_HEALTH_COLOR.noData} />
    </div>
  );
}

function HealthLegendPill({
  color,
  description,
  label,
}: {
  color: string;
  description: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-2.5 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="font-medium text-foreground">{label}</span>
      <span>{description}</span>
    </span>
  );
}
