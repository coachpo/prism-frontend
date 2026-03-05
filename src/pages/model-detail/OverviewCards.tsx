import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderIcon } from "@/components/ProviderIcon";
import { formatProviderType, formatLabel } from "@/lib/utils";
import { formatMoneyMicros } from "@/lib/costing";
import { useTimezone } from "@/hooks/useTimezone";
import { ChevronRight, Coins, Gauge } from "lucide-react";
import { formatLatencyForDisplay } from "./utils";
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
}

export function OverviewCards({
  model,
  spending,
  spendingLoading,
  spendingCurrencySymbol,
  spendingCurrencyCode,
  metrics24hLoading,
  modelKpis,
}: OverviewCardsProps) {
  const { format: formatTime } = useTimezone();

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Configuration</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Provider</p>
                <div className="flex items-center gap-2">
                  <ProviderIcon providerType={model.provider.provider_type} size={14} />
                  <span className="text-sm font-medium">{formatProviderType(model.provider.provider_type)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {model.model_type === "proxy" ? "Redirects To" : "Load Balancing"}
                </p>
                <span className="text-sm font-medium">
                  {model.model_type === "proxy" ? (
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs">{model.redirect_to}</span>
                    </span>
                  ) : (
                    formatLabel(model.lb_strategy)
                  )}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recovery Policy</p>
                <span className="text-sm font-medium">
                  {model.model_type === "native" && model.lb_strategy === "failover" ? (
                    model.failover_recovery_enabled ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Enabled (Base cooldown {model.failover_recovery_cooldown_seconds}s + adaptive backoff/jitter)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <span className="text-sm font-medium">
                  {formatTime(model.created_at, { year: "numeric", month: "numeric", day: "numeric" })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Cost Overview
            </h3>
            {spendingLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : spending ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Cost ({spendingCurrencyCode})</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatMoneyMicros(
                      spending.total_cost_micros,
                      spendingCurrencySymbol,
                      spendingCurrencyCode,
                      2,
                      6
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Requests</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {spending.successful_request_count.toLocaleString()} successful
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {spending.total_tokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg Cost / Request</span>
                    <span className="font-medium font-mono">
                      {formatMoneyMicros(
                        spending.avg_cost_per_successful_request_micros,
                        spendingCurrencySymbol,
                        spendingCurrencyCode,
                        4,
                        6
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground">
                <p className="text-sm">No cost data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Model KPIs (24h)
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
                <p className="text-[11px] text-muted-foreground">Success rate (24h)</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.successRate === null ? "-" : `${modelKpis.successRate.toFixed(1)}%`}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">P95 latency (24h)</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatLatencyForDisplay(modelKpis.p95LatencyMs)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">Requests (24h)</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.requestCount24h.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">Spend (24h, {spendingCurrencyCode})</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.spend24hMicros === null
                    ? "-"
                    : formatMoneyMicros(
                        modelKpis.spend24hMicros,
                        spendingCurrencySymbol,
                        spendingCurrencyCode,
                        2,
                        6
                      )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
