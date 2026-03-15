import { useMemo } from "react";
import { Activity, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
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
  const { format: formatTime } = useTimezone();

  const chartData = useMemo(() => {
    if (!data?.buckets) return [];
    return data.buckets.map((bucket) => ({
      time: formatTime(bucket.timestamp, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      tps: bucket.tps,
      requests: bucket.request_count,
    }));
  }, [data, formatTime]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading throughput data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No throughput data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={manualRefresh}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Average TPS"
          value={data.average_tps.toFixed(3)}
          detail={`${data.total_requests.toLocaleString()} total requests`}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Peak TPS"
          value={data.peak_tps.toFixed(3)}
          detail="Highest 1-minute throughput"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="Current TPS"
          value={data.current_tps.toFixed(3)}
          detail="Most recent 1-minute bucket"
          icon={<Zap className="h-4 w-4" />}
        />
        <MetricCard
          label="Time Window"
          value={`${(data.time_window_seconds / 3600).toFixed(1)}h`}
          detail={`${data.time_window_seconds.toLocaleString()}s total`}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* TPS Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transactions Per Second (TPS) Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No data points available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.72} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.14} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "TPS",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  formatter={(value: number, name: string) => {
                    if (name === "tps") return [value.toFixed(3), "TPS"];
                    if (name === "requests") return [value, "Requests"];
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tps"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#tpsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 text-xs text-muted-foreground">
            <p>
              Each data point represents a 1-minute time bucket. TPS is calculated as requests per
              60 seconds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
