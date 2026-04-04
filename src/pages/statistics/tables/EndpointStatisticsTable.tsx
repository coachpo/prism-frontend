import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLocale } from "@/i18n/useLocale";
import { formatMoneyMicros } from "@/lib/costing";
import type { UsageEndpointStatistic, UsageSnapshotCurrency } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DataTable, type DataTableColumn } from "./data-table";

interface EndpointStatisticsTableProps {
  currency: UsageSnapshotCurrency;
  items: UsageEndpointStatistic[];
}

export function EndpointStatisticsTable({ currency, items }: EndpointStatisticsTableProps) {
  const { formatNumber, locale, messages } = useLocale();
  const rows = [...items].sort((left, right) => right.request_count - left.request_count);

  const columns: DataTableColumn<UsageEndpointStatistic>[] = [
    {
      cell: (item) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{item.endpoint_label}</div>
          {item.endpoint_id !== null ? (
            <div className="mt-1 font-mono text-xs text-muted-foreground">#{item.endpoint_id}</div>
          ) : null}
        </div>
      ),
      header: messages.statistics.endpointGroup,
      id: "endpoint",
      sortValue: (item) => `${item.endpoint_label} ${item.endpoint_id ?? ""}`,
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
          <p className="text-sm text-muted-foreground">{messages.statistics.topEndpointsByCost}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <DataTable
          columns={columns}
          emptyState={
            <EmptyState
              className="py-10"
              description={messages.statistics.noEndpointStatisticsDescription}
              title={messages.statistics.noEndpointStatisticsTitle}
            />
          }
          getRowId={(item) => String(item.endpoint_id ?? item.endpoint_label)}
          initialSort={{ columnId: "requests", direction: "desc" }}
          items={rows}
          testId="statistics-endpoint-data-table"
        />
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
