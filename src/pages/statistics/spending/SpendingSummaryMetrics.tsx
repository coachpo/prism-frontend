import { Activity, CircleDollarSign, Coins, Gauge, TrendingUp } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
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
  const { formatNumber, locale, messages } = useLocale();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        label={messages.statistics.totalSpend}
        value={formatMoneyMicros(spending.summary.total_cost_micros, reportSymbol, reportCode, 2, 6, locale)}
        detail={messages.statistics.totalRequests(formatNumber(spending.summary.successful_request_count))}
        icon={<CircleDollarSign className="h-4 w-4" />}
      />
      <MetricCard
        label={messages.statistics.dollarsPerRequest}
        value={formatMoneyMicros(
          spending.summary.avg_cost_per_successful_request_micros,
          reportSymbol,
          reportCode,
          4,
          4,
          locale,
        )}
        detail={messages.statistics.successOnly}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        label={messages.statistics.dollarsPerMillionTokens}
        value={formatMoneyMicros(
          spending.summary.total_tokens > 0
            ? Math.round((spending.summary.total_cost_micros / spending.summary.total_tokens) * 1_000_000)
            : 0,
          reportSymbol,
          reportCode,
          4,
          4,
          locale,
        )}
        detail={`${messages.statistics.input}: ${(spending.summary.total_input_tokens / 1000).toFixed(0)}k / ${messages.statistics.output}: ${(spending.summary.total_output_tokens / 1000).toFixed(0)}k`}
        icon={<Coins className="h-4 w-4" />}
      />
      <MetricCard
        label={messages.statistics.totalTokens}
        value={`${(spending.summary.total_tokens / 1_000_000).toFixed(1)}M`}
        detail={`${messages.statistics.cachedPrefix}: ${(spending.summary.total_cache_read_input_tokens / 1000).toFixed(0)}k`}
        icon={<Activity className="h-4 w-4" />}
      />
      <MetricCard
        label={messages.statistics.pricedPercent}
        value={`${(
          (spending.summary.priced_request_count / (spending.summary.successful_request_count || 1)) *
          100
        ).toFixed(1)}%`}
        detail={messages.statistics.unpriced(formatNumber(spending.summary.unpriced_request_count))}
        icon={<Gauge className="h-4 w-4" />}
      />
    </div>
  );
}
