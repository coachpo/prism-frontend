import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useEndpointNavigation } from "@/hooks/useEndpointNavigation";
import type { RequestLogEntry, StatsSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Clock, CheckCircle, Coins, AlertCircle, TrendingUp } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProviderSelect } from "@/components/ProviderSelect";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

function formatErrorDetail(detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    const msg = parsed?.error?.message || parsed?.error?.msg || parsed?.detail || parsed?.message;
    if (msg) return String(msg);
    return detail;
  } catch {
    return detail;
  }
}

interface TimeBucket {
  label: string;
  requests: number;
  errors: number;
  avgLatency: number;
}

function bucketLogs(logs: RequestLogEntry[], timeRange: string): TimeBucket[] {
  if (logs.length === 0) return [];

  const sorted = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const bucketMap = new Map<string, { requests: number; errors: number; totalLatency: number }>();

  for (const log of sorted) {
    const d = new Date(log.created_at);
    let key: string;
    if (timeRange === "1h") {
      const mins = d.getMinutes();
      const bucket5 = Math.floor(mins / 5) * 5;
      key = `${d.getHours().toString().padStart(2, "0")}:${bucket5.toString().padStart(2, "0")}`;
    } else if (timeRange === "24h") {
      key = `${d.getHours().toString().padStart(2, "0")}:00`;
    } else {
      key = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
    }

    const existing = bucketMap.get(key) ?? { requests: 0, errors: 0, totalLatency: 0 };
    existing.requests++;
    if (log.status_code >= 400) existing.errors++;
    existing.totalLatency += log.response_time_ms;
    bucketMap.set(key, existing);
  }

  return Array.from(bucketMap.entries()).map(([label, data]) => ({
    label,
    requests: data.requests,
    errors: data.errors,
    avgLatency: Math.round(data.totalLatency / data.requests),
  }));
}

export function StatisticsPage() {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { navigateToEndpoint } = useEndpointNavigation();

  const [modelId, setModelId] = useState("");
  const [endpointId, setEndpointId] = useState("");
  const [providerType, setProviderType] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "all">("24h");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          let fromTime: string | undefined;
          const now = new Date();
          if (timeRange === "1h") fromTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          else if (timeRange === "24h") fromTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          else if (timeRange === "7d") fromTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const params = {
            model_id: modelId || undefined,
            provider_type: providerType === "all" ? undefined : providerType,
            endpoint_id: endpointId ? parseInt(endpointId) : undefined,
            from_time: fromTime,
            limit: 500,
          };

          const [logsData, summaryData] = await Promise.all([
            api.stats.requests(params),
            api.stats.summary(params),
          ]);
          setLogs(logsData.items);
          setSummary(summaryData);
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, 500);
    return () => clearTimeout(timeout);
  }, [modelId, endpointId, providerType, timeRange]);

  const chartData = useMemo(() => bucketLogs(logs, timeRange), [logs, timeRange]);

  const successRate = summary && summary.total_requests > 0
    ? ((summary.success_count / summary.total_requests) * 100).toFixed(1)
    : "0.0";

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Statistics" description="Request analytics and performance metrics">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["1h", "24h", "7d", "all"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              className={cn("h-7 px-3 text-xs", timeRange === range && "shadow-sm")}
              onClick={() => setTimeRange(range)}
            >
              {range === "all" ? "All" : range}
            </Button>
          ))}
        </div>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Filter by Model ID..."
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="h-8 w-full text-xs sm:w-52"
        />
        <ProviderSelect value={providerType} onValueChange={setProviderType} className="h-8 w-full text-xs sm:w-44" />
        <Input
          placeholder="Endpoint ID"
          value={endpointId}
          onChange={(e) => setEndpointId(e.target.value)}
          className="h-8 w-full text-xs sm:w-28"
          type="number"
          min="1"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Requests"
          value={summary?.total_requests ?? 0}
          detail={`${summary?.success_count ?? 0} successful`}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Avg Latency"
          value={`${(summary?.avg_response_time_ms ?? 0).toFixed(0)}ms`}
          detail={`P95: ${(summary?.p95_response_time_ms ?? 0).toFixed(0)}ms`}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Success Rate"
          value={`${successRate}%`}
          detail={`${summary?.error_count ?? 0} errors`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <MetricCard
          label="Total Tokens"
          value={(summary?.total_tokens ?? 0).toLocaleString()}
          detail={`In: ${(summary?.total_input_tokens ?? 0).toLocaleString()} / Out: ${(summary?.total_output_tokens ?? 0).toLocaleString()}`}
          icon={<Coins className="h-4 w-4" />}
        />
      </div>

      {chartData.length > 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Request Volume
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      stroke="var(--chart-1)"
                      fill="url(#fillRequests)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stroke="var(--destructive)"
                      fill="var(--destructive)"
                      fillOpacity={0.1}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Avg Latency per Bucket
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" unit="ms" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: number) => [`${value}ms`, "Avg Latency"]}
                    />
                    <Bar dataKey="avgLatency" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Request Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No requests found"
              description="Adjust your filters or time range to see request data."
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Model</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Provider</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Endpoint</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Latency</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Tokens</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Stream</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const errorMsg = formatErrorDetail(log.error_detail);
                    const endpointId = log.endpoint_id;
                    return (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="whitespace-nowrap py-2 text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="py-2 font-medium max-w-[140px] truncate">
                          {log.model_id}
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <ProviderIcon providerType={log.provider_type} size={12} />
                            <span className="capitalize">{log.provider_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell">
                          {endpointId === null ? (
                            <span className="text-muted-foreground">{log.endpoint_description || "-"}</span>
                          ) : log.endpoint_description ? (
                            <button
                              onClick={() => navigateToEndpoint(endpointId)}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {log.endpoint_description}
                            </button>
                          ) : (
                            <button
                              onClick={() => navigateToEndpoint(endpointId)}
                              className="text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              #{endpointId}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <ValueBadge
                            label={String(log.status_code)}
                            intent={log.status_code < 300 ? "success" : log.status_code < 500 ? "warning" : "danger"}
                            className="tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell tabular-nums text-muted-foreground">
                          {log.response_time_ms.toFixed(0)}ms
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell tabular-nums text-muted-foreground">
                          {log.total_tokens?.toLocaleString() ?? "-"}
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell">
                          {log.is_stream ? (
                            <TypeBadge label="Stream" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell max-w-[180px]">
                          {errorMsg ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-destructive cursor-help">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{errorMsg}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-sm">
                                  <pre className="whitespace-pre-wrap text-xs">{log.error_detail}</pre>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
