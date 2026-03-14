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
import { MetricCard } from "@/components/MetricCard";
import { formatMoneyMicros } from "@/lib/costing";
import type { RequestLogEntry } from "@/lib/types";
import { OperationsSectionTitle } from "./OperationsSectionTitle";

interface OperationsHealthSectionProps {
  requestLogRows: RequestLogEntry[];
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
        title="Health"
        icon={CheckCircle2}
        iconClassName="h-4 w-4 text-emerald-600"
      />

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
          detail={`${filteredErrorCount.toLocaleString()} errors`}
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
          detail={`Avg: ${filteredAvgLatency.toLocaleString()}ms`}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Total Spend"
          value={formatMoneyMicros(totalSpendMicros, reportSymbol, reportCode)}
          detail={`${totalTokens.toLocaleString()} tokens`}
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCard
          label="5xx Rate"
          value={`${rate5xx.toFixed(2)}%`}
          detail={`${rate5xxCount.toLocaleString()} requests`}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <MetricCard
          label="4xx Rate"
          value={`${rate4xx.toFixed(2)}%`}
          detail={`${rate4xxCount.toLocaleString()} requests`}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <MetricCard
          label="Cache Hit Rate"
          value={`${cacheHitRate.toFixed(1)}%`}
          detail={`${cachedRowCount.toLocaleString()} cached rows`}
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
          value={totalTokens.toLocaleString()}
          detail="Input + output + special tokens"
          icon={<Coins className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
