import { EmptyState } from "@/components/EmptyState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import type { UsageProxyApiKeyStatistic, UsageSnapshotCurrency } from "@/lib/types";

interface ProxyApiKeyStatisticsTableProps {
  authEnabled?: boolean;
  currency?: UsageSnapshotCurrency;
  items: UsageProxyApiKeyStatistic[];
}

export function ProxyApiKeyStatisticsTable({
  authEnabled,
  currency = { code: "USD", symbol: "$" },
  items,
}: ProxyApiKeyStatisticsTableProps) {
  const { formatNumber, locale, messages } = useLocale();
  const rows = [...items].sort((left, right) => right.request_count - left.request_count);

  return (
    <Card className="border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{messages.statistics.proxyApiKeyStatisticsTitle}</h2>
          <p className="text-sm text-muted-foreground">{messages.statistics.proxyApiKey}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {rows.length === 0 ? (
          <EmptyState
            className="py-10"
            description={messages.statistics.noProxyApiKeyUsageDescription}
            title={messages.statistics.noProxyApiKeyUsageTitle}
          />
        ) : (
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.statistics.proxyApiKey}</TableHead>
                  <TableHead>{messages.statistics.apiKeyPrefix}</TableHead>
                  <TableHead>{messages.statistics.requests}</TableHead>
                  <TableHead>{messages.statistics.successRate}</TableHead>
                  <TableHead>{messages.statistics.totalTokens}</TableHead>
                  <TableHead>{messages.statistics.totalSpend}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.proxy_api_key_id ?? item.proxy_api_key_label}>
                    <TableCell className="font-medium">
                      {authEnabled === false && item.proxy_api_key_id === null ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-muted-foreground/80">N/A</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              {messages.statistics.proxyApiKeyNotApplicableAuthDisabledTooltip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        item.proxy_api_key_label
                      )}
                    </TableCell>
                    <TableCell>{item.key_prefix ?? "—"}</TableCell>
                    <TableCell>{formatNumber(item.request_count)}</TableCell>
                    <TableCell>{item.success_rate.toFixed(1)}%</TableCell>
                    <TableCell>{formatNumber(item.total_tokens)}</TableCell>
                    <TableCell>{formatMoneyMicros(item.total_cost_micros, currency.symbol, currency.code, 2, 6, locale)}</TableCell>
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
