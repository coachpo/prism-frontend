import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, FileSearch, Logs } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileContext } from "@/context/ProfileContext";
import { useConnectionNavigation } from "@/hooks/useConnectionNavigation";
import { useTimezone } from "@/hooks/useTimezone";
import { api } from "@/lib/api";
import type {
  AuditLogDetail,
  AuditLogListItem,
  ConnectionDropdownItem,
  Endpoint,
  Provider,
  RequestLogEntry,
} from "@/lib/types";
import { AuditResultsTable } from "@/pages/logs/AuditResultsTable";
import { FiltersBar } from "@/pages/logs/FiltersBar";
import { ObservabilityInspectorSheet } from "@/pages/logs/ObservabilityInspectorSheet";
import {
  DEFAULT_REQUEST_LIMIT,
  parseBooleanParam,
  parseEnumParam,
  parseIdFilterParam,
  parseNonNegativeIntParam,
  parseOptionalNumber,
  parsePositiveIntParam,
  parseRequestLimitParam,
  REQUEST_VIEW_OPTIONS,
  STATUS_FAMILY_OPTIONS,
  TIME_RANGES,
  type DetailTab,
  type RequestView,
  type SpecialTokenFilter,
  type StatusFamily,
  type StreamFilter,
  type TimeRange,
  type TriageFilter,
} from "@/pages/logs/queryParams";
import { RequestLogsTable } from "@/pages/request-logs/RequestLogsTable";
import {
  hasSpecialTokenValue,
  matchesStatusFamily,
  rowHasAnySpecialToken,
} from "@/pages/logs/formatters";

const AUDIT_LIMIT = 50;

function getFromTime(range: TimeRange): string | undefined {
  if (range === "all") return undefined;

  const now = new Date();
  const hours = range === "1h" ? 1 : range === "24h" ? 24 : 24 * 7;
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

export function ObservabilityLogsPage() {
  const { format: formatTime } = useTimezone();
  const { navigateToConnection } = useConnectionNavigation();
  const { revision } = useProfileContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [models, setModels] = useState<{ display_name: string | null; model_id: string }[]>([]);
  const [connections, setConnections] = useState<ConnectionDropdownItem[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  const [requestRows, setRequestRows] = useState<RequestLogEntry[]>([]);
  const [requestLoading, setRequestLoading] = useState(true);
  const [requestTotal, setRequestTotal] = useState(0);
  const [auditRows, setAuditRows] = useState<AuditLogListItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditTotal, setAuditTotal] = useState(0);

  const [selectedRequest, setSelectedRequest] = useState<RequestLogEntry | null>(null);
  const [selectedAuditSummary, setSelectedAuditSummary] = useState<AuditLogListItem | null>(null);
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<AuditLogDetail | null>(null);
  const [auditDetailLoading, setAuditDetailLoading] = useState(false);

  const [range, setRange] = useState<TimeRange>(() => parseEnumParam(searchParams.get("range"), TIME_RANGES, "24h"));
  const [provider, setProvider] = useState(searchParams.get("provider")?.trim() || "all");
  const [modelId, setModelId] = useState(searchParams.get("model")?.trim() || "__all__");
  const [connectionId, setConnectionId] = useState(() => parseIdFilterParam(searchParams.get("connection")));
  const [endpointId, setEndpointId] = useState(() => parseIdFilterParam(searchParams.get("endpoint")));
  const [statusFamily, setStatusFamily] = useState<StatusFamily>(() =>
    parseEnumParam(searchParams.get("status"), STATUS_FAMILY_OPTIONS, "all")
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [requestView, setRequestView] = useState<RequestView>(() =>
    parseEnumParam(
      searchParams.get("request_view"),
      REQUEST_VIEW_OPTIONS.map((option) => option.value),
      "overview"
    )
  );
  const [triage, setTriage] = useState<TriageFilter>(() =>
    parseEnumParam(searchParams.get("triage"), ["none", "slowest", "expensive", "most_tokens", "errors_only", "unpriced_only"], "none")
  );
  const [streamFilter, setStreamFilter] = useState<StreamFilter>(() =>
    parseEnumParam(searchParams.get("stream"), ["all", "stream", "non_stream"], "all")
  );
  const [specialTokenFilter, setSpecialTokenFilter] = useState<SpecialTokenFilter>(() =>
    parseEnumParam(searchParams.get("special"), ["all", "has_cached", "has_reasoning", "has_any_special", "missing_special"], "all")
  );
  const [pricedOnly, setPricedOnly] = useState(() => parseBooleanParam(searchParams.get("priced")));
  const [billableOnly, setBillableOnly] = useState(() => parseBooleanParam(searchParams.get("billable")));
  const [tokenMin, setTokenMin] = useState<number | null>(() => parseOptionalNumber(searchParams.get("token_min")));
  const [tokenMax, setTokenMax] = useState<number | null>(() => parseOptionalNumber(searchParams.get("token_max")));
  const [tokenMinInput, setTokenMinInput] = useState(tokenMin === null ? "" : String(tokenMin));
  const [tokenMaxInput, setTokenMaxInput] = useState(tokenMax === null ? "" : String(tokenMax));
  const [requestLimit, setRequestLimit] = useState(() => parseRequestLimitParam(searchParams.get("req_limit")));
  const [requestOffset, setRequestOffset] = useState(() => parseNonNegativeIntParam(searchParams.get("req_offset"), 0));
  const [auditOffset, setAuditOffset] = useState(() => parseNonNegativeIntParam(searchParams.get("audit_offset"), 0));
  const [requestId, setRequestId] = useState<number | null>(() => parsePositiveIntParam(searchParams.get("request_id")));
  const [auditId, setAuditId] = useState<number | null>(() => parsePositiveIntParam(searchParams.get("audit_id")));
  const [detailTab, setDetailTab] = useState<DetailTab>(() =>
    parseEnumParam(searchParams.get("detail_tab"), ["request", "audit", "json"], "request")
  );

  const providerId = useMemo(
    () => (provider === "all" ? undefined : providers.find((item) => item.provider_type === provider)?.id),
    [provider, providers]
  );

  useEffect(() => {
    const nextRange = parseEnumParam(searchParams.get("range"), TIME_RANGES, "24h");
    const nextProvider = searchParams.get("provider")?.trim() || "all";
    const nextModelId = searchParams.get("model")?.trim() || "__all__";
    const nextConnectionId = parseIdFilterParam(searchParams.get("connection"));
    const nextEndpointId = parseIdFilterParam(searchParams.get("endpoint"));
    const nextStatusFamily = parseEnumParam(searchParams.get("status"), STATUS_FAMILY_OPTIONS, "all");
    const nextSearch = searchParams.get("search") || "";
    const nextRequestView = parseEnumParam(
      searchParams.get("request_view"),
      REQUEST_VIEW_OPTIONS.map((option) => option.value),
      "overview"
    );
    const nextTriage = parseEnumParam(
      searchParams.get("triage"),
      ["none", "slowest", "expensive", "most_tokens", "errors_only", "unpriced_only"],
      "none"
    );
    const nextStreamFilter = parseEnumParam(searchParams.get("stream"), ["all", "stream", "non_stream"], "all");
    const nextSpecialTokenFilter = parseEnumParam(
      searchParams.get("special"),
      ["all", "has_cached", "has_reasoning", "has_any_special", "missing_special"],
      "all"
    );
    const nextPricedOnly = parseBooleanParam(searchParams.get("priced"));
    const nextBillableOnly = parseBooleanParam(searchParams.get("billable"));
    const nextTokenMin = parseOptionalNumber(searchParams.get("token_min"));
    const nextTokenMax = parseOptionalNumber(searchParams.get("token_max"));
    const nextRequestLimit = parseRequestLimitParam(searchParams.get("req_limit"));
    const nextRequestOffset = parseNonNegativeIntParam(searchParams.get("req_offset"), 0);
    const nextAuditOffset = parseNonNegativeIntParam(searchParams.get("audit_offset"), 0);
    const nextRequestId = parsePositiveIntParam(searchParams.get("request_id"));
    const nextAuditId = parsePositiveIntParam(searchParams.get("audit_id"));
    const nextDetailTab = parseEnumParam(searchParams.get("detail_tab"), ["request", "audit", "json"], "request");

    setRange((current) => (current === nextRange ? current : nextRange));
    setProvider((current) => (current === nextProvider ? current : nextProvider));
    setModelId((current) => (current === nextModelId ? current : nextModelId));
    setConnectionId((current) => (current === nextConnectionId ? current : nextConnectionId));
    setEndpointId((current) => (current === nextEndpointId ? current : nextEndpointId));
    setStatusFamily((current) => (current === nextStatusFamily ? current : nextStatusFamily));
    setSearch((current) => (current === nextSearch ? current : nextSearch));
    setRequestView((current) => (current === nextRequestView ? current : nextRequestView));
    setTriage((current) => (current === nextTriage ? current : nextTriage));
    setStreamFilter((current) => (current === nextStreamFilter ? current : nextStreamFilter));
    setSpecialTokenFilter((current) => (current === nextSpecialTokenFilter ? current : nextSpecialTokenFilter));
    setPricedOnly((current) => (current === nextPricedOnly ? current : nextPricedOnly));
    setBillableOnly((current) => (current === nextBillableOnly ? current : nextBillableOnly));
    setTokenMin((current) => (current === nextTokenMin ? current : nextTokenMin));
    setTokenMax((current) => (current === nextTokenMax ? current : nextTokenMax));
    setTokenMinInput((current) => {
      const nextValue = nextTokenMin === null ? "" : String(nextTokenMin);
      return current === nextValue ? current : nextValue;
    });
    setTokenMaxInput((current) => {
      const nextValue = nextTokenMax === null ? "" : String(nextTokenMax);
      return current === nextValue ? current : nextValue;
    });
    setRequestLimit((current) => (current === nextRequestLimit ? current : nextRequestLimit));
    setRequestOffset((current) => (current === nextRequestOffset ? current : nextRequestOffset));
    setAuditOffset((current) => (current === nextAuditOffset ? current : nextAuditOffset));
    setRequestId((current) => (current === nextRequestId ? current : nextRequestId));
    setAuditId((current) => (current === nextAuditId ? current : nextAuditId));
    setDetailTab((current) => (current === nextDetailTab ? current : nextDetailTab));
  }, [searchParams]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, connectionsData, endpointsData, providersData] = await Promise.all([
          api.models.list(),
          api.endpoints.connections(),
          api.endpoints.list(),
          api.providers.list(),
        ]);

        setModels(modelsData.map((model) => ({ display_name: model.display_name, model_id: model.model_id })));
        setConnections(connectionsData.items);
        setEndpoints(endpointsData);
        setProviders(providersData);
      } catch (error) {
        console.error("Failed to load observability filters", error);
      }
    };

    void fetchFilters();
  }, [revision]);

  useEffect(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        const setOrDelete = (
          key: string,
          value: string | number | null,
          defaultValue?: string | number | null
        ) => {
          if (value === null || value === "" || value === defaultValue) {
            next.delete(key);
            return;
          }
          next.set(key, String(value));
        };

        setOrDelete("range", range, "24h");
        setOrDelete("provider", provider, "all");
        setOrDelete("model", modelId, "__all__");
        setOrDelete("connection", connectionId, "__all__");
        setOrDelete("endpoint", endpointId, "__all__");
        setOrDelete("status", statusFamily, "all");
        setOrDelete("search", search, "");
        setOrDelete("request_view", requestView, "overview");
        setOrDelete("triage", triage, "none");
        setOrDelete("stream", streamFilter, "all");
        setOrDelete("special", specialTokenFilter, "all");
        setOrDelete("token_min", tokenMin, null);
        setOrDelete("token_max", tokenMax, null);
        if (pricedOnly) next.set("priced", "true");
        else next.delete("priced");
        if (billableOnly) next.set("billable", "true");
        else next.delete("billable");
        setOrDelete("req_limit", requestLimit, DEFAULT_REQUEST_LIMIT);
        setOrDelete("req_offset", requestOffset, 0);
        setOrDelete("audit_offset", auditOffset, 0);
        setOrDelete("request_id", requestId, null);
        setOrDelete("audit_id", auditId, null);
        if (requestId !== null || auditId !== null) {
          setOrDelete("detail_tab", detailTab, "request");
        } else {
          next.delete("detail_tab");
        }

        return next.toString() === previous.toString() ? previous : next;
      },
      { replace: true }
    );
  }, [
    auditId,
    auditOffset,
    billableOnly,
    connectionId,
    detailTab,
    endpointId,
    modelId,
    pricedOnly,
    provider,
    range,
    requestId,
    requestLimit,
    requestOffset,
    requestView,
    search,
    setSearchParams,
    specialTokenFilter,
    statusFamily,
    streamFilter,
    tokenMax,
    tokenMin,
    triage,
  ]);

  useEffect(() => {
    const fetchRequests = async () => {
      setRequestLoading(true);
      try {
        const response = await api.stats.requests({
          connection_id: connectionId === "__all__" ? undefined : Number.parseInt(connectionId, 10),
          endpoint_id: endpointId === "__all__" ? undefined : Number.parseInt(endpointId, 10),
          from_time: getFromTime(range),
          limit: requestLimit,
          model_id: modelId === "__all__" ? undefined : modelId,
          offset: requestOffset,
          provider_type: provider === "all" ? undefined : provider,
        });
        setRequestRows(response.items);
        setRequestTotal(response.total);
      } catch (error) {
        console.error("Failed to fetch request logs", error);
      } finally {
        setRequestLoading(false);
      }
    };

    void fetchRequests();
  }, [connectionId, endpointId, modelId, provider, range, requestLimit, requestOffset, revision]);

  useEffect(() => {
    const fetchAudits = async () => {
      setAuditLoading(true);
      try {
        const response = await api.audit.list({
          connection_id: connectionId === "__all__" ? undefined : Number.parseInt(connectionId, 10),
          endpoint_id: endpointId === "__all__" ? undefined : Number.parseInt(endpointId, 10),
          from_time: getFromTime(range),
          limit: AUDIT_LIMIT,
          model_id: modelId === "__all__" ? undefined : modelId,
          offset: auditOffset,
          provider_id: providerId,
        });
        setAuditRows(response.items);
        setAuditTotal(response.total);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setAuditLoading(false);
      }
    };

    void fetchAudits();
  }, [auditOffset, connectionId, endpointId, modelId, providerId, range, revision]);

  useEffect(() => {
    if (requestId === null) {
      setSelectedRequest(null);
      return;
    }

    let cancelled = false;

    const fetchExactRequest = async () => {
      try {
        const response = await api.stats.requests({ limit: 1, offset: 0, request_id: requestId });
        if (!cancelled) {
          setSelectedRequest(response.items[0] ?? null);
        }
      } catch (error) {
        console.error("Failed to load request detail", error);
        if (!cancelled) {
          setSelectedRequest(null);
        }
      }
    };

    void fetchExactRequest();

    return () => {
      cancelled = true;
    };
  }, [requestId, revision]);

  useEffect(() => {
    if (auditId === null) {
      setSelectedAuditSummary(null);
      setSelectedAuditDetail(null);
      setAuditDetailLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAuditDetail = async () => {
      setAuditDetailLoading(true);
      try {
        const detailResponse = await api.audit.get(auditId);

        if (!cancelled) {
          setSelectedAuditDetail(detailResponse);
          const matchingSummary =
            auditRows.find((item) => item.id === auditId) ||
            ({
              connection_id: detailResponse.connection_id,
              created_at: detailResponse.created_at,
              duration_ms: detailResponse.duration_ms,
              endpoint_base_url: detailResponse.endpoint_base_url,
              endpoint_description: detailResponse.endpoint_description,
              endpoint_id: detailResponse.endpoint_id,
              id: detailResponse.id,
              is_stream: detailResponse.is_stream,
              model_id: detailResponse.model_id,
              profile_id: detailResponse.profile_id,
              provider_id: detailResponse.provider_id,
              request_body_preview: detailResponse.request_body?.slice(0, 200) ?? null,
              request_headers: detailResponse.request_headers,
              request_log_id: detailResponse.request_log_id,
              request_method: detailResponse.request_method,
              request_url: detailResponse.request_url,
              response_status: detailResponse.response_status,
            } satisfies AuditLogListItem);
          setSelectedAuditSummary(matchingSummary);
        }
      } catch (error) {
        console.error("Failed to load audit detail", error);
        if (!cancelled) {
          setSelectedAuditDetail(null);
          setSelectedAuditSummary(null);
        }
      } finally {
        if (!cancelled) {
          setAuditDetailLoading(false);
        }
      }
    };

    void fetchAuditDetail();

    return () => {
      cancelled = true;
    };
  }, [auditId, auditRows, revision]);

  const filteredRequestRows = useMemo(() => {
    let rows = requestRows.filter((log) => {
      if (search) {
        const query = search.toLowerCase();
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

      if (!matchesStatusFamily(log.status_code, statusFamily)) return false;
      const totalTokens = log.total_tokens ?? 0;
      if (tokenMin !== null && totalTokens < tokenMin) return false;
      if (tokenMax !== null && totalTokens > tokenMax) return false;
      if (pricedOnly && !log.priced_flag) return false;
      if (billableOnly && !log.billable_flag) return false;
      if (specialTokenFilter === "has_cached" && !hasSpecialTokenValue(log.cache_read_input_tokens)) return false;
      if (specialTokenFilter === "has_reasoning" && !hasSpecialTokenValue(log.reasoning_tokens)) return false;
      if (specialTokenFilter === "has_any_special" && !rowHasAnySpecialToken(log)) return false;
      if (specialTokenFilter === "missing_special" && rowHasAnySpecialToken(log)) return false;
      if (streamFilter === "stream" && !log.is_stream) return false;
      if (streamFilter === "non_stream" && log.is_stream) return false;
      if (triage === "errors_only" && log.status_code < 400) return false;
      if (triage === "unpriced_only" && log.priced_flag) return false;

      return true;
    });

    if (triage !== "none") {
      rows = [...rows].sort((left, right) => {
        if (triage === "slowest") return right.response_time_ms - left.response_time_ms;
        if (triage === "expensive") return (right.total_cost_user_currency_micros || 0) - (left.total_cost_user_currency_micros || 0);
        if (triage === "most_tokens") return (right.total_tokens || 0) - (left.total_tokens || 0);
        return 0;
      });
    }

    return rows;
  }, [
    billableOnly,
    pricedOnly,
    requestRows,
    search,
    specialTokenFilter,
    statusFamily,
    streamFilter,
    tokenMax,
    tokenMin,
    triage,
  ]);

  const filteredAuditRows = useMemo(
    () => auditRows.filter((row) => matchesStatusFamily(row.response_status, statusFamily)),
    [auditRows, statusFamily]
  );

  const metrics = useMemo(() => {
    if (filteredRequestRows.length === 0) {
      return { averageLatency: null as number | null, errorRate: null as number | null };
    }

    const totalLatency = filteredRequestRows.reduce((sum, row) => sum + row.response_time_ms, 0);
    const errorCount = filteredRequestRows.filter((row) => row.status_code >= 400).length;
    return {
      averageLatency: Math.round(totalLatency / filteredRequestRows.length),
      errorRate: (errorCount / filteredRequestRows.length) * 100,
    };
  }, [filteredRequestRows]);

  const providersById = useMemo(() => new Map(providers.map((item) => [item.id, item])), [providers]);
  const isAuditingEnabled = useMemo(() => providers.some((item) => item.audit_enabled), [providers]);

  const resetSharedPagination = () => {
    setRequestOffset(0);
    setAuditOffset(0);
  };

  const clearAllFilters = () => {
    setRange("24h");
    setProvider("all");
    setModelId("__all__");
    setConnectionId("__all__");
    setEndpointId("__all__");
    setStatusFamily("all");
    setSearch("");
    setRequestView("overview");
    setTriage("none");
    setStreamFilter("all");
    setSpecialTokenFilter("all");
    setPricedOnly(false);
    setBillableOnly(false);
    setTokenMin(null);
    setTokenMax(null);
    setTokenMinInput("");
    setTokenMaxInput("");
    setRequestLimit(DEFAULT_REQUEST_LIMIT);
    setRequestOffset(0);
    setAuditOffset(0);
  };

  const applyRequestContext = (log: RequestLogEntry) => {
    setModelId(log.model_id);
    setProvider(log.provider_type);
    setConnectionId(log.connection_id ? String(log.connection_id) : "__all__");
    setEndpointId(log.endpoint_id ? String(log.endpoint_id) : "__all__");
    setRequestOffset(0);
    setAuditOffset(0);
  };

  const openRequest = (log: RequestLogEntry) => {
    setSelectedAuditSummary(null);
    setSelectedAuditDetail(null);
    setRequestId(log.id);
    setAuditId(null);
    setDetailTab("request");
    setSelectedRequest(log);
  };

  const openAudit = (log: AuditLogListItem) => {
    setSelectedRequest(null);
    setRequestId(null);
    setAuditId(log.id);
    setDetailTab("audit");
    setSelectedAuditSummary(log);
    setSelectedAuditDetail(null);
  };

  const closeInspector = () => {
    setRequestId(null);
    setAuditId(null);
    setSelectedRequest(null);
    setSelectedAuditSummary(null);
    setSelectedAuditDetail(null);
    setDetailTab("request");
  };

  if ((requestLoading && requestRows.length === 0) || (auditLoading && auditRows.length === 0 && providers.length === 0)) {
    return (
      <div className="space-y-[var(--density-page-gap)]">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-[110px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[110px] rounded-xl" />
        <Skeleton className="h-[460px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-[var(--density-page-gap)]">
      <PageHeader
        title="Observability Logs"
        description="Investigate request telemetry and audit capture together with one dense filter set and one shared inspector."
      >
        <StatusBadge
          label={isAuditingEnabled ? "Auditing: On" : "Auditing: Off"}
          intent={isAuditingEnabled ? "success" : "muted"}
          className="text-[11px]"
        />
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Matching requests"
          value={filteredRequestRows.length.toLocaleString()}
          detail="Current page after filters"
          icon={<Logs className="h-4 w-4" />}
        />
        <MetricCard
          label="Matching audits"
          value={filteredAuditRows.length.toLocaleString()}
          detail="Current page after filters"
          icon={<FileSearch className="h-4 w-4" />}
        />
        <MetricCard
          label="Avg latency"
          value={metrics.averageLatency === null ? "-" : `${metrics.averageLatency}ms`}
          detail="Current request page"
          icon={<Clock3 className="h-4 w-4" />}
        />
        <MetricCard
          label="Error rate"
          value={metrics.errorRate === null ? "-" : `${metrics.errorRate.toFixed(1)}%`}
          detail="Current request page"
          icon={<AlertTriangle className="h-4 w-4" />}
          className={metrics.errorRate !== null && metrics.errorRate > 10 ? "[&_span.text-2xl]:text-destructive" : ""}
        />
      </div>

      <FiltersBar
        billableOnly={billableOnly}
        clearAllFilters={clearAllFilters}
        connectionId={connectionId}
        connections={connections}
        endpointId={endpointId}
        endpoints={endpoints}
        modelId={modelId}
        models={models}
        pricedOnly={pricedOnly}
        provider={provider}
        providers={providers}
        range={range}
        requestView={requestView}
        resetRequestPagination={() => setRequestOffset(0)}
        resetSharedPagination={resetSharedPagination}
        search={search}
        setBillableOnly={setBillableOnly}
        setConnectionId={setConnectionId}
        setEndpointId={setEndpointId}
        setModelId={setModelId}
        setPricedOnly={setPricedOnly}
        setProvider={setProvider}
        setRange={setRange}
        setRequestView={setRequestView}
        setSearch={setSearch}
        setSpecialTokenFilter={setSpecialTokenFilter}
        setStatusFamily={setStatusFamily}
        setStreamFilter={setStreamFilter}
        setTokenMax={setTokenMax}
        setTokenMaxInput={setTokenMaxInput}
        setTokenMin={setTokenMin}
        setTokenMinInput={setTokenMinInput}
        setTriage={setTriage}
        specialTokenFilter={specialTokenFilter}
        statusFamily={statusFamily}
        streamFilter={streamFilter}
        tokenMaxInput={tokenMaxInput}
        tokenMinInput={tokenMinInput}
        triage={triage}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Requests</h2>
            <p className="text-sm text-muted-foreground">Primary request investigation view with Prism's richer analysis columns.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => {
            clearAllFilters();
            closeInspector();
          }}>
            Reset URL state
          </Button>
        </div>
        <RequestLogsTable
          rows={filteredRequestRows}
          pageRowCount={filteredRequestRows.length}
          loading={requestLoading}
          total={requestTotal}
          limit={requestLimit}
          offset={requestOffset}
          setLimit={setRequestLimit}
          setOffset={setRequestOffset}
          view={requestView}
          allColumnsMode={requestView === "all"}
          openLogDetail={openRequest}
          clearAllFilters={clearAllFilters}
          formatTime={formatTime}
          navigateToConnection={navigateToConnection}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Audit Capture</h2>
          <p className="text-sm text-muted-foreground">Compact payload capture results sharing the same time, provider, model, connection, endpoint, and status filters.</p>
        </div>
        {auditLoading && auditRows.length === 0 ? (
          <Skeleton className="h-[320px] rounded-xl" />
        ) : (
          <AuditResultsTable
            formatTime={formatTime}
            logs={filteredAuditRows}
            offset={auditOffset}
            onSelect={(log) => {
              openAudit(log);
            }}
            providersById={providersById}
            selectedAuditId={auditId}
            setOffset={setAuditOffset}
            total={auditTotal}
          />
        )}
      </section>

      <ObservabilityInspectorSheet
        applyRequestContext={applyRequestContext}
        auditDetail={selectedAuditDetail}
        auditDetailLoading={auditDetailLoading}
        auditSummary={selectedAuditSummary}
        detailTab={detailTab}
        formatTime={formatTime}
        isAuditingEnabled={isAuditingEnabled}
        navigateToConnection={navigateToConnection}
        onClose={closeInspector}
        requestLog={selectedRequest}
        setDetailTab={setDetailTab}
      />
    </div>
  );
}
