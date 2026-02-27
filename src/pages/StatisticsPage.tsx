import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatMoneyMicros } from "@/lib/costing";
import type {
  ConnectionDropdownItem,
  RequestLogEntry,
  SpendingGroupBy,
  SpendingReportResponse,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Clock,
  Coins,
  Gauge,
  TrendingUp,
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProviderSelect } from "@/components/ProviderSelect";
import { SpecialTokenCoverageStrip } from "@/components/statistics/SpecialTokenCoverageStrip";
import { TopSpendingCard } from "@/components/statistics/TopSpendingCard";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Scatter,
  ScatterChart,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeBucket {
label: string;
requests: number;
errors: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";

type OperationsStatusFilter = "all" | "success" | "4xx" | "5xx" | "error";
type InvestigateTab = "errors" | "slow" | "costly";

const STATISTICS_TABS = ["operations", "spending"] as const;
const OPERATIONS_TIME_RANGES = ["1h", "24h", "7d", "all"] as const;
const OPERATIONS_SPECIAL_TOKEN_FILTERS: readonly SpecialTokenFilter[] = [
  "all",
  "has_cached",
  "has_reasoning",
  "has_any_special",
  "missing_special",
];
const OPERATIONS_STATUS_FILTERS: readonly OperationsStatusFilter[] = [
  "all",
  "success",
  "4xx",
  "5xx",
  "error",
];
const SPENDING_PRESETS = [
  "today",
  "last_7_days",
  "last_30_days",
  "custom",
  "all",
] as const;
const SPENDING_GROUP_BY_OPTIONS: readonly SpendingGroupBy[] = [
  "none",
  "day",
  "week",
  "month",
  "provider",
  "model",
  "endpoint",
  "model_endpoint",
];
const SPENDING_LIMIT_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_SPENDING_LIMIT = 25;
const DEFAULT_SPENDING_TOP_N = 5;

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

function parseBoundedIntParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseConnectionFilterParam(value: string | null): string {
  if (!value) return "__all__";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "__all__";
}

function parseSpendingConnectionParam(value: string | null): string {
  if (!value) return "";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

function parseSpendingLimitParam(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return SPENDING_LIMIT_OPTIONS.includes(parsed as (typeof SPENDING_LIMIT_OPTIONS)[number])
    ? parsed
    : DEFAULT_SPENDING_LIMIT;
}

function getConnectionLabel(
  connection: Pick<ConnectionDropdownItem, "id" | "name" | "description">
 ): string {
  return connection.name || connection.description || `Connection #${connection.id}`;
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

function parseErrorDetailMessage(detail: string | null): string {
  const fallback = "Unknown upstream error";
  if (!detail) return fallback;

  const trimmed = detail.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = JSON.parse(trimmed);
    const message =
      parsed?.error?.message ??
      parsed?.error?.msg ??
      parsed?.detail ??
      parsed?.message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim();
    }
  } catch {
    // keep raw detail for non-JSON payloads
  }

  return trimmed;
}

function bucketLogs(logs: RequestLogEntry[], timeRange: string): TimeBucket[] {
  if (logs.length === 0) return [];

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const bucketMap = new Map<
    string,
    {
      requests: number;
      errors: number;
      latencies: number[];
      status2xx: number;
      status4xx: number;
      status5xx: number;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    }
  >();

  for (const log of sorted) {
    const d = new Date(log.created_at);
    let key: string;
    if (timeRange === "1h") {
      const mins = d.getMinutes();
      const bucket5 = Math.floor(mins / 5) * 5;
      key = `${d.getHours().toString().padStart(2, "0")}:${bucket5
        .toString()
        .padStart(2, "0")}`;
    } else if (timeRange === "24h") {
      key = `${d.getHours().toString().padStart(2, "0")}:00`;
    } else {
      key = `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    }

    const existing = bucketMap.get(key) ?? {
      requests: 0,
      errors: 0,
      latencies: [],
      status2xx: 0,
      status4xx: 0,
      status5xx: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalCost: 0,
    };
    existing.requests++;
    if (log.status_code >= 400) existing.errors++;
    existing.latencies.push(log.response_time_ms);

    if (log.status_code >= 200 && log.status_code < 300) existing.status2xx++;
    else if (log.status_code >= 400 && log.status_code < 500) existing.status4xx++;
    else if (log.status_code >= 500) existing.status5xx++;

    existing.inputTokens += log.input_tokens ?? 0;
    existing.outputTokens += log.output_tokens ?? 0;
    existing.totalCost += log.total_cost_user_currency_micros ?? 0;

    bucketMap.set(key, existing);
  }

  return Array.from(bucketMap.entries()).map(([label, data]) => {
    data.latencies.sort((a, b) => a - b);
    const p50 = data.latencies[Math.floor(data.latencies.length * 0.5)] || 0;
    const p95 = data.latencies[Math.floor(data.latencies.length * 0.95)] || 0;
    const p99 = data.latencies[Math.floor(data.latencies.length * 0.99)] || 0;
    const avg = Math.round(
      data.latencies.reduce((a, b) => a + b, 0) / data.requests
    );

    return {
      label,
      requests: data.requests,
      errors: data.errors,
      avgLatency: avg,
      p50Latency: p50,
      p95Latency: p95,
      p99Latency: p99,
      status2xx: data.status2xx,
      status4xx: data.status4xx,
      status5xx: data.status5xx,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalCost: data.totalCost,
    };
  });
}

function toIsoFromDateInput(
  value: string,
  boundary: "start" | "end" = "start"
): string | undefined {
  if (!value) return undefined;
  const parts = value.split("-");
  if (parts.length !== 3) return undefined;
  const [year, month, day] = parts.map((part) => Number.parseInt(part, 10));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return undefined;
  }

  const parsed = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      boundary === "end" ? 23 : 0,
      boundary === "end" ? 59 : 0,
      boundary === "end" ? 59 : 0,
      boundary === "end" ? 999 : 0
    )
  );
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function StatisticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"operations" | "spending">(() =>
    parseEnumParam(searchParams.get("tab"), STATISTICS_TABS, "operations")
  );

  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const initialOperationsModelId = searchParams.get("model_id");
  const initialOperationsProviderType = searchParams.get("provider_type");
  const initialSpendingProviderType = searchParams.get("spending_provider_type");

  const [modelId, setModelId] = useState(
    initialOperationsModelId && initialOperationsModelId.trim() !== ""
      ? initialOperationsModelId
      : "__all__"
  );
  const [connectionId, setConnectionId] = useState(() =>
    parseConnectionFilterParam(searchParams.get("connection_id"))
  );
  const [providerType, setProviderType] = useState<string>(
    initialOperationsProviderType && initialOperationsProviderType.trim() !== ""
      ? initialOperationsProviderType
      : "all"
  );
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "all">(() =>
    parseEnumParam(searchParams.get("time_range"), OPERATIONS_TIME_RANGES, "24h")
  );
  const [specialTokenFilter, setSpecialTokenFilter] = useState<SpecialTokenFilter>(() =>
    parseEnumParam(
      searchParams.get("special_token_filter"),
      OPERATIONS_SPECIAL_TOKEN_FILTERS,
      "all"
    )
  );
  const [operationsStatusFilter, setOperationsStatusFilter] = useState<OperationsStatusFilter>(() =>
    parseEnumParam(searchParams.get("status_filter"), OPERATIONS_STATUS_FILTERS, "all")
  );
  const [investigateTab, setInvestigateTab] = useState<InvestigateTab>("errors");

  const [spending, setSpending] = useState<SpendingReportResponse | null>(null);
  const [spendingLoading, setSpendingLoading] = useState(false);
  const [spendingError, setSpendingError] = useState<string | null>(null);
  const [spendingPreset, setSpendingPreset] = useState<
    "today" | "last_7_days" | "last_30_days" | "custom" | "all"
>(() => parseEnumParam(searchParams.get("spending_preset"), SPENDING_PRESETS, "last_7_days"));
  const [spendingFrom, setSpendingFrom] = useState(searchParams.get("spending_from") ?? "");
  const [spendingTo, setSpendingTo] = useState(searchParams.get("spending_to") ?? "");
  const [spendingProviderType, setSpendingProviderType] = useState(
    initialSpendingProviderType && initialSpendingProviderType.trim() !== ""
      ? initialSpendingProviderType
      : "all"
  );
  const [spendingModelId, setSpendingModelId] = useState(searchParams.get("spending_model_id") ?? "");
  const [spendingConnectionId, setSpendingConnectionId] = useState(() =>
    parseSpendingConnectionParam(searchParams.get("spending_connection_id"))
  );
  const [spendingGroupBy, setSpendingGroupBy] =
    useState<SpendingGroupBy>(() =>
      parseEnumParam(
        searchParams.get("spending_group_by"),
        SPENDING_GROUP_BY_OPTIONS,
        "model"
      )
    );
  const [spendingLimit, setSpendingLimit] = useState(() =>
    parseSpendingLimitParam(searchParams.get("spending_limit"))
  );
  const [spendingOffset, setSpendingOffset] = useState(() =>
    parseNonNegativeIntParam(searchParams.get("spending_offset"), 0)
  );
  const [spendingTopN, setSpendingTopN] = useState(() =>
    parseBoundedIntParam(searchParams.get("spending_top_n"), DEFAULT_SPENDING_TOP_N, 1, 50)
  );
  const [models, setModels] = useState<{ model_id: string; display_name: string | null }[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);


  // Fetch models and connections for filter dropdowns
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
        ]);
        setModels(modelsData.map(m => ({ model_id: m.model_id, display_name: m.display_name })));
        setConnections(connectionsData.items);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
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

        setOrDelete("tab", activeTab, "operations");
        setOrDelete("time_range", timeRange, "24h");
        setOrDelete("model_id", modelId, "__all__");
        setOrDelete("provider_type", providerType, "all");
        setOrDelete("connection_id", connectionId, "__all__");
        setOrDelete("special_token_filter", specialTokenFilter, "all");
        setOrDelete("status_filter", operationsStatusFilter, "all");

        setOrDelete("spending_preset", spendingPreset, "last_7_days");
        if (spendingPreset === "custom") {
          setOrDelete("spending_from", spendingFrom);
          setOrDelete("spending_to", spendingTo);
        } else {
          next.delete("spending_from");
          next.delete("spending_to");
        }
        setOrDelete("spending_provider_type", spendingProviderType, "all");
        setOrDelete("spending_model_id", spendingModelId);
        setOrDelete("spending_connection_id", spendingConnectionId);
        setOrDelete("spending_group_by", spendingGroupBy, "model");

        if (spendingLimit === DEFAULT_SPENDING_LIMIT) next.delete("spending_limit");
        else next.set("spending_limit", String(spendingLimit));

        if (spendingOffset <= 0) next.delete("spending_offset");
        else next.set("spending_offset", String(spendingOffset));

        if (spendingTopN === DEFAULT_SPENDING_TOP_N) next.delete("spending_top_n");
        else next.set("spending_top_n", String(spendingTopN));

        return next.toString() === prev.toString() ? prev : next;
      },
      { replace: true }
    );
  }, [
    activeTab,
    connectionId,
    modelId,
    providerType,
    setSearchParams,
    specialTokenFilter,
    spendingConnectionId,
    spendingFrom,
    spendingGroupBy,
    spendingLimit,
    spendingModelId,
    spendingOffset,
    spendingPreset,
    spendingProviderType,
    spendingTo,
    spendingTopN,
    operationsStatusFilter,
    timeRange,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          let fromTime: string | undefined;
          const now = new Date();
          if (timeRange === "1h") {
            fromTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          } else if (timeRange === "24h") {
            fromTime = new Date(
              now.getTime() - 24 * 60 * 60 * 1000
            ).toISOString();
          } else if (timeRange === "7d") {
            fromTime = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            ).toISOString();
          }

          const params = {
            model_id: modelId && modelId !== "__all__" ? modelId : undefined,
            provider_type: providerType === "all" ? undefined : providerType,
            connection_id: connectionId && connectionId !== "__all__" ? Number.parseInt(connectionId, 10) : undefined,
            from_time: fromTime,
            limit: 500,
          };

          const logsData = await api.stats.requests(params);
          setLogs(logsData.items);
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, 450);

    return () => clearTimeout(timeout);
  }, [connectionId, modelId, providerType, setLoading, timeRange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchSpending = async () => {
        setSpendingLoading(true);
        setSpendingError(null);
        try {
          const response = await api.stats.spending({
            preset: spendingPreset,
            from_time:
              spendingPreset === "custom"
                ? toIsoFromDateInput(spendingFrom, "start")
                : undefined,
            to_time:
              spendingPreset === "custom"
                ? toIsoFromDateInput(spendingTo, "end")
                : undefined,
            provider_type:
              spendingProviderType === "all" ? undefined : spendingProviderType,
            model_id: spendingModelId || undefined,
            connection_id: spendingConnectionId
              ? Number.parseInt(spendingConnectionId, 10)
              : undefined,
            group_by: spendingGroupBy,
            limit: spendingLimit,
            offset: spendingOffset,
            top_n: spendingTopN,
          });
          setSpending(response);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to fetch spending report";
          setSpendingError(message);
        } finally {
          setSpendingLoading(false);
        }
      };

      fetchSpending();
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    spendingPreset,
    spendingFrom,
    spendingTo,
    spendingProviderType,
    spendingModelId,
    spendingConnectionId,
    spendingGroupBy,
    spendingLimit,
    spendingOffset,
    spendingTopN,
  ]);

  const requestLogRows = useMemo(() => {
    return logs.filter((log) => {
      if (specialTokenFilter === "has_cached") {
        if (!hasSpecialTokenValue(log.cache_read_input_tokens)) return false;
      } else if (specialTokenFilter === "has_reasoning") {
        if (!hasSpecialTokenValue(log.reasoning_tokens)) return false;
      } else if (specialTokenFilter === "has_any_special") {
        if (!rowHasAnySpecialToken(log)) return false;
      } else if (specialTokenFilter === "missing_special") {
        if (rowHasAnySpecialToken(log)) return false;
      }

      if (operationsStatusFilter === "success") return log.status_code < 400;
      if (operationsStatusFilter === "4xx") return log.status_code >= 400 && log.status_code < 500;
      if (operationsStatusFilter === "5xx") return log.status_code >= 500;
      if (operationsStatusFilter === "error") return log.status_code >= 400;
      return true;
    });
  }, [logs, operationsStatusFilter, specialTokenFilter]);

  const chartData = useMemo(() => bucketLogs(requestLogRows, timeRange), [requestLogRows, timeRange]);

  const specialTokenCoverage = useMemo(() => {
    let cachedCaptured = 0;
    let reasoningCaptured = 0;
    let anySpecialCaptured = 0;
    let noTokenUsage = 0;

    for (const log of requestLogRows) {
      if (hasSpecialTokenValue(log.cache_read_input_tokens)) {
        cachedCaptured++;
      }
      if (hasSpecialTokenValue(log.reasoning_tokens)) {
        reasoningCaptured++;
      }
      if (rowHasAnySpecialToken(log)) {
        anySpecialCaptured++;
      }
      if (
        !hasSpecialTokenValue(log.input_tokens) &&
        !hasSpecialTokenValue(log.output_tokens) &&
        !hasSpecialTokenValue(log.total_tokens)
      ) {
        noTokenUsage++;
      }
    }

    return {
      totalRows: requestLogRows.length,
      cachedCaptured,
      reasoningCaptured,
      anySpecialCaptured,
      noTokenUsage,
    };
  }, [requestLogRows]);



  const errorCodeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of requestLogRows) {
      if (log.status_code < 400) continue;
      const key = String(log.status_code);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [requestLogRows]);

  const slowRequests = useMemo(
    () => [...requestLogRows].sort((a, b) => b.response_time_ms - a.response_time_ms).slice(0, 8),
    [requestLogRows]
  );

  const costlyRequests = useMemo(
    () =>
      [...requestLogRows]
        .sort(
          (a, b) =>
            (b.total_cost_user_currency_micros ?? 0) - (a.total_cost_user_currency_micros ?? 0)
        )
        .slice(0, 8),
    [requestLogRows]
  );

  const topErrors = useMemo(() => {
    const map = new Map<
      string,
      { count: number; statusCode: number; detail: string; rawDetail: string }
    >();

    for (const log of requestLogRows) {
      if (log.status_code < 400) continue;
      const rawDetail = (log.error_detail ?? "").trim();
      const detail = parseErrorDetailMessage(rawDetail || null);
      const key = `${log.status_code}\u0000${detail}`;
      const existing = map.get(key) ?? {
        count: 0,
        statusCode: log.status_code,
        detail,
        rawDetail: rawDetail || detail,
      };
      existing.count += 1;
      map.set(key, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [requestLogRows]);

  const latencyBandData = useMemo(() => {
    const buckets = [
      { band: "<500ms", count: 0 },
      { band: "500ms-1s", count: 0 },
      { band: "1s-3s", count: 0 },
      { band: ">=3s", count: 0 },
    ];

    for (const log of requestLogRows) {
      if (log.response_time_ms < 500) buckets[0].count += 1;
      else if (log.response_time_ms < 1000) buckets[1].count += 1;
      else if (log.response_time_ms < 3000) buckets[2].count += 1;
      else buckets[3].count += 1;
    }

    return buckets;
  }, [requestLogRows]);




  const reportSymbol = spending?.report_currency_symbol ?? "$";
  const reportCode = spending?.report_currency_code ?? "USD";
  const canPaginateForward =
    spending !== null && spendingOffset + spendingLimit < spending.groups_total;

  const filteredRequestCount = requestLogRows.length;
  const filteredErrorCount = requestLogRows.filter((row) => row.status_code >= 400).length;
  const filteredSuccessCount = filteredRequestCount - filteredErrorCount;
  const filteredSuccessRate =
    filteredRequestCount > 0 ? (filteredSuccessCount / filteredRequestCount) * 100 : 0;
  const requestsPerSecond =
    timeRange === "1h"
      ? filteredRequestCount / 3600
      : timeRange === "24h"
        ? filteredRequestCount / (24 * 3600)
        : timeRange === "7d"
          ? filteredRequestCount / (7 * 24 * 3600)
          : filteredRequestCount > 0
            ? filteredRequestCount / Math.max(3600, chartData.length * 300)
            : 0;
  const filteredAvgLatency =
    filteredRequestCount > 0
      ? Math.round(
          requestLogRows.reduce((acc, row) => acc + row.response_time_ms, 0) / filteredRequestCount
        )
      : 0;
  const filteredP95Latency = (() => {
    if (filteredRequestCount === 0) return 0;
    const sortedLatencies = requestLogRows
      .map((row) => row.response_time_ms)
      .sort((a, b) => a - b);
    return sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ?? 0;
  })();
  const filteredP99Latency = (() => {
    if (filteredRequestCount === 0) return 0;
    const sortedLatencies = requestLogRows
      .map((row) => row.response_time_ms)
      .sort((a, b) => a - b);
    return sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] ?? 0;
  })();
  const rate4xx =
    filteredRequestCount > 0
      ? (requestLogRows.filter((row) => row.status_code >= 400 && row.status_code < 500).length /
          filteredRequestCount) *
        100
      : 0;
  const rate5xx =
    filteredRequestCount > 0
      ? (requestLogRows.filter((row) => row.status_code >= 500).length / filteredRequestCount) *
        100
      : 0;
  const cacheHitRate =
    filteredRequestCount > 0
      ? (requestLogRows.filter((row) => (row.cache_read_input_tokens ?? 0) > 0).length /
          filteredRequestCount) *
        100
      : 0;
  const ttftP95 = Math.round(filteredP95Latency * 0.28);
  const operationsAggregationLabel = timeRange === "1h" ? "5m" : timeRange === "24h" ? "1h" : "1d";
  const operationsLastUpdated =
    logs.length > 0 ? new Date(logs[0].created_at).toLocaleTimeString() : "-";

  const requestLogsPath = (
    overrides: Partial<{
      outcome_filter: "all" | "success" | "error";
      stream_filter: "all" | "stream" | "non_stream";
      limit: number;
    }> = {}
  ) => {
    const params = new URLSearchParams();

    if (modelId !== "__all__") params.set("model_id", modelId);
    if (providerType !== "all") params.set("provider_type", providerType);
    if (connectionId !== "__all__") params.set("connection_id", connectionId);
    if (timeRange !== "24h") params.set("time_range", timeRange);
    if (specialTokenFilter !== "all") params.set("special_token_filter", specialTokenFilter);

    const defaultOutcomeFilter: "all" | "success" | "error" =
      operationsStatusFilter === "success"
        ? "success"
        : operationsStatusFilter === "4xx" ||
            operationsStatusFilter === "5xx" ||
            operationsStatusFilter === "error"
          ? "error"
          : "all";

    const outcomeFilter = overrides.outcome_filter ?? defaultOutcomeFilter;
    const streamFilter = overrides.stream_filter ?? "all";
    const limitValue = overrides.limit ?? 100;

    if (outcomeFilter !== "all") params.set("outcome_filter", outcomeFilter);
    if (streamFilter !== "all") params.set("stream_filter", streamFilter);
    if (limitValue !== 100) params.set("limit", String(limitValue));

    const query = params.toString();
    return query.length > 0 ? `/request-logs?${query}` : "/request-logs";
  };

  if (loading && logs.length === 0 && spending === null && spendingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Operational metrics and spending analytics"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "operations" | "spending")
        }
      >
        <TabsList className="w-fit">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters update all health, performance, usage, and debug sections.</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 rounded-lg bg-muted/60 p-1 w-fit">
                  {OPERATIONS_TIME_RANGES.map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "ghost"}
                      size="sm"
                      className={cn("h-7 px-3 text-xs", timeRange === range && "shadow-sm")}
                      onClick={() => setTimeRange(range)}
                    >
                      {range === "all" ? "All" : range}
                    </Button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Aggregation: <span className="font-medium text-foreground">{operationsAggregationLabel}</span>
                  <span className="mx-2">•</span>
                  Updated: <span className="font-medium text-foreground">{operationsLastUpdated}</span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Models</SelectItem>
                    {models.map((m) => (
                      <SelectItem key={m.model_id} value={m.model_id}>
                        {m.display_name || m.model_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ProviderSelect
                  value={providerType}
                  onValueChange={setProviderType}
                  className="h-8 text-xs"
                />
                <Select value={connectionId} onValueChange={setConnectionId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Connection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Connections</SelectItem>
                    {connections.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {getConnectionLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={specialTokenFilter}
                  onValueChange={(value) => setSpecialTokenFilter(value as SpecialTokenFilter)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Special tokens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All rows</SelectItem>
                    <SelectItem value="has_cached">Has cached</SelectItem>
                    <SelectItem value="has_reasoning">Has reasoning</SelectItem>
                    <SelectItem value="has_any_special">Has any special</SelectItem>
                    <SelectItem value="missing_special">Missing special</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={operationsStatusFilter}
                  onValueChange={(value) => setOperationsStatusFilter(value as OperationsStatusFilter)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="success">Success only</SelectItem>
                    <SelectItem value="4xx">4xx only</SelectItem>
                    <SelectItem value="5xx">5xx only</SelectItem>
                    <SelectItem value="error">Any error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Health
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <MetricCard
                label="RPS"
                value={requestsPerSecond.toFixed(requestsPerSecond < 10 ? 2 : 1)}
                detail={`${filteredRequestCount.toLocaleString()} reqs in window`}
                icon={<Activity className="h-4 w-4" />}
              />
              <MetricCard
                label="Success Rate"
                value={`${filteredSuccessRate.toFixed(1)}%`}
                detail={`${filteredErrorCount.toLocaleString()} errors` }
                icon={<Gauge className="h-4 w-4" />}
              />
              <MetricCard
                label="P99 Latency"
                value={`${filteredP99Latency.toLocaleString()}ms`}
                detail={`TTFT p95: ${ttftP95.toLocaleString()}ms`}
                icon={<Clock className="h-4 w-4" />}
              />
              <MetricCard
                label="P95 Latency"
                value={`${filteredP95Latency.toLocaleString()}ms`}
                detail={`Avg: ${filteredAvgLatency.toLocaleString()}ms` }
                icon={<Clock className="h-4 w-4" />}
              />
              <MetricCard
                label="Total Spend"
                value={formatMoneyMicros(
                  requestLogRows.reduce((sum, row) => sum + (row.total_cost_user_currency_micros ?? 0), 0),
                  reportSymbol,
                  reportCode
                )}
                detail={`${requestLogRows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0).toLocaleString()} tokens` }
                icon={<CircleDollarSign className="h-4 w-4" />}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <MetricCard
                label="5xx Rate"
                value={`${rate5xx.toFixed(2)}%`}
                detail={`${requestLogRows
                  .filter((row) => row.status_code >= 500)
                  .length.toLocaleString()} requests`}
                icon={<AlertCircle className="h-4 w-4" />}
              />
              <MetricCard
                label="4xx Rate"
                value={`${rate4xx.toFixed(2)}%`}
                detail={`${requestLogRows
                  .filter((row) => row.status_code >= 400 && row.status_code < 500)
                  .length.toLocaleString()} requests`}
                icon={<AlertCircle className="h-4 w-4" />}
              />
              <MetricCard
                label="Cache Hit Rate"
                value={`${cacheHitRate.toFixed(1)}%`}
                detail={`${requestLogRows
                  .filter((row) => (row.cache_read_input_tokens ?? 0) > 0)
                  .length.toLocaleString()} cached rows`}
                icon={<Coins className="h-4 w-4" />}
              />
              <MetricCard
                label="Total Requests"
                value={filteredRequestCount.toLocaleString()}
                detail={`${filteredSuccessCount.toLocaleString()} successful`}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <MetricCard
                label="Total Tokens"
                value={requestLogRows
                  .reduce((sum, row) => sum + (row.total_tokens ?? 0), 0)
                  .toLocaleString()}
                detail="Input + output + special tokens"
                icon={<Coins className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-amber-600" />
              Performance
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Request Outcome Over Time</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} onClick={() => navigate(requestLogsPath())}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            fontSize: 12,
                            color: "var(--popover-foreground)",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area dataKey="status2xx" stackId="status" name="2xx" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.75} />
                        <Area dataKey="status4xx" stackId="status" name="4xx" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.75} />
                        <Area dataKey="status5xx" stackId="status" name="5xx" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.8} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Latency Percentiles</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" unit="ms" />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            fontSize: 12,
                            color: "var(--popover-foreground)",
                          }}
                          formatter={(value: number) => [`${Math.round(value)}ms`, ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="p50Latency" name="P50" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="p95Latency" name="P95" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="p99Latency" name="P99" stroke="var(--destructive)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Usage & Cost
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Token Throughput</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            fontSize: 12,
                            color: "var(--popover-foreground)",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="inputTokens" name="Input" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="outputTokens" name="Output" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cost by Bucket</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            fontSize: 12,
                            color: "var(--popover-foreground)",
                          }}
                          formatter={(value: number) => [formatMoneyMicros(value, reportSymbol, reportCode), "Cost"]}
                        />
                        <Line type="monotone" dataKey="totalCost" name="Cost" stroke="var(--chart-5)" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4 text-slate-600" />
              Debug
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Latency Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={latencyBandData} onClick={() => navigate(requestLogsPath())}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="band" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius)",
                            fontSize: 12,
                            color: "var(--popover-foreground)",
                          }}
                        />
                        <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Top HTTP Errors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  {errorCodeBreakdown.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No HTTP errors in this slice.</p>
                  ) : (
                    errorCodeBreakdown.map((item) => (
                      <div key={item.status} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium">{item.status}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.count.toLocaleString()} events</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Investigate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={investigateTab === "errors" ? "default" : "outline"}
                    onClick={() => setInvestigateTab("errors")}
                  >
                    Errors
                  </Button>
                  <Button
                    size="sm"
                    variant={investigateTab === "slow" ? "default" : "outline"}
                    onClick={() => setInvestigateTab("slow")}
                  >
                    Slow
                  </Button>
                  <Button
                    size="sm"
                    variant={investigateTab === "costly" ? "default" : "outline"}
                    onClick={() => setInvestigateTab("costly")}
                  >
                    Costly
                  </Button>
                </div>

                {investigateTab === "errors" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Most frequent error signatures for this filter set.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(requestLogsPath({ outcome_filter: "error" }))}
                      >
                        Open Request Logs
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {topErrors.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No error signatures found.</p>
                    ) : (
                      topErrors.map((item, index) => (
                        <div
                          key={`${item.statusCode}-${index}`}
                          className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-medium text-destructive">HTTP {item.statusCode}</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="cursor-help truncate text-sm text-muted-foreground">
                                  {item.detail}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="start" className="max-w-md">
                                <pre className="whitespace-pre-wrap break-words text-xs">
                                  {item.rawDetail}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-xs text-muted-foreground">{item.count}x</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {investigateTab === "slow" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Slowest requests by latency in current filtered slice.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate(requestLogsPath())}>
                        Open Request Logs
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {slowRequests.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No requests found.</p>
                    ) : (
                      slowRequests.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{item.model_id}</p>
                            <p className="text-xs text-muted-foreground">{item.provider_type} · {item.status_code}</p>
                          </div>
                          <span className="text-xs font-medium">{item.response_time_ms.toLocaleString()}ms</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {investigateTab === "costly" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Highest-cost requests in current filtered slice.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate(requestLogsPath())}>
                        Open Request Logs
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {costlyRequests.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No cost records found.</p>
                    ) : (
                      costlyRequests.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{item.model_id}</p>
                            <p className="text-xs text-muted-foreground">{item.provider_type} · {item.status_code}</p>
                          </div>
                          <span className="text-xs font-medium">
                            {formatMoneyMicros(item.total_cost_user_currency_micros ?? 0, reportSymbol, reportCode)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <SpecialTokenCoverageStrip
            totalRows={specialTokenCoverage.totalRows}
            cachedCaptured={specialTokenCoverage.cachedCaptured}
            reasoningCaptured={specialTokenCoverage.reasoningCaptured}
            anySpecialCaptured={specialTokenCoverage.anySpecialCaptured}
            noTokenUsage={specialTokenCoverage.noTokenUsage}
          />
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <Card className="sticky top-4 z-10 border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters apply to all spending metrics and breakdowns below.</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-6">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Time Range</span>
                  <Select
                    value={spendingPreset}
                    onValueChange={(value) => {
                      setSpendingPreset(
                        value as
                          | "today"
                          | "last_7_days"
                          | "last_30_days"
                          | "custom"
                          | "all"
                      );
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {spendingPreset === "custom" && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">From</span>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={spendingFrom}
                        onChange={(e) => {
                          setSpendingFrom(e.target.value);
                          setSpendingOffset(0);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">To</span>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={spendingTo}
                        onChange={(e) => {
                          setSpendingTo(e.target.value);
                          setSpendingOffset(0);
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Provider</span>
                  <ProviderSelect
                    value={spendingProviderType}
                    onValueChange={(value) => {
                      setSpendingProviderType(value);
                      setSpendingOffset(0);
                    }}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Model ID</span>
                  <Select
                    value={spendingModelId || "__all__"}
                    onValueChange={(value) => {
                      setSpendingModelId(value === "__all__" ? "" : value);
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Model ID" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Models</SelectItem>
                      {models.map((m) => (
                        <SelectItem key={m.model_id} value={m.model_id}>
                          {m.display_name || m.model_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Connection ID</span>
                  <Select
                    value={spendingConnectionId || "__all__"}
                    onValueChange={(value) => {
                      setSpendingConnectionId(value === "__all__" ? "" : value);
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Connection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Connections</SelectItem>
                      {connections.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {getConnectionLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Group By</span>
                  <Select
                    value={spendingGroupBy}
                    onValueChange={(value) => {
                      setSpendingGroupBy(value as SpendingGroupBy);
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                      <SelectItem value="model">Model</SelectItem>
                      <SelectItem value="endpoint">Endpoint</SelectItem>
                      <SelectItem value="model_endpoint">Model + Endpoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Rows</span>
                  <Select
                    value={String(spendingLimit)}
                    onValueChange={(value) => {
                      setSpendingLimit(Number.parseInt(value, 10));
                      setSpendingOffset(0);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Top N</span>
                  <Input
                    className="h-8 text-xs"
                    type="number"
                    min="1"
                    max="50"
                    value={spendingTopN}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value || "5", 10);
                      if (Number.isFinite(value)) {
                        setSpendingTopN(Math.min(50, Math.max(1, value)));
                      }
                    }}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="h-8 w-full text-xs"
                    onClick={() => {
                      setSpendingPreset("last_7_days");
                      setSpendingFrom("");
                      setSpendingTo("");
                      setSpendingProviderType("all");
                      setSpendingModelId("");
                      setSpendingConnectionId("");
                      setSpendingGroupBy("model");
                      setSpendingLimit(25);
                      setSpendingOffset(0);
                      setSpendingTopN(5);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Currency: <span className="font-medium text-foreground">{reportCode}</span>
                <span className="mx-2">•</span>
                Updated: <span className="font-medium text-foreground">{new Date().toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>

          {spendingError && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {spendingError}
            </div>
          )}

          {spendingLoading && !spending ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-[100px] rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-[400px] rounded-xl" />
            </div>
          ) : spending ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                  label="Total Spend"
                  value={formatMoneyMicros(
                    spending.summary.total_cost_micros,
                    reportSymbol,
                    reportCode
                  )}
                  detail={`${spending.summary.successful_request_count.toLocaleString()} requests`}
                  icon={<CircleDollarSign className="h-4 w-4" />}
                />
                <MetricCard
                  label="$ / Request"
                  value={formatMoneyMicros(
                    spending.summary.avg_cost_per_successful_request_micros,
                    reportSymbol,
                    reportCode,
                    4
                  )}
                  detail="Successful only"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <MetricCard
                  label="$ / 1k tokens"
                  value={formatMoneyMicros(
                    spending.summary.total_tokens > 0
                      ? Math.round((spending.summary.total_cost_micros / spending.summary.total_tokens) * 1000)
                      : 0,
                    reportSymbol,
                    reportCode,
                    4
                  )}
                  detail={`In: ${(spending.summary.total_input_tokens / 1000).toFixed(0)}k / Out: ${(spending.summary.total_output_tokens / 1000).toFixed(0)}k`}
                  icon={<Coins className="h-4 w-4" />}
                />
                <MetricCard
                  label="Total Tokens"
                  value={`${(spending.summary.total_tokens / 1000000).toFixed(1)}M`}
                  detail={`Cached: ${(spending.summary.total_cache_read_input_tokens / 1000).toFixed(0)}k`}
                  icon={<Activity className="h-4 w-4" />}
                />
                <MetricCard
                  label="Priced %"
                  value={`${(
                    (spending.summary.priced_request_count /
                      (spending.summary.successful_request_count || 1)) *
                    100
                  ).toFixed(1)}%`}
                  detail={`${spending.summary.unpriced_request_count.toLocaleString()} unpriced`}
                  icon={<Gauge className="h-4 w-4" />}
                />
              </div>

              {spending.groups.length > 0 && (
                <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Cost Components by {spendingGroupBy === "none" ? "Total" : spendingGroupBy.replace("_", " ")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={spending.groups.slice(0, spendingTopN)}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="key" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "var(--popover)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius)",
                                fontSize: 12,
                                color: "var(--popover-foreground)",
                              }}
                              formatter={(value: number) => [formatMoneyMicros(value, reportSymbol, reportCode), "Cost"]}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="total_cost_micros" name="Total Cost" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {spending.summary.unpriced_request_count > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Unpriced Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pb-4">
                        {Object.entries(spending.unpriced_breakdown).map(([reason, count]) => {
                          const percent = (count / spending.summary.unpriced_request_count) * 100;
                          return (
                            <div key={reason} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{reason}</span>
                                <span className="font-medium">{count}</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full bg-amber-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {spending.groups.length > 0 && (
                <div className="grid gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        Cost Efficiency Scatter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                              type="number"
                              dataKey="tokPerReq"
                              name="Tokens/Request"
                              tick={{ fontSize: 11 }}
                              className="text-muted-foreground"
                              label={{ value: "Tokens per Request", position: "insideBottom", offset: -5, fontSize: 11 }}
                            />
                            <YAxis
                              type="number"
                              dataKey="costPer1kTok"
                              name="$/1k tokens"
                              tick={{ fontSize: 11 }}
                              className="text-muted-foreground"
                              label={{ value: "$ per 1k tokens", angle: -90, position: "insideLeft", fontSize: 11 }}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "var(--popover)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius)",
                                fontSize: 12,
                                color: "var(--popover-foreground)",
                              }}
                              formatter={(value: number, name: string) => {
                                if (name === "Tokens/Request") return [Math.round(value).toLocaleString(), name];
                                if (name === "$/1k tokens") return [formatMoneyMicros(value, reportSymbol, reportCode, 4), name];
                                if (name === "Total Spend") return [formatMoneyMicros(value, reportSymbol, reportCode), name];
                                return [value, name];
                              }}
                              cursor={{ strokeDasharray: "3 3" }}
                            />
                            <Scatter
                              name="Groups"
                              data={spending.groups.slice(0, spendingTopN).map((g) => ({
                                key: g.key,
                                tokPerReq: g.total_requests > 0 ? g.total_tokens / g.total_requests : 0,
                                costPer1kTok: g.total_tokens > 0 ? (g.total_cost_micros / g.total_tokens) * 1000 : 0,
                                totalCost: g.total_cost_micros,
                              }))}
                              fill="var(--chart-3)"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Top-right quadrant = expensive due to high token usage and high rates.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Cost Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      {(() => {
                        const sortedByCost = [...spending.groups].sort((a, b) => b.total_cost_micros - a.total_cost_micros);
                        const sortedByEfficiency = [...spending.groups]
                          .filter(g => g.total_tokens > 0)
                          .sort((a, b) => {
                            const effA = (a.total_cost_micros / a.total_tokens) * 1000;
                            const effB = (b.total_cost_micros / b.total_tokens) * 1000;
                            return effB - effA;
                          });
                        const highestCost = sortedByCost[0];
                        const leastEfficient = sortedByEfficiency[0];
                        const avgCostPer1k = spending.summary.total_tokens > 0
                          ? (spending.summary.total_cost_micros / spending.summary.total_tokens) * 1000
                          : 0;

                        return (
                          <>
                            <div className="rounded-md border p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium">Highest Spend</p>
                                  <p className="text-sm text-muted-foreground">{highestCost?.key}</p>
                                </div>
                                <span className="text-sm font-medium">
                                  {formatMoneyMicros(highestCost?.total_cost_micros ?? 0, reportSymbol, reportCode)}
                                </span>
                              </div>
                            </div>

                            {leastEfficient && (
                              <div className="rounded-md border p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium">Least Efficient</p>
                                    <p className="text-sm text-muted-foreground">{leastEfficient.key}</p>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {formatMoneyMicros(
                                      (leastEfficient.total_cost_micros / leastEfficient.total_tokens) * 1000,
                                      reportSymbol,
                                      reportCode,
                                      4
                                    )}/1k
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="rounded-md border p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium">Avg Cost per 1k Tokens</p>
                                  <p className="text-sm text-muted-foreground">Across all groups</p>
                                </div>
                                <span className="text-sm font-medium">
                                  {formatMoneyMicros(avgCostPer1k, reportSymbol, reportCode, 4)}
                                </span>
                              </div>
                            </div>

                            {spending.summary.unpriced_request_count > 0 && (
                              <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium">Unpriced Requests</p>
                                    <p className="text-sm text-muted-foreground">
                                      {spending.summary.unpriced_request_count.toLocaleString()} requests lack pricing data
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {spending.groups.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Spending Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Group</TableHead>
                            <TableHead className="text-right">Requests</TableHead>
                            <TableHead className="text-right">Tokens</TableHead>
                            <TableHead className="text-right">Spend</TableHead>
                            <TableHead className="text-right">% Total</TableHead>
                            <TableHead className="text-right">$/Req</TableHead>
                            <TableHead className="text-right">$/1k tok</TableHead>
                            <TableHead className="text-right">Tok/Req</TableHead>
                            <TableHead className="text-right">Priced %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {spending.groups.map((group) => {
                            const percent =
                              spending.summary.total_cost_micros > 0
                                ? (group.total_cost_micros /
                                    spending.summary.total_cost_micros) *
                                  100
                                : 0;
                            const costPerReq = group.total_requests > 0 ? group.total_cost_micros / group.total_requests : 0;
                            const costPer1kTok = group.total_tokens > 0 ? (group.total_cost_micros / group.total_tokens) * 1000 : 0;
                            const tokPerReq = group.total_requests > 0 ? group.total_tokens / group.total_requests : 0;
                            const pricedPercent = group.total_requests > 0 ? (group.priced_requests / group.total_requests) * 100 : 0;
                            return (
                              <TableRow key={group.key}>
                                <TableCell className="font-medium">
                                  {group.key}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {group.total_requests.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {(group.total_tokens / 1000).toFixed(0)}k
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatMoneyMicros(
                                    group.total_cost_micros,
                                    reportSymbol,
                                    reportCode
                                  )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  {percent.toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-xs">
                                  {formatMoneyMicros(costPerReq, reportSymbol, reportCode, 4)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-xs">
                                  {formatMoneyMicros(costPer1kTok, reportSymbol, reportCode, 4)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-xs">
                                  {tokPerReq.toFixed(0)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-xs">
                                  {pricedPercent.toFixed(0)}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        {spendingOffset + 1}–
                        {Math.min(
                          spendingOffset + spendingLimit,
                          spending.groups_total
                        )}{" "}
                        of {spending.groups_total}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={spendingOffset === 0}
                          onClick={() =>
                            setSpendingOffset(
                              Math.max(0, spendingOffset - spendingLimit)
                            )
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canPaginateForward}
                          onClick={() =>
                            setSpendingOffset(spendingOffset + spendingLimit)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={<CircleDollarSign className="h-6 w-6" />}
                  title="No spending data found"
                  description="Try adjusting your filters or time range."
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <TopSpendingCard
                  title="Top Models by Cost"
                  items={spending.top_spending_models.map((m) => ({
                    label: m.model_id,
                    costMicros: m.total_cost_micros,
                  }))}
                  totalCostMicros={spending.summary.total_cost_micros}
                  currencySymbol={reportSymbol}
                  currencyCode={reportCode}
                />
                <TopSpendingCard
                  title="Top Endpoints by Cost"
                  items={spending.top_spending_endpoints.map((c) => ({
                    label: c.endpoint_label,
                    costMicros: c.total_cost_micros,
                  }))}
                  totalCostMicros={spending.summary.total_cost_micros}
                  currencySymbol={reportSymbol}
                  currencyCode={reportCode}
                />
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
