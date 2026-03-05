import { formatMoneyMicros } from "@/lib/costing";
import type { ConnectionDropdownItem, SpendingGroupBy, SpendingReportResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Coins,
  Gauge,
  TrendingUp,
  CircleDollarSign,
  AlertCircle,
  Filter,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { ProviderSelect } from "@/components/ProviderSelect";
import { TopSpendingCard } from "@/components/statistics/TopSpendingCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Scatter,
  ScatterChart,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTimezone } from "@/hooks/useTimezone";
import {
  DEFAULT_SPENDING_LIMIT,
  SPENDING_LIMIT_OPTIONS,
} from "./queryParams";
import { getConnectionLabel } from "./utils";

interface SpendingTabProps {
  spending: SpendingReportResponse | null;
  spendingLoading: boolean;
  spendingError: string | null;
  spendingUpdatedAt: string | null;
  spendingPreset: "today" | "last_7_days" | "last_30_days" | "custom" | "all";
  setSpendingPreset: (val: "today" | "last_7_days" | "last_30_days" | "custom" | "all") => void;
  spendingFrom: string;
  setSpendingFrom: (val: string) => void;
  spendingTo: string;
  setSpendingTo: (val: string) => void;
  spendingProviderType: string;
  setSpendingProviderType: (val: string) => void;
  spendingModelId: string;
  setSpendingModelId: (val: string) => void;
  spendingConnectionId: string;
  setSpendingConnectionId: (val: string) => void;
  spendingGroupBy: SpendingGroupBy;
  setSpendingGroupBy: (val: SpendingGroupBy) => void;
  spendingLimit: number;
  setSpendingLimit: (val: number) => void;
  spendingOffset: number;
  setSpendingOffset: (val: number) => void;
  spendingTopN: number;
  setSpendingTopN: (val: number) => void;
  models: { model_id: string; display_name: string | null }[];
  connections: ConnectionDropdownItem[];
}

export function SpendingTab({
  spending,
  spendingLoading,
  spendingError,
  spendingUpdatedAt,
  spendingPreset,
  setSpendingPreset,
  spendingFrom,
  setSpendingFrom,
  spendingTo,
  setSpendingTo,
  spendingProviderType,
  setSpendingProviderType,
  spendingModelId,
  setSpendingModelId,
  spendingConnectionId,
  setSpendingConnectionId,
  spendingGroupBy,
  setSpendingGroupBy,
  spendingLimit,
  setSpendingLimit,
  spendingOffset,
  setSpendingOffset,
  spendingTopN,
  setSpendingTopN,
  models,
  connections,
}: SpendingTabProps) {
  const { format: formatTime } = useTimezone();

  const reportSymbol = spending?.report_currency_symbol ?? "$";
  const reportCode = spending?.report_currency_code ?? "USD";
  const canPaginateForward =
    spending !== null && spendingOffset + spendingLimit < spending.groups_total;

  return (
    <div className="space-y-6">
      <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters apply to all spending metrics and breakdowns below.</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-6">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Time Range</span>
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
              <Select
                value={spendingModelId || "__all__"}
                onValueChange={(value) => {
                  setSpendingModelId(value === "__all__" ? "" : value);
                  setSpendingOffset(0);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Model ID" />
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
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Connection ID</span>
              <Select
                value={spendingConnectionId || "__all__"}
                onValueChange={(value) => {
                  setSpendingConnectionId(value === "__all__" ? "" : value);
                  setSpendingOffset(0);
                }}
              >
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
                  {SPENDING_LIMIT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
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
                  setSpendingLimit(DEFAULT_SPENDING_LIMIT);
                  setSpendingOffset(0);
                  setSpendingTopN(5);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Currency: <span className="font-medium text-foreground">{reportCode}</span>
            <span className="mx-2">•</span>
            Updated: <span className="font-medium text-foreground">{spendingUpdatedAt ? formatTime(spendingUpdatedAt, { hour: "numeric", minute: "numeric", second: "numeric", hour12: true }) : "-"}</span>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      ) : spending ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label="Total Spend"
              value={formatMoneyMicros(
                spending.summary.total_cost_micros,
                reportSymbol,
                reportCode
              )}
              detail={`${spending.summary.successful_request_count.toLocaleString()} requests`}
              icon={<CircleDollarSign className="h-4 w-4" />}
            />
            <MetricCard
              label="$ / Request"
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
              label="$ / 1M tokens"
              value={formatMoneyMicros(
                spending.summary.total_tokens > 0
                  ? Math.round((spending.summary.total_cost_micros / spending.summary.total_tokens) * 1_000_000)
                  : 0,
                reportSymbol,
                reportCode,
                4
              )}
              detail={`In: ${(spending.summary.total_input_tokens / 1000).toFixed(0)}k / Out: ${(spending.summary.total_output_tokens / 1000).toFixed(0)}k`}
              icon={<Coins className="h-4 w-4" />}
            />
            <MetricCard
              label="Total Tokens"
              value={`${(spending.summary.total_tokens / 1000000).toFixed(1)}M`}
              detail={`Cached: ${(spending.summary.total_cache_read_input_tokens / 1000).toFixed(0)}k`}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              label="Priced %"
              value={`${(
                (spending.summary.priced_request_count /
                  (spending.summary.successful_request_count || 1)) *
                100
              ).toFixed(1)}%`}
              detail={`${spending.summary.unpriced_request_count.toLocaleString()} unpriced`}
              icon={<Gauge className="h-4 w-4" />}
            />
          </div>

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

          {spending.groups.length > 0 && (
            <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Cost Components by {spendingGroupBy === "none" ? "Total" : spendingGroupBy.replace("_", " ")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spending.groups.slice(0, spendingTopN)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="key" tick={{ fontSize: 11 }} className="text-muted-foreground" />
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
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="total_cost_micros" name="Total Cost" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {spending.summary.unpriced_request_count > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Unpriced Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    {Object.entries(spending.unpriced_breakdown).map(([reason, count]) => {
                      const percent = (count / spending.summary.unpriced_request_count) * 100;
                      return (
                        <div key={reason} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{reason}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {spending.groups.length > 0 && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Cost Efficiency Scatter
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          type="number"
                          dataKey="tokPerReq"
                          name="Tokens/Request"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          label={{ value: "Tokens per Request", position: "insideBottom", offset: -5, fontSize: 11 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="costPer1MTok"
                          name="$/1M tokens"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          label={{ value: "$ per 1M tokens", angle: -90, position: "insideLeft", fontSize: 11 }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            fontSize: 12,
                            color: "var(--popover-foreground)",
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === "Tokens/Request") return [Math.round(value).toLocaleString(), name];
                            if (name === "$/1M tokens") return [formatMoneyMicros(value, reportSymbol, reportCode, 4), name];
                            if (name === "Total Spend") return [formatMoneyMicros(value, reportSymbol, reportCode), name];
                            return [value, name];
                          }}
                          cursor={{ strokeDasharray: "3 3" }}
                        />
                        <Scatter
                          name="Groups"
                          data={spending.groups.slice(0, spendingTopN).map((g) => ({
                            key: g.key,
                            tokPerReq: g.total_requests > 0 ? g.total_tokens / g.total_requests : 0,
                            costPer1MTok: g.total_tokens > 0 ? (g.total_cost_micros / g.total_tokens) * 1_000_000 : 0,
                            totalCost: g.total_cost_micros,
                          }))}
                          fill="var(--chart-3)"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Top-right quadrant = expensive due to high token usage and high rates.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Cost Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  {(() => {
                    const sortedByCost = [...spending.groups].sort((a, b) => b.total_cost_micros - a.total_cost_micros);
                    const sortedByEfficiency = [...spending.groups]
                      .filter(g => g.total_tokens > 0)
                      .sort((a, b) => {
                        const effA = (a.total_cost_micros / a.total_tokens) * 1_000_000;
                        const effB = (b.total_cost_micros / b.total_tokens) * 1_000_000;
                        return effB - effA;
                      });
                    const highestCost = sortedByCost[0];
                    const leastEfficient = sortedByEfficiency[0];
                    const avgCostPer1M = spending.summary.total_tokens > 0
                      ? (spending.summary.total_cost_micros / spending.summary.total_tokens) * 1_000_000
                      : 0;

                    return (
                      <>
                        <div className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium">Highest Spend</p>
                              <p className="text-sm text-muted-foreground">{highestCost?.key}</p>
                            </div>
                            <span className="text-sm font-medium">
                              {formatMoneyMicros(highestCost?.total_cost_micros ?? 0, reportSymbol, reportCode)}
                            </span>
                          </div>
                        </div>

                        {leastEfficient && (
                          <div className="rounded-md border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className="text-xs font-medium">Least Efficient</p>
                                <p className="text-sm text-muted-foreground">{leastEfficient.key}</p>
                              </div>
                              <span className="text-sm font-medium">
                                {formatMoneyMicros(
                                  (leastEfficient.total_cost_micros / leastEfficient.total_tokens) * 1_000_000,
                                  reportSymbol,
                                  reportCode,
                                  4
                                )}/1M
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium">Avg Cost per 1M Tokens</p>
                              <p className="text-sm text-muted-foreground">Across all groups</p>
                            </div>
                            <span className="text-sm font-medium">
                              {formatMoneyMicros(avgCostPer1M, reportSymbol, reportCode, 4)}
                            </span>
                          </div>
                        </div>

                        {spending.summary.unpriced_request_count > 0 && (
                          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-xs font-medium">Unpriced Requests</p>
                                <p className="text-sm text-muted-foreground">
                                  {spending.summary.unpriced_request_count.toLocaleString()} requests lack pricing data
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

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
                        <TableHead className="text-right">Spend</TableHead>
                        <TableHead className="text-right">% Total</TableHead>
                        <TableHead className="text-right">$/Req</TableHead>
                        <TableHead className="text-right">$/1M tok</TableHead>
                        <TableHead className="text-right">Tok/Req</TableHead>
                        <TableHead className="text-right">Priced %</TableHead>
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
                        const costPerReq = group.total_requests > 0 ? group.total_cost_micros / group.total_requests : 0;
                        const costPer1MTok = group.total_tokens > 0 ? (group.total_cost_micros / group.total_tokens) * 1_000_000 : 0;
                        const tokPerReq = group.total_requests > 0 ? group.total_tokens / group.total_requests : 0;
                        const pricedPercent = group.total_requests > 0 ? (group.priced_requests / group.total_requests) * 100 : 0;
                        return (
                          <TableRow key={group.key}>
                            <TableCell className="font-medium">
                              {group.key}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {group.total_requests.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {(group.total_tokens / 1000).toFixed(0)}k
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
                            <TableCell className="text-right tabular-nums text-xs">
                              {formatMoneyMicros(costPerReq, reportSymbol, reportCode, 4)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs">
                              {formatMoneyMicros(costPer1MTok, reportSymbol, reportCode, 4)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs">
                              {tokPerReq.toFixed(0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs">
                              {pricedPercent.toFixed(0)}%
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
        </>
      ) : null}
    </div>
  );
}
