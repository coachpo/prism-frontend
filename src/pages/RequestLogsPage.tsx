import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useProfileContext } from "@/context/ProfileContext";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import { useTimezone } from "@/hooks/useTimezone";
import { api } from "@/lib/api";
import type { ConnectionDropdownItem, Endpoint, RequestLogEntry } from "@/lib/types";
import { FiltersBar } from "@/pages/request-logs/FiltersBar";
import {
  hasSpecialTokenValue,
  matchesLatencyBucket,
  rowHasAnySpecialToken,
} from "@/pages/request-logs/formatters";
import {
  DEFAULT_REQUEST_LIMIT,
  LATENCY_BUCKETS,
  REQUEST_OUTCOME_FILTERS,
  REQUEST_SPECIAL_TOKEN_FILTERS,
  REQUEST_STREAM_FILTERS,
  REQUEST_TIME_RANGES,
  TRIAGE_OPTIONS,
  VIEW_OPTIONS,
  parseBooleanParam,
  parseEnumParam,
  parseIdFilterParam,
  parseNonNegativeIntParam,
  parseOptionalNumber,
  parsePositiveIntParam,
  parseRequestLimitParam,
  type LatencyBucket,
  type OutcomeFilter,
  type SpecialTokenFilter,
  type StreamFilter,
  type TimeRange,
  type TriageFilter,
  type ViewType,
} from "@/pages/request-logs/queryParams";
import { RequestLogDetailSheet } from "@/pages/request-logs/RequestLogDetailSheet";
import { RequestLogsTable } from "@/pages/request-logs/RequestLogsTable";

const REQUEST_DETAIL_TABS = ["overview", "audit"] as const;

type RequestDetailTab = (typeof REQUEST_DETAIL_TABS)[number];

export function RequestLogsPage() {
  const { format: formatTime } = useTimezone();
  const { navigateToConnection } = useConnectionNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { revision } = useProfileContext();

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
  const [requestId, setRequestId] = useState<number | null>(() => parsePositiveIntParam(searchParams.get("request_id")));
  const [detailTab, setDetailTab] = useState<RequestDetailTab>(() =>
    parseEnumParam(searchParams.get("detail_tab"), REQUEST_DETAIL_TABS, "overview")
  );
  const [selectedLog, setSelectedLog] = useState<RequestLogEntry | null>(null);
  const [exactLog, setExactLog] = useState<RequestLogEntry | null>(null);
  const [exactLoading, setExactLoading] = useState(false);

  useEffect(() => {
    const nextRequestId = parsePositiveIntParam(searchParams.get("request_id"));
    const nextDetailTab = parseEnumParam(searchParams.get("detail_tab"), REQUEST_DETAIL_TABS, "overview");

    setRequestId((current) => (current === nextRequestId ? current : nextRequestId));
    setDetailTab((current) => (current === nextDetailTab ? current : nextDetailTab));
  }, [searchParams]);

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
  }, [revision]);

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

        if (requestId === null) {
          next.delete("request_id");
          next.delete("detail_tab");
        } else {
          next.set("request_id", String(requestId));
          setOrDelete("detail_tab", detailTab, "overview");
        }

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
    requestId,
    searchQuery,
    setSearchParams,
    showBillableOnly,
    showPricedOnly,
    specialTokenFilter,
    streamFilter,
    detailTab,
    timeRange,
    tokenMax,
    tokenMin,
    triage,
    view,
  ]);

  useEffect(() => {
    setOffset(0);
  }, [revision]);

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
  }, [connectionId, endpointId, limit, modelId, offset, providerType, timeRange, revision]);

  useEffect(() => {
    if (requestId === null) {
      setExactLog(null);
      setExactLoading(false);
      return;
    }

    let cancelled = false;

    const fetchExactLog = async () => {
      setExactLoading(true);
      try {
        const response = await api.stats.requests({ request_id: requestId, limit: 1, offset: 0 });
        if (!cancelled) {
          setExactLog(response.items[0] ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch exact request log", error);
        if (!cancelled) {
          setExactLog(null);
        }
      } finally {
        if (!cancelled) {
          setExactLoading(false);
        }
      }
    };

    fetchExactLog();

    return () => {
      cancelled = true;
    };
  }, [requestId, revision]);

  useEffect(() => {
    if (requestId === null) {
      return;
    }

    if (exactLog) {
      setSelectedLog((current) => (current?.id === exactLog.id ? current : exactLog));
      return;
    }

    if (!exactLoading) {
      setSelectedLog(null);
    }
  }, [exactLoading, exactLog, requestId]);

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

  const displayedRows = requestId !== null ? (exactLog ? [exactLog] : []) : filteredAndSortedRows;
  const displayedLoading = requestId !== null ? exactLoading : loading;
  const displayedTotal = requestId !== null ? (exactLog ? 1 : 0) : total;
  const displayedPageRowCount = requestId !== null ? displayedRows.length : logs.length;

  const allColumnsMode = view === "all";

  const clearRequestFocus = () => {
    setRequestId(null);
    setDetailTab("overview");
  };

  const openLogDetail = (log: RequestLogEntry, tab: RequestDetailTab = "overview") => {
    setDetailTab(tab);
    setSelectedLog(log);
  };

  const clearAllFilters = () => {
    clearRequestFocus();
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

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col gap-[var(--density-page-gap)]">
        <PageHeader
          title="Request Logs"
          description="Focused telemetry views for performance, tokens, billing, cache behavior, and error triage"
        />

        {requestId !== null ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-background to-amber-500/[0.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Request focus</p>
              <p className="font-mono text-sm text-foreground">Investigating request #{requestId}</p>
              <p className="text-sm text-muted-foreground">
                {detailTab === "audit"
                  ? "Audit detail opens automatically when a linked payload is available."
                  : "Close the detail sheet or return to the browser to resume the full request timeline view."}
              </p>
            </div>
            <Button variant="outline" className="shrink-0" onClick={clearRequestFocus}>
              Return to request browser
            </Button>
          </div>
        ) : null}

        <FiltersBar
          view={view}
          setView={setView}
          triage={triage}
          setTriage={setTriage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          showPricedOnly={showPricedOnly}
          setShowPricedOnly={setShowPricedOnly}
          showBillableOnly={showBillableOnly}
          setShowBillableOnly={setShowBillableOnly}
          modelId={modelId}
          setModelId={setModelId}
          models={models}
          providerType={providerType}
          setProviderType={setProviderType}
          connectionId={connectionId}
          setConnectionId={setConnectionId}
          connections={connections}
          endpointId={endpointId}
          setEndpointId={setEndpointId}
          endpoints={endpoints}
          outcomeFilter={outcomeFilter}
          setOutcomeFilter={setOutcomeFilter}
          streamFilter={streamFilter}
          setStreamFilter={setStreamFilter}
          latencyBucket={latencyBucket}
          setLatencyBucket={setLatencyBucket}
          specialTokenFilter={specialTokenFilter}
          setSpecialTokenFilter={setSpecialTokenFilter}
          tokenMinInput={tokenMinInput}
          setTokenMinInput={setTokenMinInput}
          setTokenMin={setTokenMin}
          tokenMaxInput={tokenMaxInput}
          setTokenMaxInput={setTokenMaxInput}
          setTokenMax={setTokenMax}
          setOffset={setOffset}
          clearAllFilters={clearAllFilters}
        />

        <RequestLogsTable
          rows={displayedRows}
          pageRowCount={displayedPageRowCount}
          loading={displayedLoading}
          total={displayedTotal}
          limit={limit}
          offset={offset}
          setLimit={setLimit}
          setOffset={setOffset}
          view={view}
          allColumnsMode={allColumnsMode}
          openLogDetail={openLogDetail}
          clearAllFilters={clearAllFilters}
          formatTime={formatTime}
          navigateToConnection={navigateToConnection}
          emptyStateTitle={
            requestId !== null ? `Request #${requestId} was not found` : undefined
          }
          emptyStateDescription={
            requestId !== null
              ? "That request is not available in the currently selected profile. Return to the browser to keep investigating nearby traffic."
              : undefined
          }
          emptyStateAction={
            requestId !== null ? (
              <Button variant="outline" onClick={clearRequestFocus}>
                Return to request browser
              </Button>
            ) : undefined
          }
        />

        <RequestLogDetailSheet
          selectedLog={selectedLog}
          setSelectedLog={setSelectedLog}
          setModelId={setModelId}
          setProviderType={setProviderType}
          setConnectionId={setConnectionId}
          setOffset={setOffset}
          navigateToConnection={navigateToConnection}
          formatTime={formatTime}
          requestId={requestId}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          clearRequestFocus={clearRequestFocus}
        />
      </div>
    </TooltipProvider>
  );
}
