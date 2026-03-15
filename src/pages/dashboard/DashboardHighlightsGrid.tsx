import { Activity, ArrowUpRight, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StatGroup } from "@/lib/types";
import type { DashboardMetricSnapshot } from "./useDashboardPageData";

interface DashboardHighlightsGridProps {
  highlighted: boolean;
  onInspectSpending: () => void;
  onOpenStatistics: () => void;
  providerRows: StatGroup[];
  snapshot: DashboardMetricSnapshot;
}

export function DashboardHighlightsGrid({
  highlighted,
  onInspectSpending,
  onOpenStatistics,
  providerRows,
  snapshot,
}: DashboardHighlightsGridProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Performance Snapshot</CardTitle>
          <CardDescription>Current operational profile (24h)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <DashboardMetricTile
              label="Avg Latency"
              value={`${snapshot.avgLatency.toFixed(0)}ms`}
              highlighted={highlighted}
            />
            <DashboardMetricTile
              label="P95 Latency"
              value={`${snapshot.p95Latency.toFixed(0)}ms`}
              highlighted={highlighted}
            />
            <DashboardMetricTile
              label="Error Rate"
              value={`${snapshot.errorRate.toFixed(1)}%`}
              highlighted={highlighted}
            />
            <DashboardMetricTile
              label="Streaming Share"
              value={`${snapshot.streamShare.toFixed(1)}%`}
              highlighted={highlighted}
            />
          </div>
          <Button variant="outline" className="w-full" onClick={onOpenStatistics}>
            Open Statistics
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Mix</CardTitle>
          <CardDescription>Request distribution by provider (24h)</CardDescription>
        </CardHeader>
        <CardContent>
          {providerRows.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No provider activity"
              description="Provider request distribution appears after traffic is processed."
            />
          ) : (
            <div className="space-y-3">
              {providerRows.slice(0, 3).map((provider) => {
                const ratio =
                  snapshot.totalRequests > 0
                    ? (provider.total_requests / snapshot.totalRequests) * 100
                    : 0;

                return (
                  <div key={provider.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium capitalize">{provider.key}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {provider.total_requests.toLocaleString()} req
                      </p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.max(4, ratio)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to focused spending analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full justify-start" onClick={onInspectSpending}>
            <DollarSign className="mr-2 h-4 w-4" />
            Inspect Spending Breakdown
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardMetricTile({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: string;
  highlighted: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-muted/30 p-3 transition-colors duration-300",
        highlighted && "ws-value-updated"
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
