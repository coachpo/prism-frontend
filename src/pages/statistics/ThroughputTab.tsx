import { useMemo } from "react";
import { Activity, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { useLocale } from "@/i18n/useLocale";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTimezone } from "@/hooks/useTimezone";
import type { ThroughputStatsResponse } from "@/lib/types";

interface ThroughputTabProps {
  data: ThroughputStatsResponse | null;
  isLoading: boolean;
  manualRefresh: () => void;
}

export function ThroughputTab({ data, isLoading, manualRefresh }: ThroughputTabProps) {
  const { formatNumber, messages } = useLocale();
  const { format: formatTime } = useTimezone();
  const axisTextColor = "var(--muted-foreground)";
  const axisStrokeColor = "var(--border)";
  const tooltipSurfaceColor = "var(--popover)";
  const tooltipTextColor = "var(--popover-foreground)";

  const chartData = useMemo(() => {
    if (!data?.buckets) return [];
    return data.buckets.map((bucket) => ({
      time: formatTime(bucket.timestamp, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      rpm: bucket.rpm,
      requests: bucket.request_count,
    }));
  }, [data, formatTime]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">{messages.statistics.loadingThroughputData}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">{messages.statistics.noThroughputDataAvailable}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={manualRefresh}
          disabled={isLoading}
          aria-label={messages.statistics.refreshThroughputStatistics}
          title={messages.statistics.refreshThroughputStatistics}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={messages.statistics.averageRpm}
          value={data.average_rpm.toFixed(3)}
          detail={messages.statistics.totalRequests(formatNumber(data.total_requests))}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.peakRpm}
          value={data.peak_rpm.toFixed(3)}
          detail={messages.statistics.highestOneMinuteThroughput}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.currentRpm}
          value={data.current_rpm.toFixed(3)}
          detail={messages.statistics.mostRecentOneMinuteBucket}
          icon={<Zap className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.timeWindow}
          value={`${(data.time_window_seconds / 3600).toFixed(1)}h`}
          detail={messages.statistics.timeWindowTotal(formatNumber(data.time_window_seconds))}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {messages.statistics.requestsPerMinuteOverTime}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm text-muted-foreground">{messages.statistics.noDataPointsAvailable}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rpmGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.72} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.14} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  tick={{ fill: axisTextColor }}
                  axisLine={{ stroke: axisStrokeColor }}
                  tickLine={{ stroke: axisStrokeColor }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: axisTextColor }}
                  axisLine={{ stroke: axisStrokeColor }}
                  tickLine={{ stroke: axisStrokeColor }}
                  label={{
                    value: messages.statistics.averageRpm.replace("平均 ", "").replace("Average ", ""),
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: axisTextColor },
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: tooltipSurfaceColor,
                    border: `1px solid ${axisStrokeColor}`,
                    borderRadius: "var(--radius)",
                    color: tooltipTextColor,
                  }}
                  labelStyle={{ color: tooltipTextColor }}
                  formatter={(value: number, name: string) => {
                    if (name === "rpm") return [value.toFixed(3), "RPM"];
                    if (name === "requests") return [value, messages.statistics.requests];
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rpm"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#rpmGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 text-xs text-muted-foreground">
            <p>
              {messages.statistics.throughputExplanation}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
