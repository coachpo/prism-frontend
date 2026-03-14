import {
  formatSuccessRate,
  getRouteHealthLabel,
  isRoutingDiagramLink,
  isRoutingDiagramNode,
} from "./routingDiagramChartUtils";
import type { RoutingDiagramTooltipProps } from "./routingDiagramChartTypes";

export function RoutingDiagramTooltip({ active, payload }: RoutingDiagramTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const chartPayload = payload[0]?.payload?.payload;

  if (isRoutingDiagramNode(chartPayload)) {
    return (
      <div className="min-w-[14rem] rounded-xl border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl">
        <p className="text-sm font-semibold">{chartPayload.label}</p>
        {chartPayload.sublabel ? <p className="mt-1 text-muted-foreground">{chartPayload.sublabel}</p> : null}
        <div className="mt-3 space-y-1.5">
          <TooltipRow label="Node type" value={chartPayload.kind === "endpoint" ? "Endpoint" : "Model"} />
          <TooltipRow label="Active connections" value={chartPayload.activeConnectionCount.toLocaleString()} />
          <TooltipRow
            label="24h success rate"
            value={formatSuccessRate(chartPayload.successRate24h, chartPayload.requestCount24h)}
          />
          <TooltipRow label="24h total requests" value={chartPayload.requestCount24h.toLocaleString()} />
          <TooltipRow
            label="24h successful requests"
            value={chartPayload.trafficRequestCount24h.toLocaleString()}
          />
          <TooltipRow
            label="Action"
            value={chartPayload.kind === "endpoint" ? "Open request logs" : "Open model detail"}
          />
        </div>
      </div>
    );
  }

  if (isRoutingDiagramLink(chartPayload)) {
    return (
      <div className="min-w-[16rem] rounded-xl border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl">
        <p className="text-sm font-semibold">{chartPayload.endpointLabel}</p>
        <p className="mt-1 text-muted-foreground">{chartPayload.modelLabel}</p>
        <div className="mt-3 space-y-1.5">
          <TooltipRow label="Endpoint" value={chartPayload.endpointLabel} />
          <TooltipRow label="Model" value={chartPayload.modelId} />
          <TooltipRow
            label="24h health"
            value={getRouteHealthLabel(chartPayload.successRate24h, chartPayload.requestCount24h)}
          />
          <TooltipRow
            label="24h success rate"
            value={formatSuccessRate(chartPayload.successRate24h, chartPayload.requestCount24h)}
          />
          <TooltipRow label="24h total requests" value={chartPayload.requestCount24h.toLocaleString()} />
          <TooltipRow label="Active connections" value={chartPayload.activeConnectionCount.toLocaleString()} />
          <TooltipRow
            label="24h successful requests"
            value={chartPayload.trafficRequestCount24h.toLocaleString()}
          />
          <TooltipRow label="24h errors" value={chartPayload.errorCount24h.toLocaleString()} />
        </div>
      </div>
    );
  }

  return null;
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
