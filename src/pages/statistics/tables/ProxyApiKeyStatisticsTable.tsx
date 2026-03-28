import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocale } from "@/i18n/useLocale";
import { formatMoneyMicros } from "@/lib/costing";
import type { UsageProxyApiKeyStatistic, UsageSnapshotCurrency } from "@/lib/types";

interface ProxyApiKeyStatisticsTableProps {
  authEnabled?: boolean;
  currency?: UsageSnapshotCurrency;
  items: UsageProxyApiKeyStatistic[];
}

function SummaryCard({
  label,
  value,
  supporting,
}: {
  label: string;
  value: string;
  supporting?: string;
}) {
  return (
    <div
      data-testid="proxy-key-summary-card"
      className="rounded-2xl border border-border/60 bg-background/80 p-4"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {supporting ? <p className="mt-1 text-xs text-muted-foreground">{supporting}</p> : null}
    </div>
  );
}

export function ProxyApiKeyStatisticsTable({
  authEnabled,
  currency = { code: "USD", symbol: "$" },
  items,
}: ProxyApiKeyStatisticsTableProps) {
  const { formatNumber, locale, messages } = useLocale();
  const rows = [...items].sort((left, right) => right.request_count - left.request_count);
  const totalRequests = rows.reduce((sum, item) => sum + item.request_count, 0);
  const totalTokens = rows.reduce((sum, item) => sum + item.total_tokens, 0);
  const totalSpendMicros = rows.reduce((sum, item) => sum + item.total_cost_micros, 0);

  return (
    <Card className="border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {messages.statistics.proxyApiKeyStatisticsTitle}
          </h2>
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
          <div className="space-y-4">
            <div data-testid="proxy-key-summary-grid" className="grid gap-3 md:grid-cols-3">
              <SummaryCard
                label={messages.statistics.proxyApiKey}
                value={formatNumber(rows.length)}
              />
              <SummaryCard
                label={messages.statistics.requests}
                value={formatNumber(totalRequests)}
                supporting={`${formatNumber(totalTokens)} ${messages.statistics.totalTokens}`}
              />
              <SummaryCard
                label={messages.statistics.totalSpend}
                value={formatMoneyMicros(totalSpendMicros, currency.symbol, currency.code, 2, 6, locale)}
              />
            </div>

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
                                <span className="cursor-help text-muted-foreground/80">
                                  {messages.common.notApplicable}
                                </span>
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
                      <TableCell>{formatNumber(item.success_rate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</TableCell>
                      <TableCell>{formatNumber(item.total_tokens)}</TableCell>
                      <TableCell>
                        {formatMoneyMicros(
                          item.total_cost_micros,
                          currency.symbol,
                          currency.code,
                          2,
                          6,
                          locale,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
