import { Activity, Coins, DollarSign, Gauge } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { formatMoneyMicros } from "@/lib/costing";
import type {
  UsageRequestTrendSeries,
  UsageSnapshotCurrency,
  UsageSnapshotOverview,
  UsageTokenTrendSeries,
} from "@/lib/types";
import { UsageKpiCard } from "../charts/UsageKpiCard";

interface UsageOverviewSectionProps {
  currency: UsageSnapshotCurrency;
  overview: UsageSnapshotOverview;
  requestTrendSeries: UsageRequestTrendSeries[];
  tokenUsageTrendSeries: UsageTokenTrendSeries[];
}

function resolveTrendSeriesLabel<T extends { key: string }>(series: T[]): T | null {
  return series.find((item) => item.key === "all") ?? series[0] ?? null;
}

export function UsageOverviewSection({
  currency,
  overview,
  requestTrendSeries,
  tokenUsageTrendSeries,
}: UsageOverviewSectionProps) {
  const { formatNumber, locale, messages } = useLocale();

  const requestSparkline = resolveTrendSeriesLabel(requestTrendSeries)?.points.map((point) => ({
    label: point.bucket_start,
    value: point.request_count,
  }));

  const tokenSparkline = resolveTrendSeriesLabel(tokenUsageTrendSeries)?.points.map((point) => ({
    label: point.bucket_start,
    value: point.total_tokens,
  }));

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{messages.statistics.overviewTitle}</h2>
        <p className="text-sm text-muted-foreground">{messages.statistics.statisticsDescription}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UsageKpiCard
          detail={messages.statistics.totalRequests(formatNumber(overview.total_requests))}
          icon={<Activity className="h-4 w-4" />}
          label={messages.statistics.requests}
          sparkline={requestSparkline}
          sparklineColor="var(--color-chart-1)"
          value={formatNumber(overview.total_requests)}
        />
        <UsageKpiCard
          accentClassName="bg-emerald-500/10 text-emerald-500"
          detail={`${formatNumber(overview.input_tokens)} in · ${formatNumber(overview.output_tokens)} out`}
          icon={<Coins className="h-4 w-4" />}
          label={messages.statistics.totalTokens}
          sparkline={tokenSparkline}
          sparklineColor="var(--color-chart-2)"
          value={formatNumber(overview.total_tokens)}
        />
        <UsageKpiCard
          accentClassName="bg-amber-500/10 text-amber-500"
          detail={messages.statistics.successful(formatNumber(overview.success_requests))}
          icon={<Gauge className="h-4 w-4" />}
          label={messages.statistics.successRate}
          sparkline={requestSparkline}
          sparklineColor="var(--color-chart-4)"
          value={`${overview.success_rate.toFixed(1)}%`}
        />
        <UsageKpiCard
          accentClassName="bg-cyan-500/10 text-cyan-500"
          detail={`${messages.statistics.averageRpm}: ${overview.average_rpm.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          label={messages.statistics.totalSpend}
          sparkline={tokenSparkline}
          sparklineColor="var(--color-chart-3)"
          value={formatMoneyMicros(
            overview.total_cost_micros,
            currency.symbol,
            currency.code,
            2,
            6,
            locale,
          )}
        />
      </div>
    </section>
  );
}
