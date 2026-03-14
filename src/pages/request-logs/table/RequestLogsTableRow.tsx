import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TokenMetricCell } from "@/components/statistics/TokenMetricCell";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { formatMoneyMicros, formatUnpricedReasonLabel } from "@/lib/costing";
import type { RequestLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { type ColumnId, getRequestLogsStickyBodyClassName } from "../columns";
import {
  UNIVERSAL_TIMESTAMP_FORMAT,
  formatErrorDetail,
  formatLatency,
  getDisplayCurrency,
  metricUnavailableReason,
} from "../formatters";

interface RequestLogsTableRowProps {
  allColumnsMode: boolean;
  columns: ColumnId[];
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  getRowClassName?: (row: RequestLogEntry) => string | undefined;
  log: RequestLogEntry;
  navigateToConnection: (id: number) => Promise<void>;
  onRowAnimationEnd?: (row: RequestLogEntry) => void;
  openLogDetail: (log: RequestLogEntry) => void;
}

export function RequestLogsTableRow({
  allColumnsMode,
  columns,
  formatTime,
  getRowClassName,
  log,
  navigateToConnection,
  onRowAnimationEnd,
  openLogDetail,
}: RequestLogsTableRowProps) {
  return (
    <TableRow
      className={cn("cursor-pointer text-xs hover:bg-muted/50", getRowClassName?.(log))}
      onClick={() => openLogDetail(log)}
      onAnimationEnd={() => onRowAnimationEnd?.(log)}
    >
      {columns.map((column) => (
        <RequestLogsTableCell
          key={column}
          allColumnsMode={allColumnsMode}
          column={column}
          formatTime={formatTime}
          log={log}
          navigateToConnection={navigateToConnection}
        />
      ))}
      <TableCell className="py-2 text-right">
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function RequestLogsTableCell({
  allColumnsMode,
  column,
  formatTime,
  log,
  navigateToConnection,
}: {
  allColumnsMode: boolean;
  column: ColumnId;
  formatTime: (date: string, options?: Intl.DateTimeFormatOptions) => string;
  log: RequestLogEntry;
  navigateToConnection: (id: number) => Promise<void>;
}) {
  const endpointLogId = log.connection_id;
  const { symbol: reportCurrencySymbol, code: reportCurrencyCode } = getDisplayCurrency(log);
  const errorMsg = formatErrorDetail(log.error_detail);

  switch (column) {
    case "request_id":
      return (
        <TableCell className="whitespace-nowrap py-2 font-mono text-muted-foreground">
          #{log.id}
        </TableCell>
      );
    case "time":
      return (
        <TableCell
          className={cn(
            "w-[170px] min-w-[170px] whitespace-nowrap py-2 font-mono text-muted-foreground",
            getRequestLogsStickyBodyClassName(column, allColumnsMode),
          )}
        >
          {formatTime(log.created_at, UNIVERSAL_TIMESTAMP_FORMAT)}
        </TableCell>
      );
    case "model":
      return (
        <TableCell
          className={cn(
            "max-w-[180px] w-[180px] min-w-[180px] truncate py-2 font-medium",
            getRequestLogsStickyBodyClassName(column, allColumnsMode),
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
            "w-[130px] min-w-[130px] py-2",
            getRequestLogsStickyBodyClassName(column, allColumnsMode),
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
        <TableCell
          className={cn(
            "max-w-[240px] w-[240px] min-w-[240px] truncate py-2",
            getRequestLogsStickyBodyClassName(column, allColumnsMode),
          )}
        >
          {endpointLogId === null ? (
            <span className="text-muted-foreground">{log.endpoint_description || "-"}</span>
          ) : (
            <button
              className="cursor-pointer text-primary hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                void navigateToConnection(endpointLogId);
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
        <MetricCell value={log.input_tokens} log={log} formatValue={(value) => value.toLocaleString()} />
      );
    case "output_tokens":
      return (
        <MetricCell value={log.output_tokens} log={log} formatValue={(value) => value.toLocaleString()} />
      );
    case "total_tokens":
      return (
        <MetricCell
          className="text-foreground font-medium"
          value={log.total_tokens}
          log={log}
          formatValue={(value) => value.toLocaleString()}
        />
      );
    case "cached_tokens":
      return (
        <MetricCell
          value={log.cache_read_input_tokens}
          log={log}
          formatValue={(value) => value.toLocaleString()}
        />
      );
    case "cache_create_tokens":
      return (
        <MetricCell
          value={log.cache_creation_input_tokens}
          log={log}
          formatValue={(value) => value.toLocaleString()}
        />
      );
    case "reasoning_tokens":
      return (
        <MetricCell
          value={log.reasoning_tokens}
          log={log}
          formatValue={(value) => value.toLocaleString()}
        />
      );
    case "input_cost":
      return (
        <MetricCell
          value={log.input_cost_micros}
          log={log}
          formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
        />
      );
    case "output_cost":
      return (
        <MetricCell
          value={log.output_cost_micros}
          log={log}
          formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
        />
      );
    case "cache_read_cost":
      return (
        <MetricCell
          value={log.cache_read_input_cost_micros}
          log={log}
          formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
        />
      );
    case "cache_create_cost":
      return (
        <MetricCell
          value={log.cache_creation_input_cost_micros}
          log={log}
          formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
        />
      );
    case "reasoning_cost":
      return (
        <MetricCell
          value={log.reasoning_cost_micros}
          log={log}
          formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
        />
      );
    case "total_cost":
      return (
        <MetricCell
          className="text-foreground font-medium"
          value={log.total_cost_user_currency_micros}
          log={log}
          formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol, reportCurrencyCode, 2, 6)}
        />
      );
    case "billable":
      return <BooleanFlagCell checked={log.billable_flag} />;
    case "priced":
      return <BooleanFlagCell checked={log.priced_flag} />;
    case "unpriced_reason":
      return (
        <TableCell className="max-w-[240px] truncate py-2 text-muted-foreground">
          {formatUnpricedReasonLabel(log.unpriced_reason)}
        </TableCell>
      );
    case "error":
      return (
        <TableCell className="max-w-[260px] py-2">
          {errorMsg ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-help items-center gap-1 text-destructive">
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
}

function MetricCell({
  className,
  formatValue,
  log,
  value,
}: {
  className?: string;
  formatValue: (value: number) => string;
  log: Pick<RequestLogEntry, "status_code" | "is_stream">;
  value: number | null | undefined;
}) {
  return (
    <TableCell className={cn("py-2 text-right tabular-nums text-muted-foreground", className)}>
      <TokenMetricCell
        value={value}
        nullReason={metricUnavailableReason(log, value)}
        formatValue={formatValue}
      />
    </TableCell>
  );
}

function BooleanFlagCell({ checked }: { checked: boolean | null }) {
  return (
    <TableCell className="py-2 text-center">
      {checked ? <Check className="mx-auto h-3.5 w-3.5 text-emerald-600" /> : <span className="text-muted-foreground">-</span>}
    </TableCell>
  );
}
