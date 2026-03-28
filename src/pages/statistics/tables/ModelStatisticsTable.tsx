import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { formatMoneyMicros } from "@/lib/costing";
import type { UsageModelStatistic, UsageSnapshotCurrency } from "@/lib/types";

interface ModelStatisticsTableProps {
  currency: UsageSnapshotCurrency;
  items: UsageModelStatistic[];
}

export function ModelStatisticsTable({ currency, items }: ModelStatisticsTableProps) {
  const { formatNumber, locale, messages } = useLocale();
  const rows = [...items].sort((left, right) => right.request_count - left.request_count);

  return (
    <Card className="border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {messages.statistics.modelStatisticsTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {messages.statistics.topModelsByCost}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {rows.length === 0 ? (
          <EmptyState
            className="py-10"
            description={messages.statistics.noModelStatisticsDescription}
            title={messages.statistics.noModelStatisticsTitle}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map((item) => (
              <div
                key={item.model_id}
                data-testid="model-stat-card"
                className="rounded-xl border border-border/70 bg-muted/15 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {item.model_label}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/70 bg-background/80 text-[10px] font-medium"
                      >
                        {item.api_family}
                      </Badge>

                      {item.total_cost_micros > 0 ? (
                        <div
                          data-testid="model-stat-cost"
                          className="rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground"
                        >
                          {formatMoneyMicros(
                            item.total_cost_micros,
                            currency.symbol,
                            currency.code,
                            2,
                            6,
                            locale,
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {messages.statistics.requests}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatNumber(item.request_count)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {messages.statistics.successRate}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {item.success_rate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {messages.statistics.totalTokens}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatNumber(item.total_tokens)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
