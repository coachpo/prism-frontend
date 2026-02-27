import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatMoneyMicros } from "@/lib/costing";
import type {
  ConnectionDropdownItem,
  RequestLogEntry,
  SpendingGroupBy,
  SpendingReportResponse,
  StatsSummary,
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
import { Activity, Clock, Coins, Gauge, TrendingUp, CircleDollarSign } from "lucide-react";
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
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeBucket {
  label: string;
  requests: number;
  errors: number;
  avgLatency: number;
}

type SpecialTokenFilter =
  | "all"
  | "has_cached"
  | "has_reasoning"
  | "has_any_special"
  | "missing_special";

const STATISTICS_TABS = ["operations", "spending"] as const;
const OPERATIONS_TIME_RANGES = ["1h", "24h", "7d", "all"] as const;
const OPERATIONS_SPECIAL_TOKEN_FILTERS: readonly SpecialTokenFilter[] = [
  "all",
  "has_cached",
  "has_reasoning",
  "has_any_special",
  "missing_special",
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
function bucketLogs(logs: RequestLogEntry[], timeRange: string): TimeBucket[] {
  if (logs.length === 0) return [];

  const sorted = [...logs].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const bucketMap = new Map<
    string,
    { requests: number; errors: number; totalLatency: number }
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
      totalLatency: 0,
    };
    existing.requests++;
    if (log.status_code >= 400) existing.errors++;
    existing.totalLatency += log.response_time_ms;
    bucketMap.set(key, existing);
  }

  return Array.from(bucketMap.entries()).map(([label, data]) => ({
    label,
    requests: data.requests,
    errors: data.errors,
    avgLatency: Math.round(data.totalLatency / data.requests),
  }));
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
  const [summary, setSummary] = useState<StatsSummary | null>(null);
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

          const [logsData, summaryData] = await Promise.all([
            api.stats.requests(params),
            api.stats.summary(params),
          ]);
          setLogs(logsData.items);
          setSummary(summaryData);
        } catch (error) {
          console.error("Failed to fetch statistics:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, 450);

    return () => clearTimeout(timeout);
  }, [modelId, connectionId, providerType, timeRange]);

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

  const chartData = useMemo(() => bucketLogs(logs, timeRange), [logs, timeRange]);

  const requestLogRows = useMemo(() => {
    return logs.filter((log) => {
      if (specialTokenFilter === "has_cached") {
        return hasSpecialTokenValue(log.cache_read_input_tokens);
      }
      if (specialTokenFilter === "has_reasoning") {
        return hasSpecialTokenValue(log.reasoning_tokens);
      }
      if (specialTokenFilter === "has_any_special") {
        return rowHasAnySpecialToken(log);
      }
      if (specialTokenFilter === "missing_special") {
        return !rowHasAnySpecialToken(log);
      }
      return true;
    });
  }, [logs, specialTokenFilter]);

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

  const providerBreakdown = useMemo(() => {
    const map = new Map<string, { requests: number; errors: number; latencyTotal: number }>();

    for (const log of requestLogRows) {
      const key = log.provider_type || "unknown";
      const current = map.get(key) ?? { requests: 0, errors: 0, latencyTotal: 0 };
      current.requests += 1;
      current.latencyTotal += log.response_time_ms;
      if (log.status_code >= 400) current.errors += 1;
      map.set(key, current);
    }

    return Array.from(map.entries())
      .map(([provider, values]) => ({
        provider,
        requests: values.requests,
        errors: values.errors,
        avgLatency: values.requests > 0 ? Math.round(values.latencyTotal / values.requests) : 0,
      }))
      .sort((a, b) => b.requests - a.requests);
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


  const successRate =
    summary && summary.total_requests > 0
      ? ((summary.success_count / summary.total_requests) * 100).toFixed(1)
      : "0.0";

  const reportSymbol = spending?.report_currency_symbol ?? "$";
  const reportCode = spending?.report_currency_code ?? "USD";
  const canPaginateForward =
    spending !== null && spendingOffset + spendingLimit < spending.groups_total;

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
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 w-fit">
            {OPERATIONS_TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-3 text-xs",
                  timeRange === range && "shadow-sm"
                )}
                onClick={() => setTimeRange(range)}
              >
                {range === "all" ? "All" : range}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-52">
                <SelectValue placeholder="Filter by Model ID..." />
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
              className="h-8 w-full text-xs sm:w-44"
            />
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-32">
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
              onValueChange={(value) =>
                setSpecialTokenFilter(value as SpecialTokenFilter)
              }
            >
              <SelectTrigger className="h-8 w-full text-xs sm:w-52">
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label="Total Requests"
              value={summary?.total_requests ?? 0}
              detail={`${summary?.success_count ?? 0} successful`}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              label="Avg Latency"
              value={`${(summary?.avg_response_time_ms ?? 0).toFixed(0)}ms`}
              detail={`P95: ${(summary?.p95_response_time_ms ?? 0).toFixed(0)}ms`}
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricCard
              label="Success Rate"
              value={`${successRate}%`}
              detail={`${summary?.error_count ?? 0} errors`}
              icon={<Gauge className="h-4 w-4" />}
            />
            <MetricCard
              label="Total Tokens"
              value={(summary?.total_tokens ?? 0).toLocaleString()}
              detail={`In: ${(summary?.total_input_tokens ?? 0).toLocaleString()} / Out: ${(summary?.total_output_tokens ?? 0).toLocaleString()}`}
              icon={<Coins className="h-4 w-4" />}
            />
          </div>

          <SpecialTokenCoverageStrip
            totalRows={specialTokenCoverage.totalRows}
            cachedCaptured={specialTokenCoverage.cachedCaptured}
            reasoningCaptured={specialTokenCoverage.reasoningCaptured}
            anySpecialCaptured={specialTokenCoverage.anySpecialCaptured}
            noTokenUsage={specialTokenCoverage.noTokenUsage}
          />

          {chartData.length > 1 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    Request Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
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
                        <Area type="monotone" dataKey="requests" stroke="var(--chart-1)" fill="url(#fillRequests)" strokeWidth={2} />
                        <Area
                          type="monotone"
                          dataKey="errors"
                          stroke="var(--destructive)"
                          fill="var(--destructive)"
                          fillOpacity={0.1}
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Avg Latency per Bucket
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
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
                          formatter={(value: number) => [`${value}ms`, "Avg Latency"]}
                        />
                        <Bar dataKey="avgLatency" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Provider Reliability</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {providerBreakdown.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No provider data for current filters.</p>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={providerBreakdown}
                          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="provider" tick={{ fontSize: 11 }} className="text-muted-foreground" />
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
                          <Bar dataKey="requests" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="errors" fill="var(--destructive)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Latency Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={latencyBandData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
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
                        <Bar dataKey="count" fill="var(--chart-5)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Request Logs Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Detailed request log review moved to a dedicated page with focused filters and a wider table layout.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Rows in current window</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{logs.length.toLocaleString()}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Rows after token filter</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {requestLogRows.length.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Error rows</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {requestLogRows.filter((row) => row.status_code >= 400).length.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Top status code</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {errorCodeBreakdown[0]?.status ?? "n/a"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="default" size="sm" onClick={() => navigate("/request-logs")}>
                  Open Request Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Report Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-6">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Preset</span>
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
                  <Input
                    className="h-8 text-xs"
                    placeholder="optional"
                    value={spendingModelId}
                    onChange={(e) => {
                      setSpendingModelId(e.target.value);
                      setSpendingOffset(0);
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Connection ID</span>
                  <Input
                    className="h-8 text-xs"
                    type="number"
                    min="1"
                    placeholder="optional"
                    value={spendingConnectionId}
                    onChange={(e) => {
                      setSpendingConnectionId(e.target.value);
                      setSpendingOffset(0);
                    }}
                  />
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
                    Reset Filters
                  </Button>
                </div>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[100px] rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-[400px] rounded-xl" />
            </div>
          ) : spending ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Total Cost"
                  value={formatMoneyMicros(
                    spending.summary.total_cost_micros,
                    reportSymbol,
                    reportCode
                  )}
                  detail={`${spending.summary.successful_request_count.toLocaleString()} requests`}
                  icon={<CircleDollarSign className="h-4 w-4" />}
                />
                <MetricCard
                  label="Avg Cost / Req"
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
                  label="Total Tokens"
                  value={spending.summary.total_tokens.toLocaleString()}
                  detail={`In: ${spending.summary.total_input_tokens.toLocaleString()} / Out: ${spending.summary.total_output_tokens.toLocaleString()}`}
                  icon={<Coins className="h-4 w-4" />}
                />
                <MetricCard
                  label="Priced Requests"
                  value={`${(
                    (spending.summary.priced_request_count /
                      (spending.summary.successful_request_count || 1)) *
                    100
                  ).toFixed(1)}%`}
                  detail={`${spending.summary.unpriced_request_count.toLocaleString()} unpriced`}
                  icon={<Activity className="h-4 w-4" />}
                />
              </div>

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
                            <TableHead className="text-right">Cost</TableHead>
                            <TableHead className="text-right">% of Total</TableHead>
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
                            return (
                              <TableRow key={group.key}>
                                <TableCell className="font-medium">
                                  {group.key}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {group.total_requests.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {group.total_tokens.toLocaleString()}
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
