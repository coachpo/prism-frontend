import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import {
  formatMoneyMicros,
  formatTokenCount,
  formatUnpricedReasonLabel,
} from "@/lib/costing";
import type {
  RequestLogEntry,
  SpendingGroupBy,
  SpendingReportResponse,
  StatsSummary,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  AlertCircle,
  CircleHelp,
  Clock,
  Coins,
  Gauge,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProviderSelect } from "@/components/ProviderSelect";
import { SpecialTokenCoverageStrip } from "@/components/statistics/SpecialTokenCoverageStrip";
import { TokenMetricCell } from "@/components/statistics/TokenMetricCell";
import { TopSpendingCard } from "@/components/statistics/TopSpendingCard";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatErrorDetail(detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    const msg =
      parsed?.error?.message ||
      parsed?.error?.msg ||
      parsed?.detail ||
      parsed?.message;
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

type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";

function hasSpecialTokenValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined;
}

function rowHasAnySpecialToken(log: RequestLogEntry): boolean {
  return (
    hasSpecialTokenValue(log.cache_read_input_tokens) ||
    hasSpecialTokenValue(log.cache_creation_input_tokens) ||
    hasSpecialTokenValue(log.reasoning_tokens)
  );
}

function metricUnavailableReason(
  log: Pick<RequestLogEntry, "status_code" | "is_stream">,
  value: number | null | undefined
): string {
  if (value !== null && value !== undefined) {
    return "";
  }
  if (log.status_code >= 400) {
    return "request failed before usage accounting";
  }
  if (log.is_stream) {
    return "stream ended without usage event";
  }
  return "upstream did not report this metric";
}

function HeaderWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {label}
            <CircleHelp className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function bucketLogs(logs: RequestLogEntry[], timeRange: string): TimeBucket[] {
  if (logs.length === 0) return [];

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const bucketMap = new Map<
    string,
    { requests: number; errors: number; totalLatency: number }
  >();

  for (const log of sorted) {
    const d = new Date(log.created_at);
    let key: string;
    if (timeRange === "1h") {
      const mins = d.getMinutes();
      const bucket5 = Math.floor(mins / 5) * 5;
      key = `${d.getHours().toString().padStart(2, "0")}:${bucket5
        .toString()
        .padStart(2, "0")}`;
    } else if (timeRange === "24h") {
      key = `${d.getHours().toString().padStart(2, "0")}:00`;
    } else {
      key = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    }

    const existing = bucketMap.get(key) ?? {
      requests: 0,
      errors: 0,
      totalLatency: 0,
    };
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

function toIsoFromDateInput(
  value: string,
  boundary: "start" | "end" = "start"
): string | undefined {
  if (!value) return undefined;
  const parts = value.split("-");
  if (parts.length !== 3) return undefined;
  const [year, month, day] = parts.map((part) => Number.parseInt(part, 10));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return undefined;
  }

  const parsed = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      boundary === "end" ? 23 : 0,
      boundary === "end" ? 59 : 0,
      boundary === "end" ? 59 : 0,
      boundary === "end" ? 999 : 0
    )
  );
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<"operations" | "spending">(
    "operations"
  );

  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { navigateToConnection } = useConnectionNavigation();

  const [modelId, setModelId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [providerType, setProviderType] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "all">(
    "24h"
  );
  const [specialTokenFilter, setSpecialTokenFilter] =
    useState<SpecialTokenFilter>("all");

  const [spending, setSpending] = useState<SpendingReportResponse | null>(null);
  const [spendingLoading, setSpendingLoading] = useState(false);
  const [spendingError, setSpendingError] = useState<string | null>(null);
  const [spendingPreset, setSpendingPreset] = useState<
    "today" | "last_7_days" | "last_30_days" | "custom" | "all"
  >("last_7_days");
  const [spendingFrom, setSpendingFrom] = useState("");
  const [spendingTo, setSpendingTo] = useState("");
  const [spendingProviderType, setSpendingProviderType] = useState("all");
  const [spendingModelId, setSpendingModelId] = useState("");
  const [spendingConnectionId, setSpendingConnectionId] = useState("");
  const [spendingGroupBy, setSpendingGroupBy] =
    useState<SpendingGroupBy>("model");
  const [spendingLimit, setSpendingLimit] = useState(25);
  const [spendingOffset, setSpendingOffset] = useState(0);
  const [spendingTopN, setSpendingTopN] = useState(5);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          let fromTime: string | undefined;
          const now = new Date();
          if (timeRange === "1h") {
            fromTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          } else if (timeRange === "24h") {
            fromTime = new Date(
              now.getTime() - 24 * 60 * 60 * 1000
            ).toISOString();
          } else if (timeRange === "7d") {
            fromTime = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString();
          }

          const params = {
            model_id: modelId || undefined,
            provider_type: providerType === "all" ? undefined : providerType,
            connection_id: connectionId ? Number.parseInt(connectionId, 10) : undefined,
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
    }, 450);

    return () => clearTimeout(timeout);
  }, [modelId, connectionId, providerType, timeRange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchSpending = async () => {
        setSpendingLoading(true);
        setSpendingError(null);
        try {
          const response = await api.stats.spending({
            preset: spendingPreset,
            from_time:
              spendingPreset === "custom"
                ? toIsoFromDateInput(spendingFrom, "start")
                : undefined,
            to_time:
              spendingPreset === "custom"
                ? toIsoFromDateInput(spendingTo, "end")
                : undefined,
            provider_type:
              spendingProviderType === "all" ? undefined : spendingProviderType,
            model_id: spendingModelId || undefined,
            connection_id: spendingConnectionId
              ? Number.parseInt(spendingConnectionId, 10)
              : undefined,
            group_by: spendingGroupBy,
            limit: spendingLimit,
            offset: spendingOffset,
            top_n: spendingTopN,
          });
          setSpending(response);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to fetch spending report";
          setSpendingError(message);
        } finally {
          setSpendingLoading(false);
        }
      };

      fetchSpending();
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    spendingPreset,
    spendingFrom,
    spendingTo,
    spendingProviderType,
    spendingModelId,
    spendingConnectionId,
    spendingGroupBy,
    spendingLimit,
    spendingOffset,
    spendingTopN,
  ]);

  const chartData = useMemo(() => bucketLogs(logs, timeRange), [logs, timeRange]);

  const requestLogRows = useMemo(() => {
    return logs.filter((log) => {
      if (specialTokenFilter === "has_cached") {
        return hasSpecialTokenValue(log.cache_read_input_tokens);
      }
      if (specialTokenFilter === "has_reasoning") {
        return hasSpecialTokenValue(log.reasoning_tokens);
      }
      if (specialTokenFilter === "has_any_special") {
        return rowHasAnySpecialToken(log);
      }
      if (specialTokenFilter === "missing_special") {
        return !rowHasAnySpecialToken(log);
      }
      return true;
    });
  }, [logs, specialTokenFilter]);

  const specialTokenCoverage = useMemo(() => {
    let cachedCaptured = 0;
    let reasoningCaptured = 0;
    let anySpecialCaptured = 0;
    let noTokenUsage = 0;

    for (const log of requestLogRows) {
      if (hasSpecialTokenValue(log.cache_read_input_tokens)) {
        cachedCaptured++;
      }
      if (hasSpecialTokenValue(log.reasoning_tokens)) {
        reasoningCaptured++;
      }
      if (rowHasAnySpecialToken(log)) {
        anySpecialCaptured++;
      }
      if (
        !hasSpecialTokenValue(log.input_tokens) &&
        !hasSpecialTokenValue(log.output_tokens) &&
        !hasSpecialTokenValue(log.total_tokens)
      ) {
        noTokenUsage++;
      }
    }

    return {
      totalRows: requestLogRows.length,
      cachedCaptured,
      reasoningCaptured,
      anySpecialCaptured,
      noTokenUsage,
    };
  }, [requestLogRows]);

  const successRate =
    summary && summary.total_requests > 0
      ? ((summary.success_count / summary.total_requests) * 100).toFixed(1)
      : "0.0";

  const reportSymbol = spending?.report_currency_symbol ?? "$";
  const reportCode = spending?.report_currency_code ?? "USD";
  const canPaginateForward =
    spending !== null && spendingOffset + spendingLimit < spending.groups_total;

  if (loading && logs.length === 0 && spending === null && spendingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Operational metrics and spending analytics"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "operations" | "spending")
        }
      >
        <TabsList className="w-fit">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 w-fit">
            {(["1h", "24h", "7d", "all"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs",
                  timeRange === range && "shadow-sm"
                )}
                onClick={() => setTimeRange(range)}
              >
                {range === "all" ? "All" : range}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Filter by Model ID..."
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="h-8 w-full text-xs sm:w-52"
            />
            <ProviderSelect
              value={providerType}
              onValueChange={setProviderType}
              className="h-8 w-full text-xs sm:w-44"
            />
            <Input
              placeholder="Connection ID"
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              className="h-8 w-full text-xs sm:w-28"
              type="number"
              min="1"
            />
            <Select
              value={specialTokenFilter}
              onValueChange={(value) =>
                setSpecialTokenFilter(value as SpecialTokenFilter)
              }
            >
              <SelectTrigger className="h-8 w-full text-xs sm:w-52">
                <SelectValue placeholder="Special token rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rows</SelectItem>
                <SelectItem value="has_cached">Has cached</SelectItem>
                <SelectItem value="has_reasoning">Has reasoning</SelectItem>
                <SelectItem value="has_any_special">Has any special</SelectItem>
                <SelectItem value="missing_special">Missing special</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              icon={<Gauge className="h-4 w-4" />}
            />
            <MetricCard
              label="Total Tokens"
              value={(summary?.total_tokens ?? 0).toLocaleString()}
              detail={`In: ${(summary?.total_input_tokens ?? 0).toLocaleString()} / Out: ${(summary?.total_output_tokens ?? 0).toLocaleString()}`}
              icon={<Coins className="h-4 w-4" />}
            />
          </div>

          <SpecialTokenCoverageStrip
            totalRows={specialTokenCoverage.totalRows}
            cachedCaptured={specialTokenCoverage.cachedCaptured}
            reasoningCaptured={specialTokenCoverage.reasoningCaptured}
            anySpecialCaptured={specialTokenCoverage.anySpecialCaptured}
            noTokenUsage={specialTokenCoverage.noTokenUsage}
          />

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
                      <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillRequests"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--chart-1)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--chart-1)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          allowDecimals={false}
                        />
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
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          unit="ms"
                        />
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
                        <Bar
                          dataKey="avgLatency"
                          fill="var(--chart-2)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
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
              {requestLogRows.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-6 w-6" />}
                  title={
                    logs.length === 0
                      ? "No requests found"
                      : "No rows match special-token filter"
                  }
                  description={
                    logs.length === 0
                      ? "Adjust your filters or time range to see request data."
                      : "Try a different special-token filter to show matching request rows."
                  }
                />
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Time</TableHead>
                        <TableHead className="text-xs">Model</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">
                          Provider
                        </TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">
                          Connection
                        </TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">
                          Latency
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          In
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          Out
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          <HeaderWithTooltip
                            label="Cached"
                            tooltip="Input tokens served from upstream cache. Null means this request did not include cached-token usage data."
                          />
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          <HeaderWithTooltip
                            label="Cache Create"
                            tooltip="Input tokens used to create cache entries. Null means this metric was not reported by upstream."
                          />
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          <HeaderWithTooltip
                            label="Reasoning"
                            tooltip="Internal reasoning/thinking tokens reported by the upstream model."
                          />
                        </TableHead>
                        <TableHead className="text-xs hidden sm:table-cell xl:hidden">
                          Usage
                        </TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">
                          Total Tokens
                        </TableHead>
                        <TableHead className="text-xs hidden 2xl:table-cell">
                          Input Cost
                        </TableHead>
                        <TableHead className="text-xs hidden 2xl:table-cell">
                          Output Cost
                        </TableHead>
                        <TableHead className="text-xs hidden 2xl:table-cell">
                          Cached Cost
                        </TableHead>
                        <TableHead className="text-xs hidden 2xl:table-cell">
                          Cache Create Cost
                        </TableHead>
                        <TableHead className="text-xs hidden 2xl:table-cell">
                          Reasoning Cost
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          Spend
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          Billable
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          Priced
                        </TableHead>
                        <TableHead className="text-xs hidden xl:table-cell">
                          <HeaderWithTooltip
                            label="Unpriced Reason"
                            tooltip="Reason why a request was not priced (for example pricing disabled, missing endpoint, or missing token usage)."
                          />
                        </TableHead>
                        <TableHead className="text-xs hidden md:table-cell">
                          Stream
                        </TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">
                          Error
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requestLogRows.map((log) => {
                        const errorMsg = formatErrorDetail(log.error_detail);
                        const endpointLogId = log.connection_id;
                        const reportCurrencySymbol = log.report_currency_symbol || "$";
                        const reportCurrencyCode = log.report_currency_code || undefined;

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
                                <ProviderIcon
                                  providerType={log.provider_type}
                                  size={12}
                                />
                                <span className="capitalize">{log.provider_type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 hidden lg:table-cell">
                              {endpointLogId === null ? (
                                <span className="text-muted-foreground">
                                  {log.endpoint_description || "-"}
                                </span>
                              ) : log.endpoint_description ? (
                                <button
                                  onClick={() => navigateToConnection(endpointLogId)}
                                  className="text-primary hover:underline cursor-pointer"
                                >
                                  {log.endpoint_description}
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigateToConnection(endpointLogId)}
                                  className="text-muted-foreground hover:text-primary cursor-pointer"
                                >
                                  #{endpointLogId}
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              <ValueBadge
                                label={String(log.status_code)}
                                intent={
                                  log.status_code < 300
                                    ? "success"
                                    : log.status_code < 500
                                      ? "warning"
                                      : "danger"
                                }
                                className="tabular-nums"
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden md:table-cell tabular-nums text-muted-foreground">
                              {log.response_time_ms.toFixed(0)}ms
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.input_tokens}
                                nullReason={metricUnavailableReason(log, log.input_tokens)}
                                formatValue={(value) => value.toLocaleString()}
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.output_tokens}
                                nullReason={metricUnavailableReason(log, log.output_tokens)}
                                formatValue={(value) => value.toLocaleString()}
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.cache_read_input_tokens}
                                nullReason={metricUnavailableReason(
                                  log,
                                  log.cache_read_input_tokens
                                )}
                                formatValue={(value) => value.toLocaleString()}
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.cache_creation_input_tokens}
                                nullReason={metricUnavailableReason(
                                  log,
                                  log.cache_creation_input_tokens
                                )}
                                formatValue={(value) => value.toLocaleString()}
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.reasoning_tokens}
                                nullReason={metricUnavailableReason(log, log.reasoning_tokens)}
                                formatValue={(value) => value.toLocaleString()}
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden sm:table-cell xl:hidden text-muted-foreground">
                              <div className="space-y-0.5 leading-tight">
                                <p>
                                  In {formatTokenCount(log.input_tokens)} / Out {" "}
                                  {formatTokenCount(log.output_tokens)} / Total {" "}
                                  {formatTokenCount(log.total_tokens)}
                                </p>
                                <p>
                                  Cached {formatTokenCount(log.cache_read_input_tokens)} / Cache Create {" "}
                                  {formatTokenCount(log.cache_creation_input_tokens)} / Reasoning {" "}
                                  {formatTokenCount(log.reasoning_tokens)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 hidden lg:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.total_tokens}
                                nullReason={metricUnavailableReason(log, log.total_tokens)}
                                formatValue={(value) => value.toLocaleString()}
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.input_cost_micros}
                                nullReason={metricUnavailableReason(log, log.input_cost_micros)}
                                formatValue={(value) =>
                                  formatMoneyMicros(value, reportCurrencySymbol)
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.output_cost_micros}
                                nullReason={metricUnavailableReason(log, log.output_cost_micros)}
                                formatValue={(value) =>
                                  formatMoneyMicros(value, reportCurrencySymbol)
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.cache_read_input_cost_micros}
                                nullReason={metricUnavailableReason(
                                  log,
                                  log.cache_read_input_cost_micros
                                )}
                                formatValue={(value) =>
                                  formatMoneyMicros(value, reportCurrencySymbol)
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.cache_creation_input_cost_micros}
                                nullReason={metricUnavailableReason(
                                  log,
                                  log.cache_creation_input_cost_micros
                                )}
                                formatValue={(value) =>
                                  formatMoneyMicros(value, reportCurrencySymbol)
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.reasoning_cost_micros}
                                nullReason={metricUnavailableReason(
                                  log,
                                  log.reasoning_cost_micros
                                )}
                                formatValue={(value) =>
                                  formatMoneyMicros(value, reportCurrencySymbol)
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                              <TokenMetricCell
                                value={log.total_cost_user_currency_micros}
                                nullReason={metricUnavailableReason(
                                  log,
                                  log.total_cost_user_currency_micros
                                )}
                                formatValue={(value) =>
                                  formatMoneyMicros(
                                    value,
                                    reportCurrencySymbol,
                                    reportCurrencyCode,
                                    2,
                                    6
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell">
                              <ValueBadge
                                label={
                                  log.billable_flag === null
                                    ? "Unknown"
                                    : log.billable_flag
                                      ? "Yes"
                                      : "No"
                                }
                                intent={
                                  log.billable_flag === null
                                    ? "muted"
                                    : log.billable_flag
                                      ? "success"
                                      : "warning"
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell">
                              <ValueBadge
                                label={
                                  log.priced_flag === null
                                    ? "Unknown"
                                    : log.priced_flag
                                      ? "Yes"
                                      : "No"
                                }
                                intent={
                                  log.priced_flag === null
                                    ? "muted"
                                    : log.priced_flag
                                      ? "success"
                                      : "warning"
                                }
                              />
                            </TableCell>
                            <TableCell className="py-2 hidden xl:table-cell max-w-[220px] truncate text-muted-foreground">
                              {formatUnpricedReasonLabel(log.unpriced_reason)}
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
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {log.error_detail}
                                      </pre>
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
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-6">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Preset</span>
                  <Select
                    value={spendingPreset}
                    onValueChange={(value) => {
                      setSpendingPreset(
                        value as
                          | "today"
                          | "last_7_days"
                          | "last_30_days"
                          | "custom"
                          | "all"
                      );
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {spendingPreset === "custom" && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">From</span>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={spendingFrom}
                        onChange={(e) => {
                          setSpendingFrom(e.target.value);
                          setSpendingOffset(0);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">To</span>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={spendingTo}
                        onChange={(e) => {
                          setSpendingTo(e.target.value);
                          setSpendingOffset(0);
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Provider</span>
                  <ProviderSelect
                    value={spendingProviderType}
                    onValueChange={(value) => {
                      setSpendingProviderType(value);
                      setSpendingOffset(0);
                    }}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Model ID</span>
                  <Input
                    className="h-8 text-xs"
                    placeholder="optional"
                    value={spendingModelId}
                    onChange={(e) => {
                      setSpendingModelId(e.target.value);
                      setSpendingOffset(0);
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Connection ID</span>
                  <Input
                    className="h-8 text-xs"
                    type="number"
                    min="1"
                    placeholder="optional"
                    value={spendingConnectionId}
                    onChange={(e) => {
                      setSpendingConnectionId(e.target.value);
                      setSpendingOffset(0);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Group By</span>
                  <Select
                    value={spendingGroupBy}
                    onValueChange={(value) => {
                      setSpendingGroupBy(value as SpendingGroupBy);
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                      <SelectItem value="model">Model</SelectItem>
                      <SelectItem value="endpoint">Endpoint</SelectItem>
                      <SelectItem value="model_endpoint">Model + Endpoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Rows</span>
                  <Select
                    value={String(spendingLimit)}
                    onValueChange={(value) => {
                      setSpendingLimit(Number.parseInt(value, 10));
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Top N</span>
                  <Input
                    className="h-8 text-xs"
                    type="number"
                    min="1"
                    max="50"
                    value={spendingTopN}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value || "5", 10);
                      if (Number.isFinite(value)) {
                        setSpendingTopN(Math.min(50, Math.max(1, value)));
                      }
                    }}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="h-8 w-full text-xs"
                    onClick={() => {
                      setSpendingPreset("last_7_days");
                      setSpendingFrom("");
                      setSpendingTo("");
                      setSpendingProviderType("all");
                      setSpendingModelId("");
                      setSpendingConnectionId("");
                      setSpendingGroupBy("model");
                      setSpendingLimit(25);
                      setSpendingOffset(0);
                      setSpendingTopN(5);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {spendingError && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {spendingError}
            </div>
          )}

          {spendingLoading && !spending ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[100px] rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-[400px] rounded-xl" />
            </div>
          ) : spending ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total Cost"
                  value={formatMoneyMicros(
                    spending.summary.total_cost_micros,
                    reportSymbol,
                    reportCode
                  )}
                  detail={`${spending.summary.successful_request_count.toLocaleString()} requests`}
                  icon={<CircleDollarSign className="h-4 w-4" />}
                />
                <MetricCard
                  label="Avg Cost / Req"
                  value={formatMoneyMicros(
                    spending.summary.avg_cost_per_successful_request_micros,
                    reportSymbol,
                    reportCode,
                    4
                  )}
                  detail="Successful only"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard
                  label="Total Tokens"
                  value={spending.summary.total_tokens.toLocaleString()}
                  detail={`In: ${spending.summary.total_input_tokens.toLocaleString()} / Out: ${spending.summary.total_output_tokens.toLocaleString()}`}
                  icon={<Coins className="h-4 w-4" />}
                />
                <MetricCard
                  label="Priced Requests"
                  value={`${(
                    (spending.summary.priced_request_count /
                      (spending.summary.successful_request_count || 1)) *
                    100
                  ).toFixed(1)}%`}
                  detail={`${spending.summary.unpriced_request_count.toLocaleString()} unpriced`}
                  icon={<Activity className="h-4 w-4" />}
                />
              </div>

              {spending.groups.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Spending Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Group</TableHead>
                            <TableHead className="text-right">Requests</TableHead>
                            <TableHead className="text-right">Tokens</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="text-right">% of Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {spending.groups.map((group) => {
                            const percent =
                              spending.summary.total_cost_micros > 0
                                ? (group.total_cost_micros /
                                    spending.summary.total_cost_micros) *
                                  100
                                : 0;
                            return (
                              <TableRow key={group.key}>
                                <TableCell className="font-medium">
                                  {group.key}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {group.total_requests.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {group.total_tokens.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatMoneyMicros(
                                    group.total_cost_micros,
                                    reportSymbol,
                                    reportCode
                                  )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  {percent.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        {spendingOffset + 1}–
                        {Math.min(
                          spendingOffset + spendingLimit,
                          spending.groups_total
                        )}{" "}
                        of {spending.groups_total}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={spendingOffset === 0}
                          onClick={() =>
                            setSpendingOffset(
                              Math.max(0, spendingOffset - spendingLimit)
                            )
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canPaginateForward}
                          onClick={() =>
                            setSpendingOffset(spendingOffset + spendingLimit)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={<CircleDollarSign className="h-6 w-6" />}
                  title="No spending data found"
                  description="Try adjusting your filters or time range."
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <TopSpendingCard
                  title="Top Models by Cost"
                  items={spending.top_spending_models.map((m) => ({
                    label: m.model_id,
                    costMicros: m.total_cost_micros,
                  }))}
                  totalCostMicros={spending.summary.total_cost_micros}
                  currencySymbol={reportSymbol}
                  currencyCode={reportCode}
                />
                <TopSpendingCard
                  title="Top Endpoints by Cost"
                  items={spending.top_spending_endpoints.map((c) => ({
                    label: c.endpoint_label,
                    costMicros: c.total_cost_micros,
                  }))}
                  totalCostMicros={spending.summary.total_cost_micros}
                  currencySymbol={reportSymbol}
                  currencyCode={reportCode}
                />
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
