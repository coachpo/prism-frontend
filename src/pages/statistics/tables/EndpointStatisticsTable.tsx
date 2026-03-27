import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { useLocale } from "@/i18n/useLocale";
import { formatMoneyMicros } from "@/lib/costing";
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
          <h2 className="text-lg font-semibold tracking-tight">{messages.statistics.endpointStatisticsTitle}</h2>
          <p className="text-sm text-muted-foreground">{messages.statistics.topEndpointsByCost}</p>
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
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.requestLogs.endpoint}</TableHead>
                  <TableHead>{messages.statistics.requests}</TableHead>
                  <TableHead>{messages.statistics.successRate}</TableHead>
                  <TableHead>{messages.statistics.totalTokens}</TableHead>
                  <TableHead>{messages.statistics.totalSpend}</TableHead>
                  <TableHead>{messages.nav.models}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.endpoint_id ?? item.endpoint_label}>
                    <TableCell className="font-medium">{item.endpoint_label}</TableCell>
                    <TableCell>{formatNumber(item.request_count)}</TableCell>
                    <TableCell>{item.success_rate.toFixed(1)}%</TableCell>
                    <TableCell>{formatNumber(item.total_tokens)}</TableCell>
                    <TableCell>
                      {formatMoneyMicros(item.total_cost_micros, currency.symbol, currency.code, 2, 6, locale)}
                    </TableCell>
                    <TableCell className="max-w-72 whitespace-normal text-sm text-muted-foreground">
                      {item.models.map((model) => model.model_label).join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
