import { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Coins,
  Gauge,
} from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { MetricCard } from "@/components/MetricCard";
import { formatMoneyMicros } from "@/lib/costing";
import type { StatisticsRequestLogEntry } from "@/lib/types";
import { OperationsSectionTitle } from "./OperationsSectionTitle";

interface OperationsHealthSectionProps {
  requestLogRows: StatisticsRequestLogEntry[];
  filteredRequestCount: number;
  filteredErrorCount: number;
  filteredSuccessCount: number;
  filteredSuccessRate: number;
  requestsPerSecond: number;
  filteredAvgLatency: number;
  filteredP95Latency: number;
  filteredP99Latency: number;
  rate4xx: number;
  rate5xx: number;
  cacheHitRate: number;
  ttftP95: number;
  reportSymbol: string;
  reportCode: string;
}

export function OperationsHealthSection({
  requestLogRows,
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
  reportSymbol,
  reportCode,
}: OperationsHealthSectionProps) {
  const { formatNumber, locale, messages } = useLocale();
  const { totalSpendMicros, totalTokens, rate4xxCount, rate5xxCount, cachedRowCount } = useMemo(() => {
    let totalSpendMicros = 0;
    let totalTokens = 0;
    let rate4xxCount = 0;
    let rate5xxCount = 0;
    let cachedRowCount = 0;

    for (const row of requestLogRows) {
      totalSpendMicros += row.total_cost_user_currency_micros ?? 0;
      totalTokens += row.total_tokens ?? 0;

      if (row.status_code >= 500) {
        rate5xxCount += 1;
      } else if (row.status_code >= 400) {
        rate4xxCount += 1;
      }

      if ((row.cache_read_input_tokens ?? 0) > 0) {
        cachedRowCount += 1;
      }
    }

    return {
      totalSpendMicros,
      totalTokens,
      rate4xxCount,
      rate5xxCount,
      cachedRowCount,
    };
  }, [requestLogRows]);

  return (
    <div className="space-y-3">
      <OperationsSectionTitle
        title={messages.statistics.health}
        icon={CheckCircle2}
        iconClassName="h-4 w-4 text-emerald-600"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCard
          label="RPS"
          value={requestsPerSecond.toFixed(requestsPerSecond < 10 ? 2 : 1)}
          detail={messages.statistics.requestsInWindow(formatNumber(filteredRequestCount))}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.successRate}
          value={`${filteredSuccessRate.toFixed(1)}%`}
          detail={`${formatNumber(filteredErrorCount)} ${messages.statistics.errors.toLowerCase()}`}
          icon={<Gauge className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.p99Latency}
          value={`${formatNumber(filteredP99Latency)}ms`}
          detail={`TTFT p95: ${formatNumber(ttftP95)}ms`}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.p95Latency}
          value={`${formatNumber(filteredP95Latency)}ms`}
          detail={`${messages.dashboard.avgLatency}: ${formatNumber(filteredAvgLatency)}ms`}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.totalSpend}
          value={formatMoneyMicros(totalSpendMicros, reportSymbol, reportCode, 2, 6, locale)}
          detail={`${formatNumber(totalTokens)} ${messages.statistics.tokens.toLowerCase()}`}
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCard
          label={messages.statistics.fivexxRate}
          value={`${rate5xx.toFixed(2)}%`}
          detail={messages.statistics.totalRequests(formatNumber(rate5xxCount))}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.fourxxRate}
          value={`${rate4xx.toFixed(2)}%`}
          detail={messages.statistics.totalRequests(formatNumber(rate4xxCount))}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.cacheHitRate}
          value={`${cacheHitRate.toFixed(1)}%`}
          detail={messages.statistics.cachedRows(formatNumber(cachedRowCount))}
          icon={<Coins className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.dashboard.requests24h}
          value={formatNumber(filteredRequestCount)}
          detail={messages.statistics.successful(formatNumber(filteredSuccessCount))}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <MetricCard
          label={messages.statistics.totalTokens}
          value={formatNumber(totalTokens)}
          detail={messages.statistics.inputOutputSpecial}
          icon={<Coins className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
