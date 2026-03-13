import { Fragment, useMemo, type ReactNode, type RefObject } from "react";
import { Activity, AlertCircle, ArrowRight, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/EmptyState";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TokenMetricCell } from "@/components/statistics/TokenMetricCell";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { formatMoneyMicros, formatUnpricedReasonLabel } from "@/lib/costing";
import type { RequestLogEntry } from "@/lib/types";
import { VIEW_COLUMNS, renderTableHeader } from "./columns";
import type { ColumnId } from "./columns";
import {
  UNIVERSAL_TIMESTAMP_FORMAT,
  formatErrorDetail,
  formatLatency,
  getDisplayCurrency,
  metricUnavailableReason,
} from "./formatters";
import { REQUEST_LIMIT_OPTIONS } from "./queryParams";
import type { ViewType } from "./queryParams";
interface RequestLogsTableProps {
  rows: RequestLogEntry[];
  pageRowCount: number;
  loading: boolean;
  total: number;
  limit: number;
  offset: number;
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;
  view: ViewType;
  allColumnsMode: boolean;
  openLogDetail: (log: RequestLogEntry) => void;
  clearAllFilters: () => void;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  navigateToConnection: (id: number) => Promise<void>;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  getRowClassName?: (row: RequestLogEntry) => string | undefined;
  onRowAnimationEnd?: (row: RequestLogEntry) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: ReactNode;
}
export function RequestLogsTable({
  rows,
  pageRowCount,
  loading,
  total,
  limit,
  offset,
  setLimit,
  setOffset,
  view,
  allColumnsMode,
  openLogDetail,
  clearAllFilters,
  formatTime,
  navigateToConnection,
  scrollContainerRef,
  getRowClassName,
  onRowAnimationEnd,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
}: RequestLogsTableProps) {
  const visibleColumns = useMemo(() => VIEW_COLUMNS[view], [view]);

  const canPaginateForward = offset + limit < total;
  const currentPage = total > 0 ? Math.floor(offset / limit) + 1 : 1;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const rangeStart = total > 0 ? offset + 1 : 0;
  const rangeEnd = total > 0 ? Math.min(offset + pageRowCount, total) : 0;

  const renderCell = (column: ColumnId, log: RequestLogEntry) => {
    const endpointLogId = log.connection_id;
    const { symbol: reportCurrencySymbol, code: reportCurrencyCode } = getDisplayCurrency(log);
    const errorMsg = formatErrorDetail(log.error_detail);

    switch (column) {
      case "request_id":
        return (
          <TableCell className="py-2 font-mono text-muted-foreground whitespace-nowrap">
            #{log.id}
          </TableCell>
        );
      case "time":
        return (
          <TableCell
            className={cn(
              "whitespace-nowrap py-2 text-muted-foreground font-mono w-[170px] min-w-[170px]",
              allColumnsMode && "sticky left-0 z-20 border-r border-border/70 bg-card"
            )}
          >
            {formatTime(log.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
          </TableCell>
        );
      case "model":
        return (
          <TableCell
            className={cn(
              "py-2 max-w-[180px] w-[180px] min-w-[180px] truncate font-medium",
              allColumnsMode && "sticky left-[170px] z-20 border-r border-border/70 bg-card"
            )}
            title={log.model_id}
          >
            {log.model_id}
          </TableCell>
        );
      case "provider":
        return (
          <TableCell
            className={cn(
              "py-2 w-[130px] min-w-[130px]",
              allColumnsMode && "sticky left-[350px] z-20 border-r border-border/70 bg-card"
            )}
          >
            <div className="flex items-center gap-1.5">
              <ProviderIcon providerType={log.provider_type} size={12} />
              <span className="capitalize">{log.provider_type}</span>
            </div>
          </TableCell>
        );
      case "endpoint":
        return (
          <TableCell className={cn("py-2 max-w-[240px] w-[240px] min-w-[240px] truncate", allColumnsMode && "sticky left-[480px] z-20 border-r border-border/70 bg-card")}>
            {endpointLogId === null ? (
              <span className="text-muted-foreground">{log.endpoint_description || "-"}</span>
            ) : (
              <button
                className="text-primary hover:underline cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  navigateToConnection(endpointLogId);
                }}
              >
                {log.endpoint_description || `#${endpointLogId}`}
              </button>
            )}
          </TableCell>
        );
      case "status":
        return (
          <TableCell className="py-2">
            <ValueBadge
              label={String(log.status_code)}
              intent={log.status_code < 300 ? "success" : log.status_code < 500 ? "warning" : "danger"}
              className="tabular-nums"
            />
          </TableCell>
        );
      case "latency":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{formatLatency(log.response_time_ms)}</span>
              </TooltipTrigger>
              <TooltipContent>{`${log.response_time_ms.toFixed(0)}ms`}</TooltipContent>
            </Tooltip>
          </TableCell>
        );
      case "stream":
        return (
          <TableCell className="py-2">
            {log.is_stream ? <TypeBadge label="Stream" /> : <span className="text-muted-foreground">-</span>}
          </TableCell>
        );
      case "input_tokens":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.input_tokens}
              nullReason={metricUnavailableReason(log, log.input_tokens)}
              formatValue={(value) => value.toLocaleString()}
            />
          </TableCell>
        );
      case "output_tokens":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.output_tokens}
              nullReason={metricUnavailableReason(log, log.output_tokens)}
              formatValue={(value) => value.toLocaleString()}
            />
          </TableCell>
        );
      case "total_tokens":
        return (
          <TableCell className="py-2 text-right tabular-nums text-foreground font-medium">
            <TokenMetricCell
              value={log.total_tokens}
              nullReason={metricUnavailableReason(log, log.total_tokens)}
              formatValue={(value) => value.toLocaleString()}
            />
          </TableCell>
        );
      case "cached_tokens":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.cache_read_input_tokens}
              nullReason={metricUnavailableReason(log, log.cache_read_input_tokens)}
              formatValue={(value) => value.toLocaleString()}
            />
          </TableCell>
        );
      case "cache_create_tokens":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.cache_creation_input_tokens}
              nullReason={metricUnavailableReason(log, log.cache_creation_input_tokens)}
              formatValue={(value) => value.toLocaleString()}
            />
          </TableCell>
        );
      case "reasoning_tokens":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.reasoning_tokens}
              nullReason={metricUnavailableReason(log, log.reasoning_tokens)}
              formatValue={(value) => value.toLocaleString()}
            />
          </TableCell>
        );
      case "input_cost":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.input_cost_micros}
              nullReason={metricUnavailableReason(log, log.input_cost_micros)}
              formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
            />
          </TableCell>
        );
      case "output_cost":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.output_cost_micros}
              nullReason={metricUnavailableReason(log, log.output_cost_micros)}
              formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
            />
          </TableCell>
        );
      case "cache_read_cost":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.cache_read_input_cost_micros}
              nullReason={metricUnavailableReason(log, log.cache_read_input_cost_micros)}
              formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
            />
          </TableCell>
        );
      case "cache_create_cost":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.cache_creation_input_cost_micros}
              nullReason={metricUnavailableReason(log, log.cache_creation_input_cost_micros)}
              formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
            />
          </TableCell>
        );
      case "reasoning_cost":
        return (
          <TableCell className="py-2 text-right tabular-nums text-muted-foreground">
            <TokenMetricCell
              value={log.reasoning_cost_micros}
              nullReason={metricUnavailableReason(log, log.reasoning_cost_micros)}
              formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
            />
          </TableCell>
        );
      case "total_cost":
        return (
          <TableCell className="py-2 text-right tabular-nums text-foreground font-medium">
            <TokenMetricCell
              value={log.total_cost_user_currency_micros}
              nullReason={metricUnavailableReason(log, log.total_cost_user_currency_micros)}
              formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol, reportCurrencyCode, 2, 6)}
            />
          </TableCell>
        );
      case "billable":
        return (
          <TableCell className="py-2 text-center">
            {log.billable_flag ? <Check className="h-3.5 w-3.5 mx-auto text-emerald-600" /> : <span className="text-muted-foreground">-</span>}
          </TableCell>
        );
      case "priced":
        return (
          <TableCell className="py-2 text-center">
            {log.priced_flag ? <Check className="h-3.5 w-3.5 mx-auto text-emerald-600" /> : <span className="text-muted-foreground">-</span>}
          </TableCell>
        );
      case "unpriced_reason":
        return (
          <TableCell className="py-2 max-w-[240px] truncate text-muted-foreground">
            {formatUnpricedReasonLabel(log.unpriced_reason)}
          </TableCell>
        );
      case "error":
        return (
          <TableCell className="py-2 max-w-[260px]">
            {errorMsg ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-destructive cursor-help">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{errorMsg}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <pre className="whitespace-pre-wrap text-xs">{log.error_detail}</pre>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>
        );
      default:
        return <TableCell className="py-2 text-muted-foreground">-</TableCell>;
    }
  };

  return (
    <div className="rounded-md border bg-card overflow-hidden relative flex-1 min-h-[420px] flex flex-col">
      <div ref={scrollContainerRef} className="flex-1 overflow-auto [scrollbar-gutter:stable] [&_[data-slot=table-container]]:overflow-x-visible">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Activity className="h-8 w-8 animate-pulse text-primary/50" />
              Loading request logs...
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title={emptyStateTitle ?? "No logs match your filters"}
              description={emptyStateDescription ?? "Try adjusting search or filters to widen this view."}
              action={
                emptyStateAction ?? (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Reset Filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table className={allColumnsMode ? "min-w-[2100px]" : "w-full"}>
            <TableHeader className="sticky top-0 z-10 border-b bg-card">
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column}
                    className={cn(
                      "text-xs whitespace-nowrap",
                      [
                        "latency",
                        "input_tokens",
                        "output_tokens",
                        "total_tokens",
                        "cached_tokens",
                        "cache_create_tokens",
                        "reasoning_tokens",
                        "input_cost",
                        "output_cost",
                        "cache_read_cost",
                        "cache_create_cost",
                        "reasoning_cost",
                        "total_cost",
                      ].includes(column)
                        ? "text-right"
                        : "",
                      ["billable", "priced"].includes(column) ? "text-center" : "",
                      allColumnsMode && column === "time"
                        ? "sticky left-0 z-20 w-[170px] min-w-[170px] border-r border-border/70 bg-card"
                        : "",
                      allColumnsMode && column === "model"
                        ? "sticky left-[170px] z-20 w-[180px] min-w-[180px] border-r border-border/70 bg-card"
                        : "",
                      allColumnsMode && column === "provider"
                        ? "sticky left-[350px] z-20 w-[130px] min-w-[130px] border-r border-border/70 bg-card"
                        : "",
                      allColumnsMode && column === "endpoint"
                        ? "sticky left-[480px] z-20 w-[240px] min-w-[240px] border-r border-border/70 bg-card"
                        : "",
                      allColumnsMode && column === "request_id" ? "w-[130px] min-w-[130px]" : ""
                    )}
                  >
                    {renderTableHeader(column)}
                  </TableHead>
                ))}
                <TableHead className="w-[46px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((log) => (
                <TableRow
                  key={log.id}
                  className={cn(
                    "text-xs cursor-pointer hover:bg-muted/50",
                    getRowClassName?.(log)
                  )}
                  onClick={() => openLogDetail(log)}
                  onAnimationEnd={() => onRowAnimationEnd?.(log)}
                >
                  {visibleColumns.map((column) => (
                    <Fragment key={column}>{renderCell(column, log)}</Fragment>
                  ))}
                  <TableCell className="py-2 text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && total > 0 ? (
        <div className="flex flex-col gap-3 border-t px-4 py-2 sm:flex-row sm:items-center sm:justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={String(limit)}
              onValueChange={(next) => {
                setLimit(Number.parseInt(next, 10));
                setOffset(0);
              }}
            >
              <SelectTrigger className="h-7 min-w-[4.5rem] text-xs tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_LIMIT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {rangeStart}-{rangeEnd} of {total} (Page {currentPage}/{totalPages})
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={offset === 0 || loading}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                <span className="sr-only">Previous</span>
                <ArrowRight className="h-3 w-3 rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={!canPaginateForward || loading}
                onClick={() => setOffset(offset + limit)}
              >
                <span className="sr-only">Next</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
