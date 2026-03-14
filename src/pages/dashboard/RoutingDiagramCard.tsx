import { useEffect, useMemo, useRef, useState } from "react";
import { Network } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getRoutingDiagramChartData,
  getRoutingDiagramEmptyState,
  type RoutingDiagramData,
  type RoutingDiagramLink,
  type RoutingDiagramNode,
} from "./routingDiagram";
import { RoutingDiagramChart } from "./routing-diagram/RoutingDiagramChart";

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
            <RoutingDiagramChart
              chartData={chartData}
              chartHeight={chartHeight}
              isCompact={isCompact}
              onActivateLink={activateLink}
              onActivateNode={activateNode}
            />
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
