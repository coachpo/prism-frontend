import { Activity, CircleDollarSign, Coins, Gauge, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { formatMoneyMicros } from "@/lib/costing";
import type { SpendingReportResponse } from "@/lib/types";

interface SpendingSummaryMetricsProps {
  reportCode: string;
  reportSymbol: string;
  spending: SpendingReportResponse;
}

export function SpendingSummaryMetrics({
  reportCode,
  reportSymbol,
  spending,
}: SpendingSummaryMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        label="Total Spend"
        value={formatMoneyMicros(spending.summary.total_cost_micros, reportSymbol, reportCode)}
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
        value={`${(spending.summary.total_tokens / 1_000_000).toFixed(1)}M`}
        detail={`Cached: ${(spending.summary.total_cache_read_input_tokens / 1000).toFixed(0)}k`}
        icon={<Activity className="h-4 w-4" />}
      />
      <MetricCard
        label="Priced %"
        value={`${(
          (spending.summary.priced_request_count / (spending.summary.successful_request_count || 1)) *
          100
        ).toFixed(1)}%`}
        detail={`${spending.summary.unpriced_request_count.toLocaleString()} unpriced`}
        icon={<Gauge className="h-4 w-4" />}
      />
    </div>
  );
}
