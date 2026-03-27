import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
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
import type { UsageSnapshotCurrency } from "@/lib/types";
import type { UsageStatisticsRequestEventRow } from "../useUsageStatisticsPageData";

interface RequestEventsTableProps {
  currency?: UsageSnapshotCurrency;
  items: UsageStatisticsRequestEventRow[];
  total: number;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createRequestEventsCsv(items: UsageStatisticsRequestEventRow[]) {
  const header = ["ingress_request_id", "status_code", "model_label", "endpoint_label", "proxy_api_key", "total_tokens", "total_cost_micros"];
  const rows = items.map((item) => [
    item.ingress_request_id,
    String(item.status_code),
    item.model_label,
    item.endpoint_label,
    item.proxy_api_key.label ?? "",
    String(item.total_tokens),
    String(item.total_cost_micros),
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export function RequestEventsTable({
  currency = { code: "USD", symbol: "$" },
  items,
  total,
}: RequestEventsTableProps) {
  const { formatNumber, formatRelativeTimeFromNow, locale, messages } = useLocale();
  const rows = [...items].sort((left, right) => right.created_at.localeCompare(left.created_at));

  const handleExportJson = () => {
    downloadBlob(
      new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
      "prism-request-events.json",
    );
  };

  const handleExportCsv = () => {
    downloadBlob(new Blob([createRequestEventsCsv(rows)], { type: "text/csv;charset=utf-8" }), "prism-request-events.csv");
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{messages.statistics.requestEventsTitle}</h2>
            <p className="text-sm text-muted-foreground">{messages.statistics.totalRequests(formatNumber(total))}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button aria-label={messages.statistics.exportRequestEventsJson} onClick={handleExportJson} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {messages.statistics.exportRequestEventsJson}
            </Button>
            <Button aria-label={messages.statistics.exportRequestEventsCsv} onClick={handleExportCsv} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {messages.statistics.exportRequestEventsCsv}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {rows.length === 0 ? (
          <EmptyState
            className="py-10"
            description={messages.statistics.noRequestEventsDescription}
            title={messages.statistics.noRequestEventsTitle}
          />
        ) : (
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.requestLogs.time}</TableHead>
                  <TableHead>{messages.requestLogs.ingressRequestId}</TableHead>
                  <TableHead>{messages.nav.models}</TableHead>
                  <TableHead>{messages.statistics.proxyApiKey}</TableHead>
                  <TableHead>{messages.requestLogs.status}</TableHead>
                  <TableHead>{messages.requestLogs.attemptNumber}</TableHead>
                  <TableHead>{messages.statistics.totalTokens}</TableHead>
                  <TableHead>{messages.requestLogs.totalCost}</TableHead>
                  <TableHead className="text-right">{messages.statistics.investigate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.ingress_request_id}>
                    <TableCell>{formatRelativeTimeFromNow(item.created_at)}</TableCell>
                    <TableCell className="font-medium">{item.ingress_request_id}</TableCell>
                    <TableCell>{item.model_label}</TableCell>
                    <TableCell>{item.proxy_api_key.label ?? "—"}</TableCell>
                    <TableCell>{item.status_code}</TableCell>
                    <TableCell>{formatNumber(item.attempt_count)}</TableCell>
                    <TableCell>{formatNumber(item.total_tokens)}</TableCell>
                    <TableCell>
                      {formatMoneyMicros(item.total_cost_micros, currency.symbol, currency.code, 2, 6, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={item.request_logs_href}>{messages.statistics.viewInRequestLogs}</Link>
                      </Button>
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
