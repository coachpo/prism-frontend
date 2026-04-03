import { ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocale } from "@/i18n/useLocale";
import { formatMoneyMicros } from "@/lib/costing";
import { cn } from "@/lib/utils";
import type {
  UsageEndpointModelStatistic,
  UsageEndpointStatistic,
  UsageSnapshotCurrency,
} from "@/lib/types";
import { DataTable, type DataTableColumn } from "./data-table";

interface EndpointStatisticsTableProps {
  currency: UsageSnapshotCurrency;
  items: UsageEndpointStatistic[];
}

export function EndpointStatisticsTable({ currency, items }: EndpointStatisticsTableProps) {
  const { formatNumber, locale, messages } = useLocale();
  const rows = [...items].sort((left, right) => right.request_count - left.request_count);

  const modelColumns: DataTableColumn<UsageEndpointModelStatistic>[] = [
    {
      cell: (item) => <span className="font-medium text-foreground">{item.model_label}</span>,
      header: messages.nav.models,
      id: "model",
      sortValue: (item) => item.model_label,
    },
    {
      cell: (item) => formatNumber(item.request_count),
      className: "text-right tabular-nums",
      header: messages.statistics.requests,
      headerClassName: "text-right",
      id: "requests",
      sortValue: (item) => item.request_count,
    },
    {
      cell: (item) => (
        <span className={cn("tabular-nums font-medium", getSuccessRateClass(item.success_rate))}>
          {formatNumber(item.success_rate, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          })}
          %
        </span>
      ),
      className: "text-right tabular-nums",
      header: messages.statistics.successRate,
      headerClassName: "text-right",
      id: "success-rate",
      sortValue: (item) => item.success_rate,
    },
    {
      cell: (item) => formatNumber(item.total_tokens),
      className: "text-right tabular-nums",
      header: messages.statistics.totalTokens,
      headerClassName: "text-right",
      id: "tokens",
      sortValue: (item) => item.total_tokens,
    },
    {
      cell: (item) =>
        item.total_cost_micros > 0
          ? formatMoneyMicros(
              item.total_cost_micros,
              currency.symbol,
              currency.code,
              2,
              6,
              locale,
            )
          : "—",
      className: "text-right tabular-nums",
      header: messages.statistics.totalSpend,
      headerClassName: "text-right",
      id: "spend",
      sortValue: (item) => item.total_cost_micros,
    },
  ];

  return (
    <Card className="border-border/70 bg-card/95 shadow-none" data-testid="statistics-endpoint-table">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {messages.statistics.endpointStatisticsTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {messages.statistics.topEndpointsByCost}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {rows.length === 0 ? (
          <EmptyState
            className="py-10"
            description={messages.statistics.noEndpointStatisticsDescription}
            title={messages.statistics.noEndpointStatisticsTitle}
          />
        ) : (
          <div className="space-y-3">
            {rows.map((item) => {
              const detailId = item.endpoint_id ?? item.endpoint_label;
              const modelRows = [...item.models].sort(
                (left, right) => right.request_count - left.request_count,
              );
              const summaryMetrics = [
                {
                  label: messages.statistics.requests,
                  value: formatNumber(item.request_count),
                },
                {
                  label: messages.statistics.successRate,
                  value: `${formatNumber(item.success_rate, {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  })}%`,
                  valueClassName: getSuccessRateClass(item.success_rate),
                },
                {
                  label: messages.statistics.totalTokens,
                  value: formatNumber(item.total_tokens),
                },
                {
                  label: messages.statistics.totalSpend,
                  value: formatMoneyMicros(
                    item.total_cost_micros,
                    currency.symbol,
                    currency.code,
                    2,
                    6,
                    locale,
                  ),
                },
              ];

              return (
                <Collapsible key={detailId}>
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/15">
                    <CollapsibleTrigger
                      className="group flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30"
                      data-testid="statistics-endpoint-collapsible"
                    >
                      <div className="min-w-0 space-y-3">
                        <div className="space-y-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-foreground">
                              {item.endpoint_label}
                            </h3>
                            {item.endpoint_id !== null ? (
                              <span className="rounded-full border border-border/70 bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                #{item.endpoint_id}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(modelRows.length)} {messages.nav.models}
                          </p>
                        </div>
                      </div>

                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>

                    <CollapsibleContent
                      className="border-t border-border/60 bg-background/70"
                      data-testid={`statistics-endpoint-details-${detailId}`}
                    >
                      <div className="space-y-4 px-4 py-4">
                        <dl
                          className="grid overflow-hidden rounded-xl border border-border/60 bg-muted/25 sm:grid-cols-2 xl:grid-cols-4"
                          data-testid={`statistics-endpoint-summary-${detailId}`}
                        >
                          {summaryMetrics.map((metric, index) => (
                            <div
                              className={cn(
                                "space-y-1 px-4 py-3",
                                index > 0 && "border-t border-border/60 sm:border-t-0",
                                index % 2 === 1 && "sm:border-l sm:border-border/60",
                                index >= 2 && "xl:border-t-0",
                                index >= 2 && "xl:border-l xl:border-border/60",
                              )}
                              data-slot="endpoint-summary-item"
                              key={metric.label}
                            >
                              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                {metric.label}
                              </dt>
                              <dd className={cn("text-sm font-semibold tabular-nums text-foreground", metric.valueClassName)}>
                                {metric.value}
                              </dd>
                            </div>
                          ))}
                        </dl>

                        <DataTable
                          columns={modelColumns}
                          emptyState={
                            <EmptyState
                              className="py-8"
                              description={messages.statistics.noDataAvailable}
                              title={messages.statistics.noModelStatisticsTitle}
                            />
                          }
                          getRowId={(model) => model.model_id}
                          initialSort={{ columnId: "requests", direction: "desc" }}
                          items={modelRows}
                          testId={`statistics-endpoint-models-table-${detailId}`}
                        />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getSuccessRateClass(successRate: number) {
  return successRate >= 95
    ? "text-emerald-600 dark:text-emerald-400"
    : successRate >= 80
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";
}
