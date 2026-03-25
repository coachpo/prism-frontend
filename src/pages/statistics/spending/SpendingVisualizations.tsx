import { AlertCircle } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TopSpendingCard } from "@/components/statistics/TopSpendingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyMicros } from "@/lib/costing";
import type { SpendingGroupBy, SpendingGroupRow, SpendingReportResponse } from "@/lib/types";

interface SpendingVisualizationsProps {
  insights: {
    highestCost: SpendingGroupRow | null;
    leastEfficient: SpendingGroupRow | null;
    avgCostPer1M: number;
  };
  reportCode: string;
  reportSymbol: string;
  scatterData: Array<{
    key: string;
    tokPerReq: number;
    costPer1MTok: number;
    totalCost: number;
  }>;
  spending: SpendingReportResponse;
  spendingGroupBy: SpendingGroupBy;
  spendingTopN: number;
}

export function SpendingVisualizations({
  insights,
  reportCode,
  reportSymbol,
  scatterData,
  spending,
  spendingGroupBy,
  spendingTopN,
}: SpendingVisualizationsProps) {
  const { locale, messages } = useLocale();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TopSpendingCard
          title={messages.statistics.topModelsByCost}
          items={spending.top_spending_models.map((model) => ({
            label: model.model_id,
            costMicros: model.total_cost_micros,
          }))}
          totalCostMicros={spending.summary.total_cost_micros}
          currencySymbol={reportSymbol}
          currencyCode={reportCode}
        />
        <TopSpendingCard
          title={messages.statistics.topEndpointsByCost}
          items={spending.top_spending_endpoints.map((endpoint) => ({
            label: endpoint.endpoint_label,
            costMicros: endpoint.total_cost_micros,
          }))}
          totalCostMicros={spending.summary.total_cost_micros}
          currencySymbol={reportSymbol}
          currencyCode={reportCode}
        />
      </div>

      {spending.groups.length > 0 ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {messages.statistics.costComponentsBy(
                    spendingGroupBy === "none" ? messages.requestLogs.total : spendingGroupBy.replace("_", " ")
                  )}
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
                        formatter={(value: number) => [formatMoneyMicros(value, reportSymbol, reportCode, 2, 6, locale), messages.statistics.spend]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="total_cost_micros" name={messages.statistics.totalSpend} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {spending.summary.unpriced_request_count > 0 ? (
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
                          <div className="h-full bg-amber-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Cost Efficiency Scatter</CardTitle>
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
                        label={{
                          value: "Tokens per Request",
                          position: "insideBottom",
                          offset: -5,
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="costPer1MTok"
                        name="$/1M tokens"
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                        label={{
                          value: "$ per 1M tokens",
                          angle: -90,
                          position: "insideLeft",
                          fontSize: 11,
                        }}
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
                          if (name === "$/1M tokens") {
                            return [formatMoneyMicros(value, reportSymbol, reportCode, 4), name];
                          }
                          if (name === "Total Spend") {
                            return [formatMoneyMicros(value, reportSymbol, reportCode), name];
                          }
                          return [value, name];
                        }}
                        cursor={{ strokeDasharray: "3 3" }}
                      />
                      <Scatter name="Groups" data={scatterData.slice(0, spendingTopN)} fill="var(--chart-3)" />
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
                <div className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Highest Spend</p>
                      <p className="text-sm text-muted-foreground">{insights.highestCost?.key}</p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatMoneyMicros(insights.highestCost?.total_cost_micros ?? 0, reportSymbol, reportCode)}
                    </span>
                  </div>
                </div>

                {insights.leastEfficient ? (
                  <div className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Least Efficient</p>
                        <p className="text-sm text-muted-foreground">{insights.leastEfficient.key}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatMoneyMicros(
                          (insights.leastEfficient.total_cost_micros / insights.leastEfficient.total_tokens) * 1_000_000,
                          reportSymbol,
                          reportCode,
                          4
                        )}
                        /1M
                      </span>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Avg Cost per 1M Tokens</p>
                      <p className="text-sm text-muted-foreground">Across all groups</p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatMoneyMicros(insights.avgCostPer1M, reportSymbol, reportCode, 4)}
                    </span>
                  </div>
                </div>

                {spending.summary.unpriced_request_count > 0 ? (
                  <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Unpriced Requests</p>
                        <p className="text-sm text-muted-foreground">
                          {spending.summary.unpriced_request_count.toLocaleString()} requests lack pricing data
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </>
  );
}
