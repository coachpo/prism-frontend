import { ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale } from "@/i18n/useLocale";
import { formatMoneyMicros } from "@/lib/costing";
import { cn } from "@/lib/utils";
import type { UsageEndpointStatistic, UsageSnapshotCurrency } from "@/lib/types";

interface EndpointStatisticsTableProps {
  currency: UsageSnapshotCurrency;
  items: UsageEndpointStatistic[];
}

export function EndpointStatisticsTable({ currency, items }: EndpointStatisticsTableProps) {
  const { formatNumber, locale, messages } = useLocale();
  const rows = [...items].sort((left, right) => right.request_count - left.request_count);

  return (
    <Card className="border-border/70 bg-card/95 shadow-none">
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

              return (
                <Collapsible key={detailId}>
                  <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/15">
                    <CollapsibleTrigger
                      data-testid="endpoint-stat-trigger"
                      className="group flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30"
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

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
                            <p
                              className={cn(
                                "mt-1 text-sm font-semibold",
                                item.success_rate >= 95
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : item.success_rate >= 80
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400",
                              )}
                            >
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

                          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              {messages.statistics.totalSpend}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatMoneyMicros(
                                item.total_cost_micros,
                                currency.symbol,
                                currency.code,
                                2,
                                6,
                                locale,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>

                    <CollapsibleContent
                      data-testid={`endpoint-stat-details-${detailId}`}
                      className="border-t border-border/60 bg-background/70"
                    >
                      <div className="px-4 py-4">
                        <div className="overflow-hidden rounded-xl border border-border/60 bg-background/80">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{messages.nav.models}</TableHead>
                                <TableHead>{messages.statistics.requests}</TableHead>
                                <TableHead>{messages.statistics.successRate}</TableHead>
                                <TableHead>{messages.statistics.totalTokens}</TableHead>
                                <TableHead>{messages.statistics.totalSpend}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {modelRows.map((model) => (
                                <TableRow key={model.model_id}>
                                  <TableCell className="font-medium">
                                    {model.model_label}
                                  </TableCell>
                                  <TableCell>{formatNumber(model.request_count)}</TableCell>
                                  <TableCell>{model.success_rate.toFixed(1)}%</TableCell>
                                  <TableCell>{formatNumber(model.total_tokens)}</TableCell>
                                  <TableCell>
                                    {model.total_cost_micros > 0
                                      ? formatMoneyMicros(
                                          model.total_cost_micros,
                                          currency.symbol,
                                          currency.code,
                                          2,
                                          6,
                                          locale,
                                        )
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
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
