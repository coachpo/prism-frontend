import { TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { formatMoneyMicros } from "@/lib/costing";
import { OperationsChartCard } from "./chartPresentation";
import { OPERATIONS_CHART_TOOLTIP_STYLE } from "./chartTooltipStyle";
import { OperationsSectionTitle } from "./OperationsSectionTitle";
import type { OperationsChartData, RequestLogsPathBuilder } from "./operationsTypes";

interface OperationsChartsSectionProps {
  chartData: OperationsChartData;
  reportSymbol: string;
  reportCode: string;
  requestLogsPath: RequestLogsPathBuilder;
}

export function OperationsChartsSection({
  chartData,
  reportSymbol,
  reportCode,
  requestLogsPath,
}: OperationsChartsSectionProps) {
  const navigate = useNavigate();

  return (
    <>
      <div className="space-y-3">
        <OperationsSectionTitle
          title="Performance"
          icon={Zap}
          iconClassName="h-4 w-4 text-amber-600"
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <OperationsChartCard title="Request Outcome Over Time" heightClassName="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} onClick={() => navigate(requestLogsPath())}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                <RechartsTooltip contentStyle={OPERATIONS_CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="status2xx" stackId="status" name="2xx" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.75} />
                <Area dataKey="status4xx" stackId="status" name="4xx" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.75} />
                <Area dataKey="status5xx" stackId="status" name="5xx" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </OperationsChartCard>

          <OperationsChartCard title="Latency Percentiles" heightClassName="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" unit="ms" />
                <RechartsTooltip
                  contentStyle={OPERATIONS_CHART_TOOLTIP_STYLE}
                  formatter={(value: number) => [`${Math.round(value)}ms`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="p50Latency" name="P50" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95Latency" name="P95" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p99Latency" name="P99" stroke="var(--destructive)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </OperationsChartCard>
        </div>
      </div>

      <div className="space-y-3">
        <OperationsSectionTitle
          title="Usage & Cost"
          icon={TrendingUp}
          iconClassName="h-4 w-4 text-indigo-600"
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <OperationsChartCard title="Token Throughput" heightClassName="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                <RechartsTooltip contentStyle={OPERATIONS_CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="inputTokens" name="Input" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="outputTokens" name="Output" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </OperationsChartCard>

          <OperationsChartCard title="Cost by Bucket" heightClassName="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <RechartsTooltip
                  contentStyle={OPERATIONS_CHART_TOOLTIP_STYLE}
                  formatter={(value: number) => [formatMoneyMicros(value, reportSymbol, reportCode), "Cost"]}
                />
                <Line type="monotone" dataKey="totalCost" name="Cost" stroke="var(--chart-5)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </OperationsChartCard>
        </div>
      </div>
    </>
  );
}
