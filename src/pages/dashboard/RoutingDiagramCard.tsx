import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Network } from "lucide-react";
import { Sankey, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRoutingDiagramChartData,
  getRoutingDiagramEmptyState,
  type RoutingDiagramChartLink,
  type RoutingDiagramChartNode,
  type RoutingDiagramData,
  type RoutingDiagramLink,
  type RoutingDiagramNode,
} from "./routingDiagram";

const ROUTE_HEALTH_COLOR = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  failing: "#ef4444",
  noData: "#64748b",
} as const;

interface RoutingDiagramCardProps {
  data: RoutingDiagramData | null;
  loading: boolean;
  error: string | null;
  onSelectModel: (modelConfigId: number) => void;
  onSelectEndpoint: (endpointId: number) => void;
  onSelectLink: (modelId: string, endpointId: number) => void;
}

export function RoutingDiagramCard({
  data,
  loading,
  error,
  onSelectModel,
  onSelectEndpoint,
  onSelectLink,
}: RoutingDiagramCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const isCompact = containerWidth > 0 && containerWidth < 640;
  const chartHeight = isCompact ? 320 : 420;

  const chartData = useMemo(() => {
    return data ? getRoutingDiagramChartData(data) : { nodes: [], links: [] };
  }, [data]);

  const emptyState = useMemo(() => {
    return data ? getRoutingDiagramEmptyState(data) : null;
  }, [data]);

  const activateNode = (node: RoutingDiagramNode) => {
    if (node.kind === "model" && node.modelConfigId !== null) {
      onSelectModel(node.modelConfigId);
      return;
    }

    if (node.kind === "endpoint" && node.endpointId !== null) {
      onSelectEndpoint(node.endpointId);
    }
  };

  const activateLink = (link: RoutingDiagramLink) => {
    onSelectLink(link.modelId, link.endpointId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routing Health Map</CardTitle>
          <CardDescription>Loading live routing volume and 24-hour health data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-6 w-48 rounded-full" />
          </div>
          <Skeleton className="h-[320px] rounded-2xl sm:h-[420px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="space-y-2">
          <CardTitle>Routing Health Map</CardTitle>
          <CardDescription>
            Trace active endpoint-to-model paths in one view. Link width reflects active route count, while color reflects 24-hour route health.
          </CardDescription>
        </div>

        {data ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <span className="rounded-full border bg-muted/40 px-2.5 py-1">
              {data.endpointCount} endpoint{data.endpointCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border bg-muted/40 px-2.5 py-1">
              {data.modelCount} model{data.modelCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border bg-muted/40 px-2.5 py-1">
              {data.activeConnectionTotal.toLocaleString()} active route{data.activeConnectionTotal === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border bg-muted/40 px-2.5 py-1">
              {data.trafficRequestTotal24h.toLocaleString()} successful requests in 24h
            </span>
          </div>
        ) : null}
      </CardHeader>

      <CardContent ref={containerRef} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            {error}
          </div>
        ) : null}

        {data && chartData.links.length > 0 ? (
          <>
            <div className="rounded-2xl border bg-gradient-to-br from-background via-background to-muted/35 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Network className="h-3.5 w-3.5" />
                  <span>Link width reflects active connection count. Color reflects 24h route success rate.</span>
                </div>
                <span className="rounded-full border bg-background/80 px-2.5 py-1 font-medium text-foreground">
                  Click nodes or links to drill down
                </span>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <HealthLegendPill label="Healthy" description="99%+" color={ROUTE_HEALTH_COLOR.healthy} />
                <HealthLegendPill label="Degraded" description="95-98.99%" color={ROUTE_HEALTH_COLOR.degraded} />
                <HealthLegendPill label="Failing" description="<95%" color={ROUTE_HEALTH_COLOR.failing} />
                <HealthLegendPill label="No data" description="No recent requests" color={ROUTE_HEALTH_COLOR.noData} />
              </div>

              <div style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <Sankey
                    data={chartData}
                    nodePadding={isCompact ? 18 : 24}
                    nodeWidth={isCompact ? 14 : 18}
                    margin={{ top: 12, right: isCompact ? 84 : 148, bottom: isCompact ? 28 : 36, left: isCompact ? 84 : 148 }}
                    sort={false}
                    onClick={(item: unknown, elementType: unknown) => {
                      if (elementType === "node") {
                        const node = getChartPayload(item);
                        if (isRoutingDiagramNode(node)) {
                          activateNode(node);
                        }
                        return;
                      }

                      if (elementType === "link") {
                        const link = getChartPayload(item);
                        if (isRoutingDiagramLink(link)) {
                          activateLink(link);
                        }
                      }
                    }}
                    node={(props: RoutingNodeShapeProps) => (
                      <RoutingNodeShape props={props} compact={isCompact} onActivate={activateNode} />
                    )}
                    link={(props: RoutingLinkShapeProps) => (
                      <RoutingLinkShape props={props} onActivate={activateLink} />
                    )}
                  >
                    <RechartsTooltip
                      cursor={false}
                      wrapperStyle={{ outline: "none" }}
                      content={<RoutingDiagramTooltip />}
                    />
                  </Sankey>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <DrilldownHint
                title="Endpoints"
                description="Inspect all request logs routed through a specific endpoint from the current profile."
              />
              <DrilldownHint
                title="Models"
                description="Jump directly into model configuration and connection details for a topology target."
              />
              <DrilldownHint
                title="Links"
                description="Open request logs filtered to a single endpoint-model path for fast triage."
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Network className="h-6 w-6" />}
            title={emptyState?.title ?? "No routing data"}
            description={emptyState?.description ?? "No routing diagram data is available for this profile."}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface RoutingNodeShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: RoutingDiagramChartNode;
}

function RoutingNodeShape({
  props,
  compact,
  onActivate,
}: {
  props: RoutingNodeShapeProps;
  compact: boolean;
  onActivate: (node: RoutingDiagramNode) => void;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;

  if (!payload) {
    return null;
  }

  const rectFill = payload.kind === "endpoint" ? "var(--chart-2)" : "var(--chart-1)";
  const labelText = truncateLabel(payload.label, compact ? 12 : 22);
  const secondaryText = payload.kind === "endpoint"
    ? `${payload.activeConnectionCount} active`
    : payload.sublabel;
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

interface RoutingLinkShapeProps {
  sourceX?: number;
  sourceY?: number;
  sourceControlX?: number;
  targetX?: number;
  targetY?: number;
  targetControlX?: number;
  linkWidth?: number;
  payload?: RoutingDiagramChartLink;
}

function RoutingLinkShape({
  props,
  onActivate,
}: {
  props: RoutingLinkShapeProps;
  onActivate: (link: RoutingDiagramLink) => void;
}) {
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
      className="cursor-pointer transition-opacity duration-150 hover:opacity-95"
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={strokeColor}
      strokeWidth={Math.max(linkWidth, 1)}
      strokeOpacity={strokeOpacity}
      strokeLinecap="butt"
      role="button"
      tabIndex={0}
      aria-label={payload ? `Route from ${payload.endpointLabel} to ${payload.modelLabel}` : "Routing link"}
      onKeyDown={(event) => {
        if (!payload) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate(payload);
        }
      }}
    />
  );
}

interface RoutingDiagramTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: {
      payload?: unknown;
    };
  }>;
}

function RoutingDiagramTooltip({
  active,
  payload,
}: RoutingDiagramTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const chartPayload = payload[0]?.payload?.payload;

  if (isRoutingDiagramNode(chartPayload)) {
    return (
      <div className="min-w-[14rem] rounded-xl border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl">
        <p className="font-semibold text-sm">{chartPayload.label}</p>
        {chartPayload.sublabel ? <p className="mt-1 text-muted-foreground">{chartPayload.sublabel}</p> : null}
        <div className="mt-3 space-y-1.5">
          <TooltipRow label="Node type" value={chartPayload.kind === "endpoint" ? "Endpoint" : "Model"} />
          <TooltipRow label="Active connections" value={chartPayload.activeConnectionCount.toLocaleString()} />
          <TooltipRow label="24h success rate" value={formatSuccessRate(chartPayload.successRate24h, chartPayload.requestCount24h)} />
          <TooltipRow label="24h total requests" value={chartPayload.requestCount24h.toLocaleString()} />
          <TooltipRow label="24h successful requests" value={chartPayload.trafficRequestCount24h.toLocaleString()} />
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
        <p className="font-semibold text-sm">{chartPayload.endpointLabel}</p>
        <p className="mt-1 text-muted-foreground">{chartPayload.modelLabel}</p>
        <div className="mt-3 space-y-1.5">
          <TooltipRow label="Endpoint" value={chartPayload.endpointLabel} />
          <TooltipRow label="Model" value={chartPayload.modelId} />
          <TooltipRow label="24h health" value={getRouteHealthLabel(chartPayload.successRate24h, chartPayload.requestCount24h)} />
          <TooltipRow label="24h success rate" value={formatSuccessRate(chartPayload.successRate24h, chartPayload.requestCount24h)} />
          <TooltipRow label="24h total requests" value={chartPayload.requestCount24h.toLocaleString()} />
          <TooltipRow label="Active connections" value={chartPayload.activeConnectionCount.toLocaleString()} />
          <TooltipRow label="24h successful requests" value={chartPayload.trafficRequestCount24h.toLocaleString()} />
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

function HealthLegendPill({
  label,
  description,
  color,
}: {
  label: string;
  description: string;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-2.5 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="font-medium text-foreground">{label}</span>
      <span>{description}</span>
    </span>
  );
}

function DrilldownHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ArrowUpRight className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function truncateLabel(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(limit - 3, 1))}...`;
}

function getChartPayload(item: unknown): unknown {
  if (!isRecord(item)) {
    return undefined;
  }

  return item.payload;
}

function getRouteHealthColor(successRate: number | null, requestCount: number): string {
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

function getRouteHealthLabel(successRate: number | null, requestCount: number): string {
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

function formatSuccessRate(successRate: number | null, requestCount: number): string {
  if (requestCount <= 0 || successRate === null) {
    return "No data";
  }

  return `${successRate.toFixed(2)}%`;
}

function isRoutingDiagramNode(value: unknown): value is RoutingDiagramNode {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.kind === "endpoint" || value.kind === "model")
  );
}

function isRoutingDiagramLink(value: unknown): value is RoutingDiagramLink {
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
