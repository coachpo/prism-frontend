import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiFamilyIcon } from "@/components/ApiFamilyIcon";
import { useLocale } from "@/i18n/useLocale";
import { formatApiFamily } from "@/lib/utils";
import { formatMoneyMicros } from "@/lib/costing";
import { useTimezone } from "@/hooks/useTimezone";
import { Coins, Gauge, FileText } from "lucide-react";
import { formatLatencyForDisplay } from "./modelDetailMetricsAndPaths";
import type { ModelConfig, SpendingSummary } from "@/lib/types";

interface OverviewCardsProps {
  model: ModelConfig;
  spending: SpendingSummary | null;
  spendingLoading: boolean;
  spendingCurrencySymbol: string;
  spendingCurrencyCode: string;
  metrics24hLoading: boolean;
  modelKpis: {
    successRate: number | null;
    p95LatencyMs: number | null;
    requestCount24h: number;
    spend24hMicros: number | null;
  };
  proxyTargetSummary?: {
    targetCount: number;
    firstTargetId: string | null;
    firstTargetLabel: string | null;
    routePolicyLabel: string;
  };
  onViewRequestLogs?: () => void;
}

export function OverviewCards({
  model,
  spending,
  spendingLoading,
  spendingCurrencySymbol,
  spendingCurrencyCode,
  metrics24hLoading,
  modelKpis,
  proxyTargetSummary,
  onViewRequestLogs,
}: OverviewCardsProps) {
  const { format: formatTime } = useTimezone();
  const { formatNumber, locale, messages } = useLocale();
  const copy = messages.modelDetail;
  const strategyCopy = messages.loadbalanceStrategyCopy;
  const fieldCopy = messages.common;
  const apiFamily = model.api_family ?? "openai";
  const vendorLabel = model.vendor?.name ?? formatApiFamily(apiFamily);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold">{copy.configuration}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{fieldCopy.vendor}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{vendorLabel}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{fieldCopy.apiFamily}</p>
                <div className="flex items-center gap-2">
                  <ApiFamilyIcon apiFamily={apiFamily} size={14} />
                  <span className="text-sm font-medium">{formatApiFamily(apiFamily)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {model.model_type === "proxy" ? copy.proxyRouting : copy.loadbalanceStrategy}
                </p>
                <div className="text-sm font-medium">
                  {model.model_type === "proxy" ? (
                    <div className="space-y-0.5">
                      <div>{proxyTargetSummary?.routePolicyLabel ?? copy.orderedPriorityRouting}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {copy.targets(formatNumber(proxyTargetSummary?.targetCount ?? 0))}
                        {proxyTargetSummary?.firstTargetId
                          ? ` · ${copy.firstTarget(proxyTargetSummary.firstTargetId)}`
                          : ""}
                      </div>
                    </div>
                  ) : model.loadbalance_strategy ? (
                    <div className="space-y-0.5">
                      <div>{model.loadbalance_strategy.name}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {model.loadbalance_strategy.strategy_type === "fill-first"
                          ? strategyCopy.fillFirstSummary
                          : model.loadbalance_strategy.strategy_type === "round-robin"
                            ? strategyCopy.roundRobinSummary
                          : model.loadbalance_strategy.strategy_type === "failover"
                            ? strategyCopy.failoverSummary
                            : strategyCopy.singleLabel}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{copy.unassigned}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{copy.strategyRecovery}</p>
                <span className="text-sm font-medium">
                  {model.model_type === "native" && model.loadbalance_strategy ? (
                    model.loadbalance_strategy.strategy_type === "single" ? (
                      <span className="text-muted-foreground">{copy.notApplicableForSingleStrategies}</span>
                    ) : model.loadbalance_strategy.failover_recovery_enabled ? (
                      <span className="text-emerald-600 dark:text-emerald-400">{copy.enabled}</span>
                    ) : (
                      <span className="text-muted-foreground">{copy.disabled}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">{messages.common.notApplicable}</span>
                  )}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{copy.created}</p>
                <span className="text-sm font-medium">
                  {formatTime(model.created_at, { year: "numeric", month: "numeric", day: "numeric" })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Coins className="h-4 w-4" />
              {copy.costOverview}
            </h3>
            {spendingLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : spending ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{copy.totalCost(spendingCurrencyCode)}</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatMoneyMicros(
                      spending.total_cost_micros,
                      spendingCurrencySymbol,
                      spendingCurrencyCode,
                      2,
                      6,
                      locale,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{copy.requestsLabel}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{copy.successfulRequests(formatNumber(spending.successful_request_count))}</p>
                    <p className="text-xs text-muted-foreground">
                      {copy.totalTokens(formatNumber(spending.total_tokens))}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{copy.avgCostPerRequest}</span>
                    <span className="font-medium font-mono">
                      {formatMoneyMicros(
                        spending.avg_cost_per_successful_request_micros,
                        spendingCurrencySymbol,
                        spendingCurrencyCode,
                        4,
                        6,
                        locale,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground">
                <p className="text-sm">{copy.noCostDataAvailable}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Gauge className="h-4 w-4" />
            {copy.modelKpis24h}
          </h3>
          {metrics24hLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">{copy.successRate24h}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.successRate === null
                    ? "-"
                    : `${formatNumber(modelKpis.successRate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">{copy.p95Latency24h}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatLatencyForDisplay(modelKpis.p95LatencyMs)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">{copy.requests24h}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatNumber(modelKpis.requestCount24h)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">{copy.spend24h(spendingCurrencyCode)}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.spend24hMicros === null
                    ? "-"
                    : formatMoneyMicros(
                        modelKpis.spend24hMicros,
                        spendingCurrencySymbol,
                        spendingCurrencyCode,
                        2,
                        6,
                        locale,
                      )}
                </p>
              </div>
            </div>
          )}
          {onViewRequestLogs && (
            <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 text-xs" onClick={onViewRequestLogs}>
              <FileText className="h-3.5 w-3.5" />
              {copy.viewRequestLogs}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
