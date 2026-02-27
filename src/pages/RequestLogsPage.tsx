import { Fragment, useEffect, useMemo, useState, type ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { useTimezone } from "@/hooks/useTimezone";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import { api } from "@/lib/api";
import { formatMoneyMicros, formatTokenCount, formatUnpricedReasonLabel } from "@/lib/costing";
import type { ConnectionDropdownItem, Endpoint, RequestLogEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProviderIcon } from "@/components/ProviderIcon";
import { ProviderSelect } from "@/components/ProviderSelect";
import { TokenMetricCell } from "@/components/statistics/TokenMetricCell";
import { TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CircleHelp,
  Clock,
  Coins,
  Columns,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Search,
  X,
  Zap,
} from "lucide-react";

type TimeRange = "1h" | "24h" | "7d" | "all";
type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";
type OutcomeFilter = "all" | "success" | "error";
type StreamFilter = "all" | "stream" | "non_stream";
type LatencyBucket = "all" | "under_500ms" | "between_500ms_1s" | "between_1s_3s" | "over_3s";
type ViewType = "overview" | "performance" | "tokens" | "cost" | "cache" | "errors" | "all";
type TriageFilter = "none" | "slowest" | "expensive" | "most_tokens" | "errors_only" | "unpriced_only";

type ColumnId =
  | "request_id"
  | "time"
  | "model"
  | "provider"
  | "endpoint"
  | "status"
  | "latency"
  | "stream"
  | "input_tokens"
  | "output_tokens"
  | "total_tokens"
  | "cached_tokens"
  | "cache_create_tokens"
  | "reasoning_tokens"
  | "input_cost"
  | "output_cost"
  | "cache_read_cost"
  | "cache_create_cost"
  | "reasoning_cost"
  | "total_cost"
  | "billable"
  | "priced"
  | "unpriced_reason"
  | "error";

type OptionWithIcon<T> = {
  value: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

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

const LATENCY_BUCKETS: { value: LatencyBucket; label: string }[] = [
  { value: "all", label: "All latencies" },
  { value: "under_500ms", label: "< 500ms" },
  { value: "between_500ms_1s", label: "500ms - 1s" },
  { value: "between_1s_3s", label: "1s - 3s" },
  { value: "over_3s", label: ">= 3s" },
];

const VIEW_OPTIONS: OptionWithIcon<ViewType>[] = [
  { value: "overview", label: "Overview", icon: Activity },
  { value: "performance", label: "Performance", icon: Zap },
  { value: "tokens", label: "Tokens", icon: FileText },
  { value: "cost", label: "Cost & Billing", icon: Coins },
  { value: "cache", label: "Cache", icon: Database },
  { value: "errors", label: "Errors", icon: AlertTriangle },
  { value: "all", label: "All Columns", icon: Columns },
];

const TRIAGE_OPTIONS: OptionWithIcon<Exclude<TriageFilter, "none">>[] = [
  { value: "slowest", label: "Slowest", icon: Clock },
  { value: "expensive", label: "Most Expensive", icon: Coins },
  { value: "most_tokens", label: "Most Tokens", icon: FileText },
  { value: "errors_only", label: "Errors Only", icon: AlertCircle },
  { value: "unpriced_only", label: "Unpriced Only", icon: CircleHelp },
];

const VIEW_COLUMNS: Record<ViewType, ColumnId[]> = {
  overview: [
    "time",
    "model",
    "provider",
    "endpoint",
    "status",
    "latency",
    "total_tokens",
    "total_cost",
    "stream",
    "error",
  ],
  performance: [
    "time",
    "request_id",
    "model",
    "provider",
    "endpoint",
    "status",
    "latency",
    "stream",
    "error",
  ],
  tokens: [
    "time",
    "model",
    "provider",
    "input_tokens",
    "output_tokens",
    "cached_tokens",
    "cache_create_tokens",
    "reasoning_tokens",
    "total_tokens",
    "status",
  ],
  cost: [
    "time",
    "model",
    "provider",
    "input_cost",
    "output_cost",
    "cache_read_cost",
    "cache_create_cost",
    "reasoning_cost",
    "total_cost",
    "billable",
    "priced",
    "unpriced_reason",
  ],
  cache: [
    "time",
    "model",
    "provider",
    "status",
    "latency",
    "cached_tokens",
    "cache_create_tokens",
    "cache_read_cost",
    "cache_create_cost",
    "total_tokens",
  ],
  errors: [
    "time",
    "request_id",
    "model",
    "provider",
    "endpoint",
    "status",
    "latency",
    "error",
    "total_cost",
  ],
  all: [
    "time",
    "model",
    "provider",
    "endpoint",
    "request_id",
    "status",
    "latency",
    "stream",
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
    "billable",
    "priced",
    "unpriced_reason",
    "error",
  ],
};

function parseEnumParam<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function parseNonNegativeIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseOptionalNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseIdFilterParam(value: string | null): string {
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

function parseBooleanParam(value: string | null): boolean {
  return value === "true";
}

function parseTokenInputValue(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
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

function getConnectionLabel(connection: Pick<ConnectionDropdownItem, "id" | "name" | "description">): string {
  return connection.name || connection.description || `Connection #${connection.id}`;
}

function formatErrorDetail(detail: string | null): string | null {
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail);
    const msg = parsed?.error?.message || parsed?.error?.msg || parsed?.detail || parsed?.message;
    if (msg) return String(msg);
    return detail;
  } catch {
    return detail;
  }
}

function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(ms >= 10000 ? 1 : 2)}s`;
  }
  return `${ms.toFixed(0)}ms`;
}

function matchesLatencyBucket(bucket: LatencyBucket, responseTimeMs: number): boolean {
  if (bucket === "all") return true;
  if (bucket === "under_500ms") return responseTimeMs < 500;
  if (bucket === "between_500ms_1s") return responseTimeMs >= 500 && responseTimeMs < 1000;
  if (bucket === "between_1s_3s") return responseTimeMs >= 1000 && responseTimeMs < 3000;
  return responseTimeMs >= 3000;
}

function metricUnavailableReason(log: Pick<RequestLogEntry, "status_code" | "is_stream">, value: number | null | undefined): string {
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
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <CircleHelp className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function renderTableHeader(column: ColumnId): React.ReactNode {
  switch (column) {
    case "request_id":
      return "Request ID";
    case "time":
      return "Time";
    case "model":
      return "Model";
    case "provider":
      return "Provider";
    case "endpoint":
      return "Endpoint";
    case "status":
      return "Status";
    case "latency":
      return "Latency";
    case "stream":
      return "Stream";
    case "input_tokens":
      return "Input Tokens";
    case "output_tokens":
      return "Output Tokens";
    case "total_tokens":
      return "Total Tokens";
    case "cached_tokens":
      return <HeaderWithTooltip label="Cached Tokens" tooltip="Input tokens served from upstream cache." />;
    case "cache_create_tokens":
      return <HeaderWithTooltip label="Cache Create Tokens" tooltip="Input tokens used to create cache entries." />;
    case "reasoning_tokens":
      return <HeaderWithTooltip label="Reasoning Tokens" tooltip="Internal reasoning/thinking tokens reported by upstream." />;
    case "input_cost":
      return "Input Cost";
    case "output_cost":
      return "Output Cost";
    case "cache_read_cost":
      return "Cached Cost";
    case "cache_create_cost":
      return "Cache Create Cost";
    case "reasoning_cost":
      return "Reasoning Cost";
    case "total_cost":
      return "Total Cost";
    case "billable":
      return "Billable";
    case "priced":
      return "Priced";
    case "unpriced_reason":
      return "Unpriced Reason";
    case "error":
      return "Error";
    default:
      return "-";
  }
}

export function RequestLogsPage() {
  const { format: formatTime } = useTimezone();
  const { navigateToConnection } = useConnectionNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<{ model_id: string; display_name: string | null }[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);

  const initialModelId = searchParams.get("model_id");
  const initialProviderType = searchParams.get("provider_type");

  const [modelId, setModelId] = useState(
    initialModelId && initialModelId.trim() !== "" ? initialModelId : "__all__"
  );
  const [providerType, setProviderType] = useState(
    initialProviderType && initialProviderType.trim() !== "" ? initialProviderType : "all"
  );
  const [connectionId, setConnectionId] = useState(() => parseIdFilterParam(searchParams.get("connection_id")));
  const [endpointId, setEndpointId] = useState(() => parseIdFilterParam(searchParams.get("endpoint_id")));
  const [timeRange, setTimeRange] = useState<TimeRange>(() =>
    parseEnumParam(searchParams.get("time_range"), REQUEST_TIME_RANGES, "24h")
  );
  const [specialTokenFilter, setSpecialTokenFilter] = useState<SpecialTokenFilter>(() =>
    parseEnumParam(searchParams.get("special_token_filter"), REQUEST_SPECIAL_TOKEN_FILTERS, "all")
  );
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>(() =>
    parseEnumParam(searchParams.get("outcome_filter"), REQUEST_OUTCOME_FILTERS, "all")
  );
  const [streamFilter, setStreamFilter] = useState<StreamFilter>(() =>
    parseEnumParam(searchParams.get("stream_filter"), REQUEST_STREAM_FILTERS, "all")
  );
  const [limit, setLimit] = useState(() => parseRequestLimitParam(searchParams.get("limit")));
  const [offset, setOffset] = useState(() => parseNonNegativeIntParam(searchParams.get("offset"), 0));
  const [total, setTotal] = useState(0);

  const [view, setView] = useState<ViewType>(() =>
    parseEnumParam(
      searchParams.get("view"),
      VIEW_OPTIONS.map((option) => option.value),
      "overview"
    )
  );
  const [triage, setTriage] = useState<TriageFilter>(() =>
    parseEnumParam(
      searchParams.get("triage"),
      ["none", ...TRIAGE_OPTIONS.map((option) => option.value)],
      "none"
    )
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [latencyBucket, setLatencyBucket] = useState<LatencyBucket>(() =>
    parseEnumParam(
      searchParams.get("latency_bucket"),
      LATENCY_BUCKETS.map((bucket) => bucket.value),
      "all"
    )
  );
  const [showPricedOnly, setShowPricedOnly] = useState(parseBooleanParam(searchParams.get("priced_only")));
  const [showBillableOnly, setShowBillableOnly] = useState(parseBooleanParam(searchParams.get("billable_only")));
  const [tokenMin, setTokenMin] = useState<number | null>(() => parseOptionalNumber(searchParams.get("token_min")));
  const [tokenMax, setTokenMax] = useState<number | null>(() => parseOptionalNumber(searchParams.get("token_max")));

  const [tokenMinInput, setTokenMinInput] = useState(() =>
    tokenMin !== null && tokenMin !== undefined ? String(tokenMin) : ""
  );
  const [tokenMaxInput, setTokenMaxInput] = useState(() =>
    tokenMax !== null && tokenMax !== undefined ? String(tokenMax) : ""
  );
  const [selectedLog, setSelectedLog] = useState<RequestLogEntry | null>(null);

  const visibleColumns = useMemo(() => VIEW_COLUMNS[view], [view]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData, endpointsData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
          api.endpoints.list(),
        ]);
        setModels(modelsData.map((model) => ({ model_id: model.model_id, display_name: model.display_name })));
        setConnections(connectionsData.items);
        setEndpoints(endpointsData);
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
        setOrDelete("endpoint_id", endpointId, "__all__");
        setOrDelete("time_range", timeRange, "24h");
        setOrDelete("special_token_filter", specialTokenFilter, "all");
        setOrDelete("outcome_filter", outcomeFilter, "all");
        setOrDelete("stream_filter", streamFilter, "all");
        setOrDelete("view", view, "overview");
        setOrDelete("triage", triage, "none");
        setOrDelete("search", searchQuery, "");
        next.delete("endpoint");
        setOrDelete("latency_bucket", latencyBucket, "all");
        if (showPricedOnly) next.set("priced_only", "true");
        else next.delete("priced_only");

        if (showBillableOnly) next.set("billable_only", "true");
        else next.delete("billable_only");

        if (tokenMin === null) next.delete("token_min");
        else next.set("token_min", String(tokenMin));

        if (tokenMax === null) next.delete("token_max");
        else next.set("token_max", String(tokenMax));

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
    endpointId,
    latencyBucket,
    limit,
    modelId,
    offset,
    outcomeFilter,
    providerType,
    searchQuery,
    setSearchParams,
    showBillableOnly,
    showPricedOnly,
    specialTokenFilter,
    streamFilter,
    timeRange,
    tokenMax,
    tokenMin,
    triage,
    view,
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
            endpoint_id: endpointId === "__all__" ? undefined : Number.parseInt(endpointId, 10),
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
    }, 300);

    return () => clearTimeout(timeout);
  }, [connectionId, endpointId, limit, modelId, offset, providerType, timeRange]);

  const filteredAndSortedRows = useMemo(() => {
    let result = logs.filter((log) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const endpointLabel = log.endpoint_description || log.endpoint_base_url || "";
        const matches =
          log.model_id.toLowerCase().includes(query) ||
          log.provider_type.toLowerCase().includes(query) ||
          endpointLabel.toLowerCase().includes(query) ||
          (log.error_detail || "").toLowerCase().includes(query) ||
          String(log.status_code).includes(query) ||
          String(log.id).includes(query);
        if (!matches) return false;
      }

      if (!matchesLatencyBucket(latencyBucket, log.response_time_ms)) return false;

      const totalTokens = log.total_tokens ?? 0;
      if (tokenMin !== null && totalTokens < tokenMin) return false;
      if (tokenMax !== null && totalTokens > tokenMax) return false;

      if (showPricedOnly && !log.priced_flag) return false;
      if (showBillableOnly && !log.billable_flag) return false;

      if (specialTokenFilter === "has_cached" && !hasSpecialTokenValue(log.cache_read_input_tokens)) return false;
      if (specialTokenFilter === "has_reasoning" && !hasSpecialTokenValue(log.reasoning_tokens)) return false;
      if (specialTokenFilter === "has_any_special" && !rowHasAnySpecialToken(log)) return false;
      if (specialTokenFilter === "missing_special" && rowHasAnySpecialToken(log)) return false;

      if (outcomeFilter === "success" && log.status_code >= 400) return false;
      if (outcomeFilter === "error" && log.status_code < 400) return false;

      if (streamFilter === "stream" && !log.is_stream) return false;
      if (streamFilter === "non_stream" && log.is_stream) return false;

      if (triage === "errors_only" && log.status_code < 400) return false;
      if (triage === "unpriced_only" && log.priced_flag) return false;

      return true;
    });

    if (triage !== "none") {
      result = [...result].sort((a, b) => {
        if (triage === "slowest") {
          return b.response_time_ms - a.response_time_ms;
        }
        if (triage === "expensive") {
          return (b.total_cost_user_currency_micros || 0) - (a.total_cost_user_currency_micros || 0);
        }
        if (triage === "most_tokens") {
          return (b.total_tokens || 0) - (a.total_tokens || 0);
        }
        return 0;
      });
    }

    return result;
  }, [
    latencyBucket,
    logs,
    outcomeFilter,
    searchQuery,
    showBillableOnly,
    showPricedOnly,
    specialTokenFilter,
    streamFilter,
    tokenMax,
    tokenMin,
    triage,
  ]);

  const canPaginateForward = offset + limit < total;
  const currentPage = total > 0 ? Math.floor(offset / limit) + 1 : 1;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const rangeStart = total > 0 ? offset + 1 : 0;
  const rangeEnd = total > 0 ? Math.min(offset + logs.length, total) : 0;

  const allColumnsMode = view === "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setTriage("none");
    setLatencyBucket("all");
    setTokenMin(null);
    setTokenMax(null);
    setTokenMinInput("");
    setTokenMaxInput("");
    setShowPricedOnly(false);
    setShowBillableOnly(false);
    setOutcomeFilter("all");
    setStreamFilter("all");
    setSpecialTokenFilter("all");
    setModelId("__all__");
    setProviderType("all");
    setConnectionId("__all__");
    setEndpointId("__all__");
    setTimeRange("24h");
    setView("overview");
    setOffset(0);
  };

  const renderCell = (column: ColumnId, log: RequestLogEntry) => {
    const endpointLogId = log.connection_id;
    const reportCurrencySymbol = log.report_currency_symbol || "$";
    const reportCurrencyCode = log.report_currency_code || undefined;
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
              allColumnsMode && "sticky left-0 z-20 bg-card shadow-[1px_0_0_0_var(--border)]"
            )}
          >
            {formatTime(log.created_at, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            })}
          </TableCell>
        );
      case "model":
        return (
          <TableCell
            className={cn(
              "py-2 max-w-[180px] w-[180px] min-w-[180px] truncate font-medium",
              allColumnsMode && "sticky left-[170px] z-20 bg-card shadow-[1px_0_0_0_var(--border)]"
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
              allColumnsMode && "sticky left-[350px] z-20 bg-card shadow-[1px_0_0_0_var(--border)]"
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
          <TableCell className={cn("py-2 max-w-[240px] w-[240px] min-w-[240px] truncate", allColumnsMode && "sticky left-[480px] z-20 bg-card shadow-[1px_0_0_0_var(--border)]")}>
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
    <TooltipProvider>
      <div className="h-full flex flex-col gap-4">
        <PageHeader
          title="Request Logs"
          description="Focused telemetry views for performance, tokens, billing, cache behavior, and error triage"
        />

        <div className="sticky top-4 z-20">
          <div className="rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90 space-y-3">
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
              <Tabs value={view} onValueChange={(next) => setView(next as ViewType)} className="w-full">
                <TabsList className="w-full justify-start sm:w-auto">
                  {VIEW_OPTIONS.map((option) => (
                    <TabsTrigger key={option.value} value={option.value} className="gap-2 px-3">
                      <option.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{option.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Triage:
              </span>
              {TRIAGE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={triage === option.value ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 gap-1.5 rounded-full border-dashed text-xs whitespace-nowrap",
                    triage === option.value && "border-solid"
                  )}
                  onClick={() => {
                    setTriage(triage === option.value ? "none" : option.value);
                    setOffset(0);
                  }}
                >
                  <option.icon className="h-3 w-3" />
                  {option.label}
                  {triage === option.value ? <X className="h-3 w-3" /> : null}
                </Button>
              ))}
            </div>

            <div className="grid gap-2 md:grid-cols-12">
              <div className="relative md:col-span-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setOffset(0);
                  }}
                  placeholder="Search request id, model, endpoint, status, or error..."
                  className="h-9 pl-9 text-xs"
                />
              </div>

              <div className="md:col-span-4 flex flex-wrap gap-1 rounded-md bg-muted/50 p-1">
                {REQUEST_TIME_RANGES.map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("h-7 px-3 text-xs", timeRange === range && "bg-background shadow-sm")}
                    onClick={() => {
                      setTimeRange(range);
                      setOffset(0);
                    }}
                  >
                    {range === "all" ? "All Time" : range}
                  </Button>
                ))}
              </div>

              <div className="md:col-span-4 flex items-center justify-end gap-2">
                <Button
                  variant={showPricedOnly ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => {
                    setShowPricedOnly((prev) => !prev);
                    setOffset(0);
                  }}
                >
                  <Coins className="h-3.5 w-3.5" />
                  Priced only
                </Button>
                <Button
                  variant={showBillableOnly ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => {
                    setShowBillableOnly((prev) => !prev);
                    setOffset(0);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Billable only
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={modelId}
                onValueChange={(next) => {
                  setModelId(next);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[180px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
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
                onValueChange={(next) => {
                  setProviderType(next);
                  setOffset(0);
                }}
                className="h-8 w-full text-xs sm:w-[150px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate"
              />

              <Select
                value={connectionId}
                onValueChange={(next) => {
                  setConnectionId(next);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[180px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
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
                value={endpointId}
                onValueChange={(next) => {
                  setEndpointId(next);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[180px] [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate">
                  <SelectValue placeholder="Endpoint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Endpoints</SelectItem>
                  {endpoints.map((endpoint) => (
                    <SelectItem key={endpoint.id} value={String(endpoint.id)}>
                      {endpoint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={outcomeFilter}
                onValueChange={(next) => {
                  setOutcomeFilter(next as OutcomeFilter);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[130px] [&_[data-slot=select-value]]:truncate">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={streamFilter}
                onValueChange={(next) => {
                  setStreamFilter(next as StreamFilter);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[150px] [&_[data-slot=select-value]]:truncate">
                  <SelectValue placeholder="Stream" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stream Types</SelectItem>
                  <SelectItem value="stream">Streaming</SelectItem>
                  <SelectItem value="non_stream">Non-streaming</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={latencyBucket}
                onValueChange={(next) => {
                  setLatencyBucket(next as LatencyBucket);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[140px] [&_[data-slot=select-value]]:truncate">
                  <SelectValue placeholder="Latency" />
                </SelectTrigger>
                <SelectContent>
                  {LATENCY_BUCKETS.map((bucket) => (
                    <SelectItem key={bucket.value} value={bucket.value}>
                      {bucket.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={specialTokenFilter}
                onValueChange={(next) => {
                  setSpecialTokenFilter(next as SpecialTokenFilter);
                  setOffset(0);
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[190px] [&_[data-slot=select-value]]:truncate">
                  <SelectValue placeholder="Special Tokens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All token rows</SelectItem>
                  <SelectItem value="has_cached">Has cached tokens</SelectItem>
                  <SelectItem value="has_reasoning">Has reasoning tokens</SelectItem>
                  <SelectItem value="has_any_special">Has any special token</SelectItem>
                  <SelectItem value="missing_special">Missing special tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Token min</span>
                <Input
                  value={tokenMinInput}
                  onChange={(event) => setTokenMinInput(event.target.value)}
                  onBlur={() => {
                    setTokenMin(parseTokenInputValue(tokenMinInput));
                    setTokenMinInput((prev) => {
                      const parsed = parseTokenInputValue(prev);
                      return parsed === null ? "" : String(parsed);
                    });
                    setOffset(0);
                  }}
                  placeholder="optional"
                  inputMode="numeric"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Token max</span>
                <Input
                  value={tokenMaxInput}
                  onChange={(event) => setTokenMaxInput(event.target.value)}
                  onBlur={() => {
                    setTokenMax(parseTokenInputValue(tokenMaxInput));
                    setTokenMaxInput((prev) => {
                      const parsed = parseTokenInputValue(prev);
                      return parsed === null ? "" : String(parsed);
                    });
                    setOffset(0);
                  }}
                  placeholder="optional"
                  inputMode="numeric"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-start sm:justify-end">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-card overflow-hidden relative flex-1 min-h-[420px] flex flex-col">
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Activity className="h-8 w-8 animate-pulse text-primary/50" />
                  Loading request logs...
                </div>
              </div>
            ) : filteredAndSortedRows.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={<Search className="h-8 w-8" />}
                  title="No logs match your filters"
                  description="Try adjusting search or filters to widen this view."
                  action={
                    <Button variant="outline" onClick={clearAllFilters}>
                      Reset Filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <Table className={allColumnsMode ? "min-w-[2100px]" : "w-full"}>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
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
                            ? "sticky left-0 z-20 bg-card w-[170px] min-w-[170px]"
                            : "",
                          allColumnsMode && column === "model"
                            ? "sticky left-[170px] z-20 bg-card w-[180px] min-w-[180px]"
                            : "",
                          allColumnsMode && column === "provider"
                            ? "sticky left-[350px] z-20 bg-card w-[130px] min-w-[130px]"
                            : "",
                          allColumnsMode && column === "endpoint"
                            ? "sticky left-[480px] z-20 bg-card w-[240px] min-w-[240px]"
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
                  {filteredAndSortedRows.map((log) => (
                    <TableRow
                      key={log.id}
                      className="text-xs cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLog(log)}
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
                  <SelectTrigger className="h-7 w-16 text-xs">
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

        <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <SheetContent className="sm:max-w-xl overflow-y-auto p-0 gap-0">
            {selectedLog ? (
              <>
                <SheetHeader className="p-6 border-b bg-muted/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      #{selectedLog.id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(selectedLog.created_at, {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <SheetTitle className="text-lg font-mono">{selectedLog.model_id}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2">
                      <ProviderIcon providerType={selectedLog.provider_type} size={14} />
                      <span className="capitalize">{selectedLog.provider_type}</span>
                      <span>•</span>
                      <span>{selectedLog.endpoint_description || "Unknown endpoint"}</span>
                    </SheetDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ValueBadge
                      label={String(selectedLog.status_code)}
                      intent={
                        selectedLog.status_code < 300
                          ? "success"
                          : selectedLog.status_code < 500
                            ? "warning"
                            : "danger"
                      }
                    />
                    <Badge variant="secondary" className="gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      {formatLatency(selectedLog.response_time_ms)}
                    </Badge>
                    <Badge variant="secondary" className="gap-1 font-mono">
                      <Coins className="h-3.5 w-3.5" />
                      {formatMoneyMicros(
                        selectedLog.total_cost_user_currency_micros,
                        selectedLog.report_currency_symbol || "$",
                        selectedLog.report_currency_code || undefined,
                        2,
                        6
                      )}
                    </Badge>
                    {selectedLog.is_stream ? <TypeBadge label="Stream" /> : null}
                  </div>
                </SheetHeader>

                <div className="p-6 space-y-6">
                  {selectedLog.status_code >= 400 ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
                      <h4 className="mb-2 text-sm font-medium text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Status & Error Payload
                      </h4>
                      <pre className="whitespace-pre-wrap text-xs font-mono text-destructive/90">
                        {selectedLog.error_detail || "No error payload provided"}
                      </pre>
                    </div>
                  ) : null}

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Timeline</h4>
                    <div className="rounded-md border bg-muted/20 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Request received</span>
                        <span className="font-mono">{formatTime(selectedLog.created_at, { timeStyle: "medium" })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Response completed</span>
                        <span className="font-mono">+ {selectedLog.response_time_ms.toFixed(0)}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Outcome</span>
                        <span className="font-mono">HTTP {selectedLog.status_code}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Token Breakdown</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Input Tokens</p>
                        <p className="mt-1 font-mono">{formatTokenCount(selectedLog.input_tokens)}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Output Tokens</p>
                        <p className="mt-1 font-mono">{formatTokenCount(selectedLog.output_tokens)}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Cached Tokens</p>
                        <p className="mt-1 font-mono">{formatTokenCount(selectedLog.cache_read_input_tokens)}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Cache Create Tokens</p>
                        <p className="mt-1 font-mono">{formatTokenCount(selectedLog.cache_creation_input_tokens)}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Reasoning Tokens</p>
                        <p className="mt-1 font-mono">{formatTokenCount(selectedLog.reasoning_tokens)}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Total Tokens</p>
                        <p className="mt-1 font-mono font-semibold">{formatTokenCount(selectedLog.total_tokens)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Cost Breakdown</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Input Cost</p>
                        <p className="mt-1 font-mono">
                          {formatMoneyMicros(selectedLog.input_cost_micros, selectedLog.report_currency_symbol || "$")}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Output Cost</p>
                        <p className="mt-1 font-mono">
                          {formatMoneyMicros(selectedLog.output_cost_micros, selectedLog.report_currency_symbol || "$")}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Cached Cost</p>
                        <p className="mt-1 font-mono">
                          {formatMoneyMicros(
                            selectedLog.cache_read_input_cost_micros,
                            selectedLog.report_currency_symbol || "$"
                          )}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Cache Create Cost</p>
                        <p className="mt-1 font-mono">
                          {formatMoneyMicros(
                            selectedLog.cache_creation_input_cost_micros,
                            selectedLog.report_currency_symbol || "$"
                          )}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Reasoning Cost</p>
                        <p className="mt-1 font-mono">
                          {formatMoneyMicros(selectedLog.reasoning_cost_micros, selectedLog.report_currency_symbol || "$")}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="mt-1 font-mono font-semibold">
                          {formatMoneyMicros(
                            selectedLog.total_cost_user_currency_micros,
                            selectedLog.report_currency_symbol || "$",
                            selectedLog.report_currency_code || undefined,
                            2,
                            6
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium">Metadata</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Connection ID</p>
                        <p className="mt-1 font-mono">{selectedLog.connection_id ?? "-"}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Endpoint ID</p>
                        <p className="mt-1 font-mono">{selectedLog.endpoint_id ?? "-"}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Request Path</p>
                        <p className="mt-1 font-mono truncate" title={selectedLog.request_path}>
                          {selectedLog.request_path}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-muted-foreground">Pricing Config</p>
                        <p className="mt-1 font-mono">v{selectedLog.pricing_config_version_used ?? "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setModelId(selectedLog.model_id);
                        setProviderType(selectedLog.provider_type);
                        if (selectedLog.connection_id) {
                          setConnectionId(String(selectedLog.connection_id));
                        }
                        setOffset(0);
                        setSelectedLog(null);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Find similar (same model/endpoint)
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        if (selectedLog.connection_id) {
                          setConnectionId(String(selectedLog.connection_id));
                          setOffset(0);
                          setSelectedLog(null);
                        }
                      }}
                      disabled={!selectedLog.connection_id}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Show only this connection
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        if (selectedLog.connection_id) {
                          navigateToConnection(selectedLog.connection_id);
                        }
                      }}
                      disabled={!selectedLog.connection_id}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open connection details
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(selectedLog, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `request-log-${selectedLog.id}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
