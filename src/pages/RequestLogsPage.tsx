import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTimezone } from "@/hooks/useTimezone";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import { api } from "@/lib/api";
import { formatMoneyMicros, formatTokenCount, formatUnpricedReasonLabel } from "@/lib/costing";
import type { ConnectionDropdownItem, RequestLogEntry } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { ProviderSelect } from "@/components/ProviderSelect";
import { ProviderIcon } from "@/components/ProviderIcon";
import { TokenMetricCell } from "@/components/statistics/TokenMetricCell";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Activity, AlertCircle, CircleHelp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function formatErrorDetail(detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    const msg =
      parsed?.error?.message ||
      parsed?.error?.msg ||
      parsed?.detail ||
      parsed?.message;
    if (msg) return String(msg);
    return detail;
  } catch {
    return detail;
  }
}

function metricUnavailableReason(
  log: Pick<RequestLogEntry, "status_code" | "is_stream">,
  value: number | null | undefined
): string {
  if (value !== null && value !== undefined) {
    return "";
  }
  if (log.status_code >= 400) {
    return "request failed before usage accounting";
  }
  if (log.is_stream) {
    return "stream ended without usage event";
  }
  return "upstream did not report this metric";
}

function HeaderWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {label}
            <CircleHelp className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type TimeRange = "1h" | "24h" | "7d" | "all";
type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";
type OutcomeFilter = "all" | "success" | "error";
type StreamFilter = "all" | "stream" | "non_stream";

const REQUEST_TIME_RANGES: readonly TimeRange[] = ["1h", "24h", "7d", "all"];
const REQUEST_SPECIAL_TOKEN_FILTERS: readonly SpecialTokenFilter[] = [
  "all",
  "has_cached",
  "has_reasoning",
  "has_any_special",
  "missing_special",
];
const REQUEST_OUTCOME_FILTERS: readonly OutcomeFilter[] = ["all", "success", "error"];
const REQUEST_STREAM_FILTERS: readonly StreamFilter[] = ["all", "stream", "non_stream"];
const REQUEST_LIMIT_OPTIONS = [25, 50, 100, 200] as const;
const DEFAULT_REQUEST_LIMIT = 100;

function parseEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function parseNonNegativeIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseConnectionParam(value: string | null): string {
  if (!value) return "__all__";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "__all__";
}

function parseRequestLimitParam(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return REQUEST_LIMIT_OPTIONS.includes(parsed as (typeof REQUEST_LIMIT_OPTIONS)[number])
    ? parsed
    : DEFAULT_REQUEST_LIMIT;
}

function hasSpecialTokenValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined;
}

function rowHasAnySpecialToken(log: RequestLogEntry): boolean {
  return (
    hasSpecialTokenValue(log.cache_read_input_tokens) ||
    hasSpecialTokenValue(log.cache_creation_input_tokens) ||
    hasSpecialTokenValue(log.reasoning_tokens)
  );
}

function getConnectionLabel(
  connection: Pick<ConnectionDropdownItem, "id" | "name" | "description">
): string {
  return connection.name || connection.description || `Connection #${connection.id}`;
}

export function RequestLogsPage() {
  const { format: formatTime } = useTimezone();
  const { navigateToConnection } = useConnectionNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [models, setModels] = useState<{ model_id: string; display_name: string | null }[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);

  const initialModelId = searchParams.get("model_id");
  const initialProviderType = searchParams.get("provider_type");

  const [modelId, setModelId] = useState(
    initialModelId && initialModelId.trim() !== "" ? initialModelId : "__all__"
  );
  const [providerType, setProviderType] = useState(
    initialProviderType && initialProviderType.trim() !== "" ? initialProviderType : "all"
  );
  const [connectionId, setConnectionId] = useState(() =>
    parseConnectionParam(searchParams.get("connection_id"))
  );
  const [timeRange, setTimeRange] = useState<TimeRange>(() =>
    parseEnumParam(searchParams.get("time_range"), REQUEST_TIME_RANGES, "24h")
  );
  const [specialTokenFilter, setSpecialTokenFilter] = useState<SpecialTokenFilter>(() =>
    parseEnumParam(
      searchParams.get("special_token_filter"),
      REQUEST_SPECIAL_TOKEN_FILTERS,
      "all"
    )
  );
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>(() =>
    parseEnumParam(searchParams.get("outcome_filter"), REQUEST_OUTCOME_FILTERS, "all")
  );
  const [streamFilter, setStreamFilter] = useState<StreamFilter>(() =>
    parseEnumParam(searchParams.get("stream_filter"), REQUEST_STREAM_FILTERS, "all")
  );
  const [limit, setLimit] = useState(() =>
    parseRequestLimitParam(searchParams.get("limit"))
  );
  const [offset, setOffset] = useState(() =>
    parseNonNegativeIntParam(searchParams.get("offset"), 0)
  );
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
        ]);
        setModels(modelsData.map((m) => ({ model_id: m.model_id, display_name: m.display_name })));
        setConnections(connectionsData.items);
      } catch (error) {
        console.error("Failed to load request-log filters", error);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const setOrDelete = (key: string, value: string, defaultValue?: string) => {
          if (!value || (defaultValue !== undefined && value === defaultValue)) {
            next.delete(key);
            return;
          }
          next.set(key, value);
        };

        setOrDelete("model_id", modelId, "__all__");
        setOrDelete("provider_type", providerType, "all");
        setOrDelete("connection_id", connectionId, "__all__");
        setOrDelete("time_range", timeRange, "24h");
        setOrDelete("special_token_filter", specialTokenFilter, "all");
        setOrDelete("outcome_filter", outcomeFilter, "all");
        setOrDelete("stream_filter", streamFilter, "all");

        if (limit === DEFAULT_REQUEST_LIMIT) next.delete("limit");
        else next.set("limit", String(limit));

        if (offset <= 0) next.delete("offset");
        else next.set("offset", String(offset));

        return next.toString() === prev.toString() ? prev : next;
      },
      { replace: true }
    );
  }, [
    connectionId,
    limit,
    modelId,
    offset,
    outcomeFilter,
    providerType,
    setSearchParams,
    specialTokenFilter,
    streamFilter,
    timeRange,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchLogs = async () => {
        setLoading(true);
        try {
          let fromTime: string | undefined;
          const now = new Date();
          if (timeRange === "1h") {
            fromTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          } else if (timeRange === "24h") {
            fromTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          } else if (timeRange === "7d") {
            fromTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          }

          const response = await api.stats.requests({
            model_id: modelId === "__all__" ? undefined : modelId,
            provider_type: providerType === "all" ? undefined : providerType,
            connection_id: connectionId === "__all__" ? undefined : Number.parseInt(connectionId, 10),
            from_time: fromTime,
            limit,
            offset,
          });

          setLogs(response.items);
          setTotal(response.total);
        } catch (error) {
          console.error("Failed to fetch request logs", error);
        } finally {
          setLoading(false);
        }
      };

      fetchLogs();
    }, 350);

    return () => clearTimeout(timeout);
  }, [connectionId, limit, modelId, offset, providerType, timeRange]);

  const filteredRows = useMemo(() => {
    return logs.filter((log) => {
      if (specialTokenFilter === "has_cached" && !hasSpecialTokenValue(log.cache_read_input_tokens)) {
        return false;
      }
      if (specialTokenFilter === "has_reasoning" && !hasSpecialTokenValue(log.reasoning_tokens)) {
        return false;
      }
      if (specialTokenFilter === "has_any_special" && !rowHasAnySpecialToken(log)) {
        return false;
      }
      if (specialTokenFilter === "missing_special" && rowHasAnySpecialToken(log)) {
        return false;
      }

      if (outcomeFilter === "success" && log.status_code >= 400) {
        return false;
      }
      if (outcomeFilter === "error" && log.status_code < 400) {
        return false;
      }

      if (streamFilter === "stream" && !log.is_stream) {
        return false;
      }
      if (streamFilter === "non_stream" && log.is_stream) {
        return false;
      }

      return true;
    });
  }, [logs, outcomeFilter, specialTokenFilter, streamFilter]);

  const errorRows = filteredRows.filter((row) => row.status_code >= 400).length;
  const streamRows = filteredRows.filter((row) => row.is_stream).length;
  const canPaginateForward = offset + limit < total;
  const currentPage = total > 0 ? Math.floor(offset / limit) + 1 : 1;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const rangeStart = total > 0 ? offset + 1 : 0;
  const rangeEnd = total > 0 ? Math.min(offset + logs.length, total) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Request Logs"
        description="Full-fidelity request telemetry with operational and cost-level fields"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Rows Loaded"
          value={logs.length.toLocaleString()}
          detail={total > 0 ? `Page ${currentPage} of ${totalPages}` : "Current time window"}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Rows Visible"
          value={filteredRows.length.toLocaleString()}
          detail="After local filters"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          label="Error Rows"
          value={errorRows.toLocaleString()}
          detail="Status >= 400"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <MetricCard
          label="Streaming Rows"
          value={streamRows.toLocaleString()}
          detail="is_stream=true"
          icon={<TypeBadge label="SSE" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 w-fit">
            {REQUEST_TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                className={cn("h-7 px-3 text-xs", timeRange === range && "shadow-sm")}
                onClick={() => {
                  setTimeRange(range);
                  setOffset(0);
                }}
              >
                {range === "all" ? "All" : range}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Select
              value={modelId}
              onValueChange={(value) => {
                setModelId(value);
                setOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Models</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.model_id} value={model.model_id}>
                    {model.display_name || model.model_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ProviderSelect
              value={providerType}
              onValueChange={(value) => {
                setProviderType(value);
                setOffset(0);
              }}
              className="h-8 text-xs"
            />

            <Select
              value={connectionId}
              onValueChange={(value) => {
                setConnectionId(value);
                setOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Connections</SelectItem>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={String(connection.id)}>
                    {getConnectionLabel(connection)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={outcomeFilter}
              onValueChange={(value) => {
                setOutcomeFilter(value as OutcomeFilter);
                setOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="success">Success only</SelectItem>
                <SelectItem value="error">Errors only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={streamFilter}
              onValueChange={(value) => {
                setStreamFilter(value as StreamFilter);
                setOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Stream type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stream Types</SelectItem>
                <SelectItem value="stream">Streaming only</SelectItem>
                <SelectItem value="non_stream">Non-stream only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={specialTokenFilter}
              onValueChange={(value) => {
                setSpecialTokenFilter(value as SpecialTokenFilter);
                setOffset(0);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Special token rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rows</SelectItem>
                <SelectItem value="has_cached">Has cached</SelectItem>
                <SelectItem value="has_reasoning">Has reasoning</SelectItem>
                <SelectItem value="has_any_special">Has any special</SelectItem>
                <SelectItem value="missing_special">Missing special</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Request Log Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading request logs...</div>
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No request logs found"
              description="Adjust filters or widen your time range."
            />
          ) : (
            <div className="max-h-[640px] overflow-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Model</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Provider</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Connection</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Latency</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">In</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">Out</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">
                      <HeaderWithTooltip
                        label="Cached"
                        tooltip="Input tokens served from upstream cache."
                      />
                    </TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">
                      <HeaderWithTooltip
                        label="Cache Create"
                        tooltip="Input tokens used to create cache entries."
                      />
                    </TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">
                      <HeaderWithTooltip
                        label="Reasoning"
                        tooltip="Internal reasoning/thinking tokens reported by upstream."
                      />
                    </TableHead>
                    <TableHead className="text-xs hidden sm:table-cell xl:hidden">Usage</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Total Tokens</TableHead>
                    <TableHead className="text-xs hidden 2xl:table-cell">Input Cost</TableHead>
                    <TableHead className="text-xs hidden 2xl:table-cell">Output Cost</TableHead>
                    <TableHead className="text-xs hidden 2xl:table-cell">Cached Cost</TableHead>
                    <TableHead className="text-xs hidden 2xl:table-cell">Cache Create Cost</TableHead>
                    <TableHead className="text-xs hidden 2xl:table-cell">Reasoning Cost</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">Spend</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">Billable</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">Priced</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">
                      <HeaderWithTooltip
                        label="Unpriced Reason"
                        tooltip="Reason why a request was not priced."
                      />
                    </TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Stream</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((log) => {
                    const endpointLogId = log.connection_id;
                    const reportCurrencySymbol = log.report_currency_symbol || "$";
                    const reportCurrencyCode = log.report_currency_code || undefined;
                    const errorMsg = formatErrorDetail(log.error_detail);

                    return (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="whitespace-nowrap py-2 text-muted-foreground">
                          {formatTime(log.created_at, {
                            hour: "numeric",
                            minute: "numeric",
                            second: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="py-2 font-medium max-w-[140px] truncate">
                          {log.model_id}
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <ProviderIcon providerType={log.provider_type} size={12} />
                            <span className="capitalize">{log.provider_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell">
                          {endpointLogId === null ? (
                            <span className="text-muted-foreground">{log.endpoint_description || "-"}</span>
                          ) : log.endpoint_description ? (
                            <button
                              onClick={() => navigateToConnection(endpointLogId)}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              {log.endpoint_description}
                            </button>
                          ) : (
                            <button
                              onClick={() => navigateToConnection(endpointLogId)}
                              className="text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              #{endpointLogId}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <ValueBadge
                            label={String(log.status_code)}
                            intent={
                              log.status_code < 300
                                ? "success"
                                : log.status_code < 500
                                  ? "warning"
                                  : "danger"
                            }
                            className="tabular-nums"
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell tabular-nums text-muted-foreground">
                          {log.response_time_ms.toFixed(0)}ms
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.input_tokens}
                            nullReason={metricUnavailableReason(log, log.input_tokens)}
                            formatValue={(value) => value.toLocaleString()}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.output_tokens}
                            nullReason={metricUnavailableReason(log, log.output_tokens)}
                            formatValue={(value) => value.toLocaleString()}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.cache_read_input_tokens}
                            nullReason={metricUnavailableReason(log, log.cache_read_input_tokens)}
                            formatValue={(value) => value.toLocaleString()}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.cache_creation_input_tokens}
                            nullReason={metricUnavailableReason(log, log.cache_creation_input_tokens)}
                            formatValue={(value) => value.toLocaleString()}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.reasoning_tokens}
                            nullReason={metricUnavailableReason(log, log.reasoning_tokens)}
                            formatValue={(value) => value.toLocaleString()}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell xl:hidden text-muted-foreground">
                          <div className="space-y-0.5 leading-tight">
                            <p>
                              In {formatTokenCount(log.input_tokens)} / Out {" "}
                              {formatTokenCount(log.output_tokens)} / Total {" "}
                              {formatTokenCount(log.total_tokens)}
                            </p>
                            <p>
                              Cached {formatTokenCount(log.cache_read_input_tokens)} / Cache Create {" "}
                              {formatTokenCount(log.cache_creation_input_tokens)} / Reasoning {" "}
                              {formatTokenCount(log.reasoning_tokens)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.total_tokens}
                            nullReason={metricUnavailableReason(log, log.total_tokens)}
                            formatValue={(value) => value.toLocaleString()}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.input_cost_micros}
                            nullReason={metricUnavailableReason(log, log.input_cost_micros)}
                            formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.output_cost_micros}
                            nullReason={metricUnavailableReason(log, log.output_cost_micros)}
                            formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.cache_read_input_cost_micros}
                            nullReason={metricUnavailableReason(log, log.cache_read_input_cost_micros)}
                            formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.cache_creation_input_cost_micros}
                            nullReason={metricUnavailableReason(log, log.cache_creation_input_cost_micros)}
                            formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden 2xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.reasoning_cost_micros}
                            nullReason={metricUnavailableReason(log, log.reasoning_cost_micros)}
                            formatValue={(value) => formatMoneyMicros(value, reportCurrencySymbol)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell tabular-nums text-muted-foreground">
                          <TokenMetricCell
                            value={log.total_cost_user_currency_micros}
                            nullReason={metricUnavailableReason(log, log.total_cost_user_currency_micros)}
                            formatValue={(value) =>
                              formatMoneyMicros(value, reportCurrencySymbol, reportCurrencyCode, 2, 6)
                            }
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell">
                          <ValueBadge
                            label={
                              log.billable_flag === null
                                ? "Unknown"
                                : log.billable_flag
                                  ? "Yes"
                                  : "No"
                            }
                            intent={
                              log.billable_flag === null
                                ? "muted"
                                : log.billable_flag
                                  ? "success"
                                  : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell">
                          <ValueBadge
                            label={
                              log.priced_flag === null
                                ? "Unknown"
                                : log.priced_flag
                                  ? "Yes"
                                  : "No"
                            }
                            intent={
                              log.priced_flag === null
                                ? "muted"
                                : log.priced_flag
                                  ? "success"
                                  : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell max-w-[220px] truncate text-muted-foreground">
                          {formatUnpricedReasonLabel(log.unpriced_reason)}
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell">
                          {log.is_stream ? <TypeBadge label="Stream" /> : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell max-w-[180px]">
                          {errorMsg ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-destructive cursor-help">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{errorMsg}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-sm">
                                  <pre className="whitespace-pre-wrap text-xs">{log.error_detail}</pre>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && total > 0 && (
            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows</span>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    setLimit(Number.parseInt(value, 10));
                    setOffset(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-20 text-xs">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0 || loading}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPaginateForward || loading}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
