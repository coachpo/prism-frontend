import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  ModelConfigListItem,
  RequestLogEntry,
  SpendingReportResponse,
  StatsSummary,
} from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValueBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Server,
  Timer,
  XCircle,
  Zap,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatMoneyMicros } from "@/lib/costing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useProfileContext } from "@/context/ProfileContext";

export function DashboardPage() {
  const navigate = useNavigate();
  const { revision } = useProfileContext();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [providerStats, setProviderStats] = useState<StatsSummary | null>(null);
  const [spending, setSpending] = useState<SpendingReportResponse | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequestLogEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const from24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      try {
        const [modelsData, statsData, providerStatsData, spendingData, requestsData] =
          await Promise.all([
            api.models.list(),
            api.stats.summary({ from_time: from24h }),
            api.stats.summary({ from_time: from24h, group_by: "provider" }),
            api.stats.spending({ preset: "30d", top_n: 5 }),
            api.stats.requests({ limit: 12 }),
          ]);
        setModels(modelsData);
        setStats(statsData);
        setProviderStats(providerStatsData);
        setSpending(spendingData);
        setRecentRequests(requestsData.items);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [revision]);

  const activeModels = models.filter((model) => model.is_enabled).length;
  const totalRequests = stats?.total_requests ?? 0;
  const successRate = stats?.success_rate ?? 0;
  const errorRate = Math.max(0, 100 - successRate);
  const avgLatency = stats?.avg_response_time_ms ?? 0;
  const p95Latency = stats?.p95_response_time_ms ?? 0;
  const totalCost = spending?.summary.total_cost_micros ?? 0;

  const streamShare = useMemo(() => {
    if (recentRequests.length === 0) return 0;
    const streamCount = recentRequests.filter((request) => request.is_stream).length;
    return (streamCount / recentRequests.length) * 100;
  }, [recentRequests]);

  const providerRows = useMemo(() => {
    return (providerStats?.groups ?? []).sort((a, b) => b.total_requests - a.total_requests);
  }, [providerStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px] rounded-xl" />
          <Skeleton className="col-span-3 h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="System overview and health status" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Models"
          value={activeModels}
          detail={`of ${models.length} total configured`}
          icon={<Server className="h-4 w-4" />}
        />
        <MetricCard
          label="24h Requests"
          value={totalRequests.toLocaleString()}
          detail={`${successRate.toFixed(1)}% success rate`}
          icon={<Activity className="h-4 w-4" />}
          className={cn(
            "[&_[data-slot=icon]]:bg-blue-500/10 [&_[data-slot=icon]]:text-blue-500",
            successRate < 95 && "text-amber-600"
          )}
        />
        <MetricCard
          label="30d Spending"
          value={formatMoneyMicros(totalCost, "$")}
          detail="Estimated cost"
          icon={<DollarSign className="h-4 w-4" />}
          className="[&_[data-slot=icon]]:bg-emerald-500/10 [&_[data-slot=icon]]:text-emerald-500"
        />
        <MetricCard
          label="System Health"
          value={successRate >= 99 ? "Healthy" : successRate >= 90 ? "Degraded" : "Critical"}
          detail="Based on 24h success rate"
          icon={<Zap className="h-4 w-4" />}
          className={cn(
            "[&_[data-slot=icon]]:bg-violet-500/10 [&_[data-slot=icon]]:text-violet-500",
            successRate >= 99
              ? "text-emerald-600"
              : successRate >= 90
                ? "text-amber-600"
                : "text-red-600"
          )}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Performance Snapshot</CardTitle>
            <CardDescription>Current operational profile (24h)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Avg Latency</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{avgLatency.toFixed(0)}ms</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">P95 Latency</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{p95Latency.toFixed(0)}ms</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Error Rate</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{errorRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Streaming Share</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{streamShare.toFixed(1)}%</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate("/statistics")}>
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
                    totalRequests > 0 ? (provider.total_requests / totalRequests) * 100 : 0;
                  return (
                    <div key={provider.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium capitalize">{provider.key}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {provider.total_requests.toLocaleString()} req
                        </p>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
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
            <CardDescription>Jump to focused investigation views</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/request-logs")}>
              <Timer className="mr-2 h-4 w-4" />
              Review Request Logs
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/statistics?tab=spending")}>
              <DollarSign className="mr-2 h-4 w-4" />
              Inspect Spending Breakdown
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/audit")}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Open Audit Viewer
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest requests processed by the gateway</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No recent activity"
                description="Requests will appear here once processed."
              />
            ) : (
              <div className="space-y-4">
                {recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border",
                          req.status_code >= 200 && req.status_code < 300
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}
                      >
                        {req.status_code >= 200 && req.status_code < 300 ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{req.model_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleTimeString()} - {req.response_time_ms}ms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium">{req.total_tokens || 0} tokens</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMoneyMicros(req.total_cost_original_micros, "$")}
                        </p>
                      </div>
                      <ValueBadge
                        label={String(req.status_code)}
                        intent={req.status_code >= 200 && req.status_code < 300 ? "success" : "danger"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Spending Models</CardTitle>
            <CardDescription>Highest cost models (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {spending?.top_spending_models.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="h-6 w-6" />}
                title="No spending data"
                description="Cost data will appear here once requests are priced."
              />
            ) : (
              <div className="space-y-4">
                {spending?.top_spending_models.map((model, i) => (
                  <div key={model.model_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-mono text-xs font-medium">
                        {i + 1}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{model.model_id}</p>
                        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(model.total_cost_micros / (spending.top_spending_models[0]?.total_cost_micros || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatMoneyMicros(model.total_cost_micros, "$")}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate("/statistics?tab=spending")}
                >
                  View Full Report
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
