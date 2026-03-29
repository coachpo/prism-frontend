import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type {
  UsageRequestEventAvailableFilters,
  UsageSnapshotCurrency,
} from "@/lib/types";
import { cn, formatApiFamily } from "@/lib/utils";
import type { UsageStatisticsRequestEventRow } from "../useUsageStatisticsPageData";

interface RequestEventsTableProps {
  availableFilters?: UsageRequestEventAvailableFilters;
  currency?: UsageSnapshotCurrency;
  items: UsageStatisticsRequestEventRow[];
  renderLimit?: number;
  shownCount?: number;
  total: number;
}

interface FilterChipProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

const REQUEST_EVENTS_PAGE_SIZE = 25;

function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className={cn(
        "h-8 rounded-full px-3 text-xs",
        !active && "border-border/70 bg-background/80 hover:bg-muted/50",
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function FilterGroup({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
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
  const header = [
    "ingress_request_id",
    "status_code",
    "model_label",
    "endpoint_label",
    "proxy_api_key",
    "total_tokens",
    "total_cost_micros",
  ];
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

function createExportBlob(content: string, type: string) {
  const blob = new Blob([content], { type });

  if (typeof blob.text !== "function") {
    Object.assign(blob, {
      text: async () => content,
    });
  }

  return blob;
}

function getProxyKeyIdentity(
  label: string | null | undefined,
  keyPrefix: string | null | undefined,
) {
  return `${label ?? ""}::${keyPrefix ?? ""}`;
}

export function RequestEventsTable({
  availableFilters,
  currency = { code: "USD", symbol: "$" },
  items,
  renderLimit,
  shownCount,
  total,
}: RequestEventsTableProps) {
  const { formatNumber, formatRelativeTimeFromNow, locale, messages } = useLocale();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [selectedApiFamily, setSelectedApiFamily] = useState<string | null>(null);
  const [selectedProxyKey, setSelectedProxyKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const sortedRows = useMemo(
    () => [...items].sort((left, right) => right.created_at.localeCompare(left.created_at)),
    [items],
  );

  const filteredRows = useMemo(() => {
    return sortedRows.filter((item) => {
      if (selectedModelId && item.model_id !== selectedModelId) {
        return false;
      }
      if (selectedEndpointId && String(item.endpoint_id) !== selectedEndpointId) {
        return false;
      }
      if (selectedApiFamily && item.api_family !== selectedApiFamily) {
        return false;
      }
      if (
        selectedProxyKey &&
        getProxyKeyIdentity(item.proxy_api_key.label, item.proxy_api_key.key_prefix) !==
          selectedProxyKey
      ) {
        return false;
      }
      return true;
    });
  }, [selectedApiFamily, selectedEndpointId, selectedModelId, selectedProxyKey, sortedRows]);

  const hasActiveFilters = Boolean(
    selectedModelId || selectedEndpointId || selectedApiFamily || selectedProxyKey,
  );
  const totalRenderedRows = shownCount ?? items.length;
  const isCapped = typeof renderLimit === "number" && renderLimit > 0 && total > totalRenderedRows;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / REQUEST_EVENTS_PAGE_SIZE));
  const clampedPage = Math.min(currentPage, totalPages - 1);
  const pageStartIndex = clampedPage * REQUEST_EVENTS_PAGE_SIZE;
  const pageRows = filteredRows.slice(pageStartIndex, pageStartIndex + REQUEST_EVENTS_PAGE_SIZE);
  const pageStart = filteredRows.length === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = filteredRows.length === 0 ? 0 : pageStartIndex + pageRows.length;
  const hasPreviousPage = clampedPage > 0;
  const hasNextPage = clampedPage + 1 < totalPages;

  const clearFilters = () => {
    setCurrentPage(0);
    setSelectedModelId(null);
    setSelectedEndpointId(null);
    setSelectedApiFamily(null);
    setSelectedProxyKey(null);
  };

  const handleExportJson = () => {
    downloadBlob(
      createExportBlob(JSON.stringify(filteredRows, null, 2), "application/json"),
      "prism-request-events.json",
    );
  };

  const handleExportCsv = () => {
    downloadBlob(
      createExportBlob(createRequestEventsCsv(filteredRows), "text/csv;charset=utf-8"),
      "prism-request-events.csv",
    );
  };

  return (
    <Card className="border-border/70 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {messages.statistics.requestEventsTitle}
            </h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                {messages.statistics.showingRequestEvents(
                  formatNumber(filteredRows.length),
                  formatNumber(total),
                )}
              </p>
              {isCapped ? (
                <p>{messages.statistics.visibleRequestRows(formatNumber(totalRenderedRows))}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              aria-label={messages.statistics.exportRequestEventsJson}
              onClick={handleExportJson}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {messages.statistics.exportRequestEventsJson}
            </Button>
            <Button
              aria-label={messages.statistics.exportRequestEventsCsv}
              onClick={handleExportCsv}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {messages.statistics.exportRequestEventsCsv}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {sortedRows.length === 0 ? (
          <EmptyState
            className="py-10"
            description={messages.statistics.noRequestEventsDescription}
            title={messages.statistics.noRequestEventsTitle}
          />
        ) : (
          <div className="space-y-4">
            {availableFilters ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {messages.statistics.filters}
                  </p>
                  {hasActiveFilters ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={clearFilters}
                    >
                      {messages.statistics.clearFilters}
                    </Button>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-4 xl:grid-cols-2">
                  {availableFilters.models.length > 0 ? (
                    <FilterGroup label={messages.nav.models}>
                      {availableFilters.models.map((option) => (
                        <FilterChip
                          key={option.model_id}
                          active={selectedModelId === option.model_id}
                          label={option.label}
                          onClick={() => {
                            setCurrentPage(0);
                            setSelectedModelId((current) =>
                              current === option.model_id ? null : option.model_id,
                            );
                          }}
                        />
                      ))}
                    </FilterGroup>
                  ) : null}

                  {availableFilters.endpoints.length > 0 ? (
                    <FilterGroup label={messages.requestLogs.endpoint}>
                      {availableFilters.endpoints.map((option) => {
                        const endpointKey = String(option.endpoint_id);
                        return (
                          <FilterChip
                            key={endpointKey}
                            active={selectedEndpointId === endpointKey}
                            label={option.label}
                            onClick={() => {
                              setCurrentPage(0);
                              setSelectedEndpointId((current) =>
                                current === endpointKey ? null : endpointKey,
                              );
                            }}
                          />
                        );
                      })}
                    </FilterGroup>
                  ) : null}

                  {availableFilters.api_families.length > 0 ? (
                    <FilterGroup label={messages.common.apiFamily}>
                      {availableFilters.api_families.map((option) => (
                        <FilterChip
                          key={option.api_family}
                          active={selectedApiFamily === option.api_family}
                          label={option.label}
                          onClick={() => {
                            setCurrentPage(0);
                            setSelectedApiFamily((current) =>
                              current === option.api_family ? null : option.api_family,
                            );
                          }}
                        />
                      ))}
                    </FilterGroup>
                  ) : null}

                  {availableFilters.proxy_api_keys.length > 0 ? (
                    <FilterGroup label={messages.statistics.proxyApiKey}>
                      {availableFilters.proxy_api_keys.map((option) => {
                        const proxyKeyIdentity = getProxyKeyIdentity(
                          option.label,
                          option.key_prefix,
                        );

                        return (
                          <FilterChip
                            key={proxyKeyIdentity}
                            active={selectedProxyKey === proxyKeyIdentity}
                            label={option.label}
                            onClick={() => {
                              setCurrentPage(0);
                              setSelectedProxyKey((current) =>
                                current === proxyKeyIdentity ? null : proxyKeyIdentity,
                              );
                            }}
                          />
                        );
                      })}
                    </FilterGroup>
                  ) : null}
                </div>
              </div>
            ) : null}

            {filteredRows.length === 0 ? (
              <EmptyState
                className="py-10"
                description={messages.statistics.adjustFiltersOrTimeRange}
                title={messages.statistics.noRequestEventsTitle}
              />
            ) : (
              <div className="rounded-xl border border-border/60">
                <ScrollArea className="h-[32rem] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{messages.requestLogs.time}</TableHead>
                        <TableHead>{messages.requestLogs.ingressRequestId}</TableHead>
                        <TableHead>{messages.nav.models}</TableHead>
                        <TableHead>{messages.requestLogs.endpoint}</TableHead>
                        <TableHead>{messages.common.apiFamily}</TableHead>
                        <TableHead>{messages.statistics.proxyApiKey}</TableHead>
                        <TableHead>{messages.requestLogs.status}</TableHead>
                        <TableHead>{messages.statistics.totalTokens}</TableHead>
                        <TableHead>{messages.requestLogs.totalCost}</TableHead>
                        <TableHead className="text-right">
                          {messages.statistics.investigate}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {pageRows.map((item, index) => (
                        <TableRow key={item.ingress_request_id}>
                          <TableCell>{formatRelativeTimeFromNow(item.created_at)}</TableCell>
                          <TableCell className="max-w-56 font-mono text-[11px] whitespace-normal break-words [overflow-wrap:anywhere]">
                            {item.ingress_request_id}
                          </TableCell>
                          <TableCell className="font-medium">{item.model_label}</TableCell>
                          <TableCell>{item.endpoint_label}</TableCell>
                          <TableCell>{formatApiFamily(item.api_family)}</TableCell>
                          <TableCell>{item.proxy_api_key.label ?? "—"}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">{item.status_code}</p>
                              <p className="text-xs text-muted-foreground">
                                {messages.requestLogs.attemptNumber}: {formatNumber(item.attempt_count)}
                              </p>
                            </div>
                          </TableCell>
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
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to={item.request_logs_href}
                                aria-label={
                                  pageStartIndex + index === 0
                                    ? undefined
                                    : `${messages.statistics.viewInRequestLogs} ${item.ingress_request_id}`
                                }
                              >
                                {messages.statistics.viewInRequestLogs}
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {messages.statistics.requestEventsPaginationSummary(
                      formatNumber(pageStart),
                      formatNumber(pageEnd),
                      formatNumber(filteredRows.length),
                    )}
                  </p>

                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {messages.statistics.requestEventsPage(
                        formatNumber(clampedPage + 1),
                        formatNumber(totalPages),
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={!hasPreviousPage}
                      onClick={() => setCurrentPage((current) => Math.max(0, current - 1))}
                    >
                      {messages.statistics.previousPage}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={!hasNextPage}
                      onClick={() => setCurrentPage((current) => Math.min(totalPages - 1, current + 1))}
                    >
                      {messages.statistics.nextPage}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
