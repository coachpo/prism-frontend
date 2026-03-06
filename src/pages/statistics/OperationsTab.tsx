import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatMoneyMicros } from "@/lib/costing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Clock,
  Coins,
  Gauge,
  TrendingUp,
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ProviderSelect } from "@/components/ProviderSelect";
import { SpecialTokenCoverageStrip } from "@/components/statistics/SpecialTokenCoverageStrip";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTimezone } from "@/hooks/useTimezone";
import {
  OPERATIONS_TIME_RANGES,
  type OperationsStatusFilter,
  type SpecialTokenFilter,
  type InvestigateTab,
} from "./queryParams";
import {
  getConnectionLabel,
} from "./utils";
import type { OperationsTabProps } from "./operations/types";
import { useOperationsTabData } from "./operations/useOperationsTabData";

export function OperationsTab({
  logs,
  models,
  connections,
  modelId,
  setModelId,
  providerType,
  setProviderType,
  connectionId,
  setConnectionId,
  timeRange,
  setTimeRange,
  specialTokenFilter,
  setSpecialTokenFilter,
  operationsStatusFilter,
  setOperationsStatusFilter,
}: OperationsTabProps) {
  const navigate = useNavigate();
  const { format: formatTime } = useTimezone();
  const [investigateTab, setInvestigateTab] = useState<InvestigateTab>("errors");
  const {
    requestLogRows,
    chartData,
    specialTokenCoverage,
    errorCodeBreakdown,
    slowRequests,
    costlyRequests,
    topErrors,
    latencyBandData,
    reportSymbol,
    reportCode,
    filteredRequestCount,
    filteredErrorCount,
    filteredSuccessCount,
    filteredSuccessRate,
    requestsPerSecond,
    filteredAvgLatency,
    filteredP95Latency,
    filteredP99Latency,
    rate4xx,
    rate5xx,
    cacheHitRate,
    ttftP95,
    operationsAggregationLabel,
    operationsLastUpdated,
    requestLogsPath,
  } = useOperationsTabData({
    logs,
    modelId,
    providerType,
    connectionId,
    timeRange,
    specialTokenFilter,
    operationsStatusFilter,
    formatTime,
  });

  return (
    <div className="space-y-6">
      <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters update all health, performance, usage, and debug sections.</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 rounded-lg bg-muted/60 p-1 w-fit">
              {OPERATIONS_TIME_RANGES.map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-7 px-3 text-xs", timeRange === range && "shadow-sm")}
                  onClick={() => setTimeRange(range)}
                >
                  {range === "all" ? "All" : range}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Aggregation: <span className="font-medium text-foreground">{operationsAggregationLabel}</span>
              <span className="mx-2">•</span>
              Updated: <span className="font-medium text-foreground">{operationsLastUpdated}</span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Models</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m.model_id} value={m.model_id}>
                    {m.display_name || m.model_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ProviderSelect
              value={providerType}
              onValueChange={setProviderType}
              className="h-8 text-xs"
            />
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Connections</SelectItem>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {getConnectionLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={specialTokenFilter}
              onValueChange={(value) => setSpecialTokenFilter(value as SpecialTokenFilter)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Special tokens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rows</SelectItem>
                <SelectItem value="has_cached">Has cached</SelectItem>
                <SelectItem value="has_reasoning">Has reasoning</SelectItem>
                <SelectItem value="has_any_special">Has any special</SelectItem>
                <SelectItem value="missing_special">Missing special</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={operationsStatusFilter}
              onValueChange={(value) => setOperationsStatusFilter(value as OperationsStatusFilter)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success only</SelectItem>
                <SelectItem value="4xx">4xx only</SelectItem>
                <SelectItem value="5xx">5xx only</SelectItem>
                <SelectItem value="error">Any error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Health
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard
            label="RPS"
            value={requestsPerSecond.toFixed(requestsPerSecond < 10 ? 2 : 1)}
            detail={`${filteredRequestCount.toLocaleString()} reqs in window`}
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            label="Success Rate"
            value={`${filteredSuccessRate.toFixed(1)}%`}
            detail={`${filteredErrorCount.toLocaleString()} errors` }
            icon={<Gauge className="h-4 w-4" />}
          />
          <MetricCard
            label="P99 Latency"
            value={`${filteredP99Latency.toLocaleString()}ms`}
            detail={`TTFT p95: ${ttftP95.toLocaleString()}ms`}
            icon={<Clock className="h-4 w-4" />}
          />
          <MetricCard
            label="P95 Latency"
            value={`${filteredP95Latency.toLocaleString()}ms`}
            detail={`Avg: ${filteredAvgLatency.toLocaleString()}ms` }
            icon={<Clock className="h-4 w-4" />}
          />
          <MetricCard
            label="Total Spend"
            value={formatMoneyMicros(
              requestLogRows.reduce((sum, row) => sum + (row.total_cost_user_currency_micros ?? 0), 0),
              reportSymbol,
              reportCode
            )}
            detail={`${requestLogRows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0).toLocaleString()} tokens` }
            icon={<CircleDollarSign className="h-4 w-4" />}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard
            label="5xx Rate"
            value={`${rate5xx.toFixed(2)}%`}
            detail={`${requestLogRows
              .filter((row) => row.status_code >= 500)
              .length.toLocaleString()} requests`}
            icon={<AlertCircle className="h-4 w-4" />}
          />
          <MetricCard
            label="4xx Rate"
            value={`${rate4xx.toFixed(2)}%`}
            detail={`${requestLogRows
              .filter((row) => row.status_code >= 400 && row.status_code < 500)
              .length.toLocaleString()} requests`}
            icon={<AlertCircle className="h-4 w-4" />}
          />
          <MetricCard
            label="Cache Hit Rate"
            value={`${cacheHitRate.toFixed(1)}%`}
            detail={`${requestLogRows
              .filter((row) => (row.cache_read_input_tokens ?? 0) > 0)
              .length.toLocaleString()} cached rows`}
            icon={<Coins className="h-4 w-4" />}
          />
          <MetricCard
            label="Total Requests"
            value={filteredRequestCount.toLocaleString()}
            detail={`${filteredSuccessCount.toLocaleString()} successful`}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <MetricCard
            label="Total Tokens"
            value={requestLogRows
              .reduce((sum, row) => sum + (row.total_tokens ?? 0), 0)
              .toLocaleString()}
            detail="Input + output + special tokens"
            icon={<Coins className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Zap className="h-4 w-4 text-amber-600" />
          Performance
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Request Outcome Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} onClick={() => navigate(requestLogsPath())}>
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
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area dataKey="status2xx" stackId="status" name="2xx" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.75} />
                    <Area dataKey="status4xx" stackId="status" name="4xx" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.75} />
                    <Area dataKey="status5xx" stackId="status" name="5xx" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Latency Percentiles</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                      formatter={(value: number) => [`${Math.round(value)}ms`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="p50Latency" name="P50" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p95Latency" name="P95" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p99Latency" name="P99" stroke="var(--destructive)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          Usage & Cost
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Token Throughput</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="inputTokens" name="Input" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="outputTokens" name="Output" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cost by Bucket</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: number) => [formatMoneyMicros(value, reportSymbol, reportCode), "Cost"]}
                    />
                    <Line type="monotone" dataKey="totalCost" name="Cost" stroke="var(--chart-5)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Search className="h-4 w-4 text-slate-600" />
          Debug
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Latency Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latencyBandData} onClick={() => navigate(requestLogsPath())}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="band" tick={{ fontSize: 11 }} className="text-muted-foreground" />
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
                    <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top HTTP Errors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              {errorCodeBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground">No HTTP errors in this slice.</p>
              ) : (
                errorCodeBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">{item.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.count.toLocaleString()} events</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Investigate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={investigateTab === "errors" ? "default" : "outline"}
                onClick={() => setInvestigateTab("errors")}
              >
                Errors
              </Button>
              <Button
                size="sm"
                variant={investigateTab === "slow" ? "default" : "outline"}
                onClick={() => setInvestigateTab("slow")}
              >
                Slow
              </Button>
              <Button
                size="sm"
                variant={investigateTab === "costly" ? "default" : "outline"}
                onClick={() => setInvestigateTab("costly")}
              >
                Costly
              </Button>
            </div>

            {investigateTab === "errors" && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Most frequent error signatures for this filter set.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(requestLogsPath({ outcome_filter: "error" }))}
                  >
                    Open Request Logs
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                {topErrors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No error signatures found.</p>
                ) : (
                  topErrors.map((item, index) => (
                    <div
                      key={`${item.statusCode}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-destructive">HTTP {item.statusCode}</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="cursor-help truncate text-sm text-muted-foreground">
                              {item.detail}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-md">
                            <pre className="whitespace-pre-wrap break-words text-xs">
                              {item.rawDetail}
                            </pre>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{item.count}x</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {investigateTab === "slow" && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Slowest requests by latency in current filtered slice.</p>
                  <Button size="sm" variant="outline" onClick={() => navigate(requestLogsPath())}>
                    Open Request Logs
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                {slowRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No requests found.</p>
                ) : (
                  slowRequests.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.model_id}</p>
                        <p className="text-xs text-muted-foreground">{item.provider_type} · {item.status_code}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium">{item.response_time_ms.toLocaleString()}ms</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {investigateTab === "costly" && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Highest-cost requests in current filtered slice.</p>
                  <Button size="sm" variant="outline" onClick={() => navigate(requestLogsPath())}>
                    Open Request Logs
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                {costlyRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No cost records found.</p>
                ) : (
                  costlyRequests.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.model_id}</p>
                        <p className="text-xs text-muted-foreground">{item.provider_type} · {item.status_code}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium">
                        {formatMoneyMicros(item.total_cost_user_currency_micros ?? 0, reportSymbol, reportCode)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SpecialTokenCoverageStrip
        totalRows={specialTokenCoverage.totalRows}
        cachedCaptured={specialTokenCoverage.cachedCaptured}
        reasoningCaptured={specialTokenCoverage.reasoningCaptured}
        anySpecialCaptured={specialTokenCoverage.anySpecialCaptured}
        noTokenUsage={specialTokenCoverage.noTokenUsage}
      />
    </div>
  );
}
