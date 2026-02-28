import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { cn, formatProviderType, formatLabel } from "@/lib/utils";
import {
  formatPricingUnitLabel,
  isValidCurrencyCode,
  formatMoneyMicros,
} from "@/lib/costing";
import type { ModelConfig, Connection, ConnectionCreate, ConnectionUpdate, Endpoint, EndpointCreate, SpendingSummary, ModelConfigUpdate, StatsSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, TypeBadge, ValueBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SwitchController } from "@/components/SwitchController";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, MoreHorizontal, Search, Activity, Loader2, X, ChevronRight, Shield, Coins, Info, Gauge, Route } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { EmptyState } from "@/components/EmptyState";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ConnectionDerivedMetrics = {
  success_rate_24h: number | null;
  p95_latency_ms: number | null;
  five_xx_rate: number | null;
  request_count_24h: number;
  heuristic_failover_events: number;
  last_failover_like_at: string | null;
};

const get24hFromTime = (): string =>
  new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const formatLatencyForDisplay = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return "-";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}s`;
  return `${Math.round(value)}ms`;
};

const buildRequestLogsPath = (params: {
  modelId: string;
  connectionId?: number;
  outcomeFilter?: "all" | "success" | "error";
  timeRange?: "1h" | "24h" | "7d" | "all";
}): string => {
  const search = new URLSearchParams();
  search.set("model_id", params.modelId);
  search.set("time_range", params.timeRange ?? "24h");
  search.set("outcome_filter", params.outcomeFilter ?? "all");
  if (params.connectionId !== undefined) {
    search.set("connection_id", String(params.connectionId));
  }
  const query = search.toString();
  return query.length > 0 ? `/request-logs?${query}` : "/request-logs";
};
const getConnectionName = (connection: Pick<Connection, "name" | "description">): string =>
  connection.name || connection.description || "";
export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [model, setModel] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false);
  const [spending, setSpending] = useState<SpendingSummary | null>(null);
  const [spendingLoading, setSpendingLoading] = useState(false);
  const [spendingCurrencySymbol, setSpendingCurrencySymbol] = useState("$");
  const [spendingCurrencyCode, setSpendingCurrencyCode] = useState("USD");
  const [kpiSummary24h, setKpiSummary24h] = useState<StatsSummary | null>(null);
  const [kpiSpend24hMicros, setKpiSpend24hMicros] = useState<number | null>(null);
  const [metrics24hLoading, setMetrics24hLoading] = useState(false);
  
  // Connection state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [connectionSearch, setConnectionSearch] = useState("");
  const [healthCheckingIds, setHealthCheckingIds] = useState<Set<number>>(new Set());
  const [dialogTestingConnection, setDialogTestingConnection] = useState(false);
  const [dialogTestResult, setDialogTestResult] = useState<{ status: string; detail: string } | null>(null);
  const [pricingSectionOpen, setPricingSectionOpen] = useState(false);
  const [pricingValidationError, setPricingValidationError] = useState<string | null>(null);
  const [connectionMetrics24h, setConnectionMetrics24h] = useState<Map<number, ConnectionDerivedMetrics>>(new Map());
  const [focusedConnectionId, setFocusedConnectionId] = useState<number | null>(null);
  const [connectionCardRefs] = useState<Map<number, HTMLDivElement>>(new Map());
  const focusHandled = useRef(false);

  // Global endpoints for selection
  const [globalEndpoints, setGlobalEndpoints] = useState<Endpoint[]>([]);
  const [createMode, setCreateMode] = useState<"select" | "new">("select");
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("");
  
  // Forms
  const [newEndpointForm, setNewEndpointForm] = useState<EndpointCreate>({
    name: "",
    base_url: "",
    api_key: "",
  });

  const [connectionForm, setConnectionForm] = useState<ConnectionCreate>({
    priority: 0,
    name: "",
    is_active: true,
    custom_headers: null,
    pricing_enabled: false,
    pricing_unit: "PER_1M",
    pricing_currency_code: "USD",
    input_price: null,
    output_price: null,
    cached_input_price: null,
    cache_creation_price: null,
    reasoning_price: null,
    missing_special_token_price_policy: "MAP_TO_OUTPUT",
    forward_stream_options: false,
  });

  const [headerRows, setHeaderRows] = useState<{ key: string; value: string }[]>([]);

  const fetchSpending = useCallback(async (modelId: string) => {
    setSpendingLoading(true);
    try {
      const data = await api.stats.spending({
        model_id: modelId,
        group_by: "endpoint",
        preset: "all" // Get all-time spending by default for the model detail view
      });
      setSpending(data.summary);
      setSpendingCurrencySymbol(data.report_currency_symbol || "$");
      setSpendingCurrencyCode(data.report_currency_code || "USD");
    } catch (error) {
      console.error("Failed to fetch spending", error);
    } finally {
      setSpendingLoading(false);
    }
  }, []);

  const fetchModel = useCallback(async () => {
    if (!id) return;
    try {
      const [data, endpointsList] = await Promise.all([
        api.models.get(parseInt(id)),
        api.endpoints.list(),
      ]);
      setModel(data);
      setConnections(data.connections || []);
      setGlobalEndpoints(endpointsList);

      // Fetch spending data
      fetchSpending(data.model_id);
    } catch (error) {
      toast.error("Failed to fetch model details");
      console.error(error);
      navigate("/models");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, fetchSpending]);

  useEffect(() => { fetchModel(); }, [fetchModel]);

  useEffect(() => {
    if (!model || focusHandled.current) return;
    const focusId = searchParams.get("focus_connection_id");
    if (!focusId) return;
    const cid = parseInt(focusId);
    setFocusedConnectionId(cid);
    focusHandled.current = true;
    setSearchParams({}, { replace: true });
    setTimeout(() => {
      const el = connectionCardRefs.get(cid);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setFocusedConnectionId(null), 3000);
      }
    }, 200);
  }, [model, searchParams, setSearchParams, connectionCardRefs]);
  useEffect(() => {
    if (!model) return;
    let cancelled = false;

    const fetch24hMetrics = async () => {
      const fromTime = get24hFromTime();
      setMetrics24hLoading(true);

      try {
        const [summary24h, spend24h, perConnection] = await Promise.all([
          api.stats.summary({ model_id: model.model_id, from_time: fromTime }),
          api.stats.spending({
            model_id: model.model_id,
            from_time: fromTime,
            preset: "custom",
            group_by: "none",
          }),
          Promise.all(
            connections.map(async (conn) => {
              const [connectionSummary, recentLogs] = await Promise.all([
                api.stats.summary({
                  model_id: model.model_id,
                  connection_id: conn.id,
                  from_time: fromTime,
                }),
                api.stats.requests({
                  model_id: model.model_id,
                  connection_id: conn.id,
                  from_time: fromTime,
                  limit: 200,
                }),
              ]);

              const logs = recentLogs.items;
              const fiveXxCount = logs.filter((row) => row.status_code >= 500).length;
              const sampledCount = logs.length;
              const latestFailoverLike = logs
                .filter((row) => row.status_code >= 500)
                .sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]?.created_at ?? null;

              return {
                connectionId: conn.id,
                successRate24h: connectionSummary.success_rate,
                p95LatencyMs: connectionSummary.p95_response_time_ms,
                requestCount24h: connectionSummary.total_requests,
                fiveXxRate:
                  sampledCount > 0 ? (fiveXxCount / sampledCount) * 100 : null,
                heuristicFailoverEvents: fiveXxCount,
                lastFailoverLikeAt: latestFailoverLike,
              };
            })
          ),
        ]);

        if (cancelled) return;

        const nextConnectionMetrics = new Map<number, ConnectionDerivedMetrics>();
        for (const row of perConnection) {
          nextConnectionMetrics.set(row.connectionId, {
            success_rate_24h: row.successRate24h,
            p95_latency_ms: row.p95LatencyMs,
            five_xx_rate: row.fiveXxRate,
            request_count_24h: row.requestCount24h,
            heuristic_failover_events: row.heuristicFailoverEvents,
            last_failover_like_at: row.lastFailoverLikeAt,
          });
        }

        setConnectionMetrics24h(nextConnectionMetrics);
        setKpiSummary24h(summary24h);
        setKpiSpend24hMicros(spend24h.summary.total_cost_micros);
      } catch (error) {
        console.error("Failed to fetch 24h model metrics", error);
      } finally {
        if (!cancelled) {
          setMetrics24hLoading(false);
        }
      }
    };

    fetch24hMetrics();

    return () => {
      cancelled = true;
    };
  }, [model, connections]);

  const modelKpis = useMemo(() => {
    return {
      successRate: kpiSummary24h?.success_rate ?? null,
      p95LatencyMs: kpiSummary24h?.p95_response_time_ms ?? null,
      requestCount24h: kpiSummary24h?.total_requests ?? 0,
      spend24hMicros: kpiSpend24hMicros,
    };
  }, [kpiSummary24h, kpiSpend24hMicros]);

  const normalizeOptionalDecimal = (value: string | null | undefined): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const isNonNegativeDecimal = (value: string): boolean => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
  };

  const validatePricingForm = (): string | null => {
    if (!connectionForm.pricing_enabled) {
      return null;
    }

    const currency = connectionForm.pricing_currency_code?.trim().toUpperCase() || "";
    if (!isValidCurrencyCode(currency)) {
      return "Pricing currency must be a valid 3-letter code (for example, USD).";
    }
    if (!connectionForm.pricing_unit) {
      return "Pricing unit is required when pricing is enabled.";
    }

    const decimalFields = [
      ["Input price", connectionForm.input_price],
      ["Output price", connectionForm.output_price],
      ["Cached input price", connectionForm.cached_input_price],
      ["Cache creation price", connectionForm.cache_creation_price],
      ["Reasoning price", connectionForm.reasoning_price],
    ] as const;

    for (const [label, fieldValue] of decimalFields) {
      const normalized = normalizeOptionalDecimal(fieldValue);
      if (normalized && !isNonNegativeDecimal(normalized)) {
        return `${label} must be a non-negative decimal value.`;
      }
    }

    return null;
  };

  const openConnectionDialog = (connection?: Connection) => {
    if (connection) {
      setEditingConnection(connection);
      const headers = connection.custom_headers
        ? Object.entries(connection.custom_headers).map(([key, value]) => ({ key, value }))
        : [];
      setHeaderRows(headers);
      setConnectionForm({
        endpoint_id: connection.endpoint_id,
        priority: connection.priority,
        name: getConnectionName(connection),
        is_active: connection.is_active,
        custom_headers: connection.custom_headers,
        pricing_enabled: connection.pricing_enabled,
        pricing_unit: connection.pricing_unit ?? "PER_1M",
        pricing_currency_code: connection.pricing_currency_code || "USD",
        input_price: connection.input_price,
        output_price: connection.output_price,
        cached_input_price: connection.cached_input_price,
        cache_creation_price: connection.cache_creation_price,
        reasoning_price: connection.reasoning_price,
        missing_special_token_price_policy: connection.missing_special_token_price_policy,
        forward_stream_options: connection.forward_stream_options,
      });
      setPricingSectionOpen(connection.pricing_enabled);
      // When editing, we don't use createMode or newEndpointForm
      setCreateMode("select");
      setSelectedEndpointId(String(connection.endpoint_id));
    } else {
      setEditingConnection(null);
      setHeaderRows([]);
      setConnectionForm({
        priority: 0,
        name: "",
        is_active: true,
        custom_headers: null,
        pricing_enabled: false,
        pricing_unit: "PER_1M",
        pricing_currency_code: "USD",
        input_price: null,
        output_price: null,
        cached_input_price: null,
        cache_creation_price: null,
        reasoning_price: null,
        missing_special_token_price_policy: "MAP_TO_OUTPUT",
        forward_stream_options: false,
      });
      setNewEndpointForm({
        name: "",
        base_url: "",
        api_key: "",
      });
      setCreateMode("select");
      setSelectedEndpointId("");
      setPricingSectionOpen(false);
    }
    setPricingValidationError(null);
    setDialogTestResult(null);
    setIsConnectionDialogOpen(true);
  };

  const handleConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customHeaders = headerRows.length > 0
      ? Object.fromEntries(headerRows.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value]))
      : null;

    const pricingError = validatePricingForm();
    if (pricingError) {
      setPricingValidationError(pricingError);
      toast.error(pricingError);
      return;
    }

    setPricingValidationError(null);

    const payload: ConnectionCreate = {
      ...connectionForm,
      custom_headers: customHeaders,
      pricing_currency_code: connectionForm.pricing_currency_code
        ? connectionForm.pricing_currency_code.trim().toUpperCase()
        : null,
      input_price: normalizeOptionalDecimal(connectionForm.input_price),
      output_price: normalizeOptionalDecimal(connectionForm.output_price),
      cached_input_price: normalizeOptionalDecimal(connectionForm.cached_input_price),
      cache_creation_price: normalizeOptionalDecimal(connectionForm.cache_creation_price),
      reasoning_price: normalizeOptionalDecimal(connectionForm.reasoning_price),
    };

    if (!editingConnection) {
      if (createMode === "select") {
        if (!selectedEndpointId) {
          toast.error("Please select an endpoint");
          return;
        }
        payload.endpoint_id = parseInt(selectedEndpointId);
      } else {
        if (!newEndpointForm.name || !newEndpointForm.base_url || !newEndpointForm.api_key) {
          toast.error("Please fill in all endpoint fields");
          return;
        }
        payload.endpoint_create = newEndpointForm;
      }
    }

    try {
      if (editingConnection) {
        const updateData: ConnectionUpdate = { ...payload };
        await api.connections.update(editingConnection.id, updateData);
        toast.success("Connection updated");
      } else {
        await api.connections.create(parseInt(id!), payload);
        toast.success("Connection created");
      }
      setIsConnectionDialogOpen(false);
      fetchModel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save connection");
    }
  };

  const handleDeleteConnection = async (connectionId: number) => {
    try {
      await api.connections.delete(connectionId);
      toast.success("Connection deleted");
      fetchModel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete connection");
    }
  };

  const handleHealthCheck = async (connectionId: number) => {
    setHealthCheckingIds(prev => new Set(prev).add(connectionId));
    try {
      const result = await api.connections.healthCheck(connectionId);
      toast.success(`Health: ${result.health_status} (${result.response_time_ms}ms)`);
      fetchModel();
    } catch {
      toast.error("Health check failed");
    } finally {
      setHealthCheckingIds(prev => { const s = new Set(prev); s.delete(connectionId); return s; });
    }
  };

  const handleDialogTestConnection = async () => {
    if (!editingConnection) return;
    setDialogTestingConnection(true);
    setDialogTestResult(null);
    try {
      const result = await api.connections.healthCheck(editingConnection.id);
      setDialogTestResult({ status: result.health_status, detail: result.detail });
    } catch {
      setDialogTestResult({ status: "error", detail: "Connection test failed" });
    } finally {
      setDialogTestingConnection(false);
    }
  };

  const handleToggleActive = async (connection: Connection) => {
    try {
      await api.connections.update(connection.id, { is_active: !connection.is_active });
      fetchModel();
    } catch {
      toast.error("Failed to toggle connection");
    }
  };

  const handleEditModelSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!model) return;
    
    const formData = new FormData(e.currentTarget);
    const updateData: ModelConfigUpdate = {
      display_name: formData.get("display_name") as string || null,
      model_id: formData.get("model_id") as string,
      redirect_to: model.model_type === "proxy" ? (formData.get("redirect_to") as string || null) : null,
    };

    try {
      await api.models.update(model.id, updateData);
      toast.success("Model updated");
      setIsEditModelDialogOpen(false);
      fetchModel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update model");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!model) return null;

  const filteredConnections = [...(connectionSearch
    ? connections.filter(c =>
        (getConnectionName(c)).toLowerCase().includes(connectionSearch.toLowerCase()) ||
        (c.endpoint?.name || "").toLowerCase().includes(connectionSearch.toLowerCase()) ||
        (c.endpoint?.base_url || "").toLowerCase().includes(connectionSearch.toLowerCase())
      )
    : connections
  )].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/models")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {model.display_name || model.model_id}
            </h1>
            <TypeBadge
              label={model.model_type}
              intent={model.model_type === "proxy" ? "accent" : "info"}
            />
            <StatusBadge
              label={model.is_enabled ? "Enabled" : "Disabled"}
              intent={model.is_enabled ? "success" : "muted"}
            />
          </div>
          {model.display_name && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{model.model_id}</p>
          )}
        </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIsEditModelDialogOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModelDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Model
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Configuration</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Provider</p>
                <div className="flex items-center gap-2">
                  <ProviderIcon providerType={model.provider.provider_type} size={14} />
                  <span className="text-sm font-medium">{formatProviderType(model.provider.provider_type)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {model.model_type === "proxy" ? "Redirects To" : "Load Balancing"}
                </p>
                <span className="text-sm font-medium">
                  {model.model_type === "proxy" ? (
                    <span className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs">{model.redirect_to}</span>
                    </span>
                  ) : (
                    formatLabel(model.lb_strategy)
                  )}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recovery Policy</p>
                <span className="text-sm font-medium">
                  {model.model_type === "native" && model.lb_strategy === "failover" ? (
                    model.failover_recovery_enabled ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Enabled ({model.failover_recovery_cooldown_seconds}s)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <span className="text-sm font-medium">
                  {new Date(model.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Cost Overview
            </h3>
            {spendingLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : spending ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Cost ({spendingCurrencyCode})</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatMoneyMicros(
                      spending.total_cost_micros,
                      spendingCurrencySymbol,
                      spendingCurrencyCode,
                      2,
                      6
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Requests</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {spending.successful_request_count.toLocaleString()} successful
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {spending.total_tokens.toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg Cost / Request</span>
                    <span className="font-medium font-mono">
                      {formatMoneyMicros(
                        spending.avg_cost_per_successful_request_micros,
                        spendingCurrencySymbol,
                        spendingCurrencyCode,
                        4,
                        6
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground">
                <p className="text-sm">No cost data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Model KPIs (24h)
          </h3>
          {metrics24hLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">Success rate (24h)</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.successRate === null ? "-" : `${modelKpis.successRate.toFixed(1)}%`}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">P95 latency (24h)</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatLatencyForDisplay(modelKpis.p95LatencyMs)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">Requests (24h)</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.requestCount24h.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[11px] text-muted-foreground">Spend (24h, {spendingCurrencyCode})</p>
                <p className="text-lg font-semibold tabular-nums">
                  {modelKpis.spend24hMicros === null
                    ? "-"
                    : formatMoneyMicros(
                        modelKpis.spend24hMicros,
                        spendingCurrencySymbol,
                        spendingCurrencyCode,
                        2,
                        6
                      )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">
          Connections
          <span className="ml-2 text-xs font-normal text-muted-foreground">({connections.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          {connections.length > 3 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter connections..."
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
          )}
          <Button size="sm" onClick={() => openConnectionDialog()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Connection
          </Button>
        </div>
      </div>

      {filteredConnections.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title={connectionSearch ? "No connections match your filter" : "No connections configured"}
          description={connectionSearch ? "Try a different search term" : "Add a connection to start routing requests"}
          action={!connectionSearch ? (
            <Button size="sm" onClick={() => openConnectionDialog()}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Connection
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filteredConnections.map((conn) => {
            const metrics24h = connectionMetrics24h.get(conn.id);
            const isChecking = healthCheckingIds.has(conn.id);
            const isFocused = focusedConnectionId === conn.id;
            const successRate = metrics24h?.success_rate_24h ?? null;
            const endpoint = conn.endpoint;
            const maskedKey = endpoint?.api_key && endpoint.api_key.length > 8
              ? `${endpoint.api_key.slice(0, 4)}••••••${endpoint.api_key.slice(-4)}`
              : "••••••";

            return (
              <div
                key={conn.id}
                ref={(el) => { if (el) connectionCardRefs.get(conn.id); }}
                className={cn(
                  "rounded-lg border p-4 transition-all duration-300",
                  isFocused && "ring-2 ring-primary/50 bg-primary/5",
                  !isFocused && "hover:border-border/80"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "inline-block h-2 w-2 rounded-full shrink-0",
                        conn.health_status === "healthy" ? "bg-emerald-500" :
                        conn.health_status === "unhealthy" ? "bg-red-500" : "bg-gray-400"
                      )} />
                      <span className="text-sm font-medium truncate">
                        {getConnectionName(conn) || endpoint?.name || `Connection #${conn.id}`}
                      </span>
                      <ValueBadge
                        label={`P${conn.priority}`}
                        intent={conn.priority >= 10 ? "warning" : conn.priority >= 1 ? "info" : "muted"}
                      />
                      <StatusBadge
                        label={conn.pricing_enabled ? "Pricing On" : "Pricing Off"}
                        intent={conn.pricing_enabled ? "success" : "muted"}
                      />
                      {conn.pricing_enabled && (
                        <div className="flex items-center gap-1">
                          {conn.pricing_unit && (
                            <ValueBadge
                              label={formatPricingUnitLabel(conn.pricing_unit)}
                              intent="info"
                            />
                          )}
                          {conn.pricing_currency_code && (
                            <ValueBadge label={conn.pricing_currency_code} intent="accent" />
                          )}
                        </div>
                      )}
                      {!conn.is_active && (
                        <StatusBadge label="Inactive" intent="muted" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono break-all">{endpoint?.base_url}</p>
                    {conn.pricing_enabled ? (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Input:</span>
                          <span className="font-mono font-medium">{conn.input_price ?? "0"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Output:</span>
                          <span className="font-mono font-medium">{conn.output_price ?? "0"}</span>
                        </div>
                        {(conn.cached_input_price || conn.cache_creation_price || conn.reasoning_price) && (
                          <div className="pt-1 mt-1 border-t border-border/50 grid grid-cols-3 gap-2">
                            {conn.cached_input_price && (
                              <div>
                                <span className="block text-[10px] text-muted-foreground">Cached</span>
                                <span className="font-mono">{conn.cached_input_price}</span>
                              </div>
                            )}
                            {conn.cache_creation_price && (
                              <div>
                                <span className="block text-[10px] text-muted-foreground">Create</span>
                                <span className="font-mono">{conn.cache_creation_price}</span>
                              </div>
                            )}
                            {conn.reasoning_price && (
                              <div>
                                <span className="block text-[10px] text-muted-foreground">Reasoning</span>
                                <span className="font-mono">{conn.reasoning_price}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Key: {maskedKey}</span>
                      {conn.last_health_check && (
                        <span>Checked {new Date(conn.last_health_check).toLocaleTimeString()}</span>
                      )}
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span>Success rate (24h)</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5" />
                            </TooltipTrigger>
                            <TooltipContent className="pointer-events-none">
                              <p className="text-xs">
                                Success rate = successful requests / total requests for this connection in the last 24 hours.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-[10px]">n={(metrics24h?.request_count_24h ?? 0).toLocaleString()}</span>
                      </div>
                      <Link
                        to={buildRequestLogsPath({
                          modelId: model.model_id,
                          connectionId: conn.id,
                          timeRange: "24h",
                          outcomeFilter: "all",
                        })}
                        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-center gap-2 pt-0.5 hover:opacity-90">
                          <Progress
                            value={successRate ?? 0}
                            className={cn(
                              "h-1.5",
                              successRate === null
                                ? "[&>[data-slot=progress-indicator]]:bg-muted-foreground/40"
                                : successRate >= 95
                                  ? "[&>[data-slot=progress-indicator]]:bg-emerald-500"
                                  : successRate >= 80
                                    ? "[&>[data-slot=progress-indicator]]:bg-amber-500"
                                    : "[&>[data-slot=progress-indicator]]:bg-red-500"
                            )}
                          />
                          <span className={cn(
                            "text-[10px] font-medium tabular-nums shrink-0",
                            successRate === null
                              ? "text-muted-foreground"
                              : successRate >= 95
                                ? "text-emerald-600 dark:text-emerald-400"
                                : successRate >= 80
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-600 dark:text-red-400"
                          )}>
                            {successRate === null ? "-" : `${successRate.toFixed(1)}%`}
                          </span>
                        </div>
                      </Link>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded border px-2 py-1.5">
                          <p className="text-muted-foreground">P95 latency (24h)</p>
                          <p className="font-medium tabular-nums">
                            {formatLatencyForDisplay(metrics24h?.p95_latency_ms ?? null)}
                          </p>
                        </div>
                        <div className="rounded border px-2 py-1.5">
                          <p className="text-muted-foreground">5xx rate (sampled)</p>
                          <p className="font-medium tabular-nums">
                            {metrics24h?.five_xx_rate === null ||
                            metrics24h?.five_xx_rate === undefined
                              ? "-"
                              : `${metrics24h.five_xx_rate.toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                      <div className="rounded border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Route className="h-3.5 w-3.5" />
                          Failover-like signals (derived from 5xx)
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <span>
                            Events: {metrics24h?.heuristic_failover_events ?? 0}
                          </span>
                          <span>
                            Last: {metrics24h?.last_failover_like_at
                              ? new Date(metrics24h.last_failover_like_at).toLocaleString()
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={conn.is_active}
                      onCheckedChange={() => handleToggleActive(conn)}
                      className="scale-90 data-[state=checked]:bg-emerald-500"
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openConnectionDialog(conn)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleHealthCheck(conn.id)} disabled={isChecking}>
                          {isChecking ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-2 h-3.5 w-3.5" />}
                          Health Check
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteConnection(conn.id)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isConnectionDialogOpen} onOpenChange={setIsConnectionDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConnection ? "Edit Connection" : "Add Connection"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnectionSubmit} className="space-y-4">
            {!editingConnection && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <div className="space-y-2">
                  <Label>Endpoint Source</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="mode-select"
                        name="createMode"
                        checked={createMode === "select"}
                        onChange={() => setCreateMode("select")}
                        className="text-primary"
                      />
                      <Label htmlFor="mode-select" className="font-normal cursor-pointer">Select Existing</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="mode-new"
                        name="createMode"
                        checked={createMode === "new"}
                        onChange={() => setCreateMode("new")}
                        className="text-primary"
                      />
                      <Label htmlFor="mode-new" className="font-normal cursor-pointer">Create New</Label>
                    </div>
                  </div>
                </div>

                {createMode === "select" ? (
                  <div className="space-y-2">
                    <Label>Select Endpoint</Label>
                    <Select value={selectedEndpointId} onValueChange={setSelectedEndpointId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an endpoint..." />
                      </SelectTrigger>
                      <SelectContent>
                        {globalEndpoints.map((ep) => (
                          <SelectItem key={ep.id} value={String(ep.id)}>
                            {ep.name} ({ep.base_url})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {globalEndpoints.length === 0 && (
                      <p className="text-xs text-muted-foreground">No global endpoints found.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="e.g. OpenAI Primary"
                        value={newEndpointForm.name}
                        onChange={(e) => setNewEndpointForm({ ...newEndpointForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base URL</Label>
                      <Input
                        placeholder="https://api.openai.com/v1"
                        value={newEndpointForm.base_url}
                        onChange={(e) => setNewEndpointForm({ ...newEndpointForm, base_url: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={newEndpointForm.api_key}
                        onChange={(e) => setNewEndpointForm({ ...newEndpointForm, api_key: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conn-priority">Priority</Label>
                <Input
                  id="conn-priority"
                  type="number"
                  min={0}
                  value={connectionForm.priority}
                  onChange={(e) => setConnectionForm({ ...connectionForm, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conn-name">Name (Optional)</Label>
                <Input
                  id="conn-name"
                  placeholder="Connection display name"
                  value={connectionForm.name || ""}
                  onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
                />
              </div>
            </div>

            <SwitchController
              label="Active"
              description="Include in load balancing"
              checked={connectionForm.is_active ?? true}
              onCheckedChange={(checked) => setConnectionForm({ ...connectionForm, is_active: checked })}
            />
            <SwitchController
              label="Forward stream_options"
              description="Pass stream_options to the upstream provider instead of stripping it"
              checked={connectionForm.forward_stream_options ?? false}
              onCheckedChange={(checked) => setConnectionForm({ ...connectionForm, forward_stream_options: checked })}
            />

            <Collapsible
              open={pricingSectionOpen}
              onOpenChange={setPricingSectionOpen}
              className="rounded-lg border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-sm font-medium">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    Token Pricing
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure per-connection token cost tracking.
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    {pricingSectionOpen ? "Hide" : "Configure"}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-3 pt-3">
                <SwitchController
                  label="Enable pricing"
                  description="When disabled, requests on this connection are tracked as unpriced."
                  checked={connectionForm.pricing_enabled ?? false}
                  onCheckedChange={(checked) =>
                    setConnectionForm({
                      ...connectionForm,
                      pricing_enabled: checked,
                      ...(checked && {
                        pricing_unit: connectionForm.pricing_unit ?? "PER_1M",
                        pricing_currency_code: connectionForm.pricing_currency_code || "USD",
                      }),
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing-unit">Pricing Unit</Label>
                    <Select
                      value={connectionForm.pricing_unit ?? "PER_1M"}
                      onValueChange={(value) =>
                        setConnectionForm({
                          ...connectionForm,
                          pricing_unit: value as "PER_1K" | "PER_1M",
                        })
                      }
                      disabled={!connectionForm.pricing_enabled}
                    >
                      <SelectTrigger id="pricing-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PER_1K">Per 1K tokens</SelectItem>
                        <SelectItem value="PER_1M">Per 1M tokens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricing-currency">Currency Code</Label>
                    <Input
                      id="pricing-currency"
                      placeholder="USD"
                      maxLength={3}
                      value={connectionForm.pricing_currency_code ?? ""}
                      onChange={(e) =>
                        setConnectionForm({
                          ...connectionForm,
                          pricing_currency_code: e.target.value.toUpperCase(),
                        })
                      }
                      disabled={!connectionForm.pricing_enabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-price">Input Price</Label>
                    <Input
                      id="input-price"
                      placeholder="0"
                      inputMode="decimal"
                      value={connectionForm.input_price ?? ""}
                      onChange={(e) =>
                        setConnectionForm({ ...connectionForm, input_price: e.target.value })
                      }
                      disabled={!connectionForm.pricing_enabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="output-price">Output Price</Label>
                    <Input
                      id="output-price"
                      placeholder="0"
                      inputMode="decimal"
                      value={connectionForm.output_price ?? ""}
                      onChange={(e) =>
                        setConnectionForm({ ...connectionForm, output_price: e.target.value })
                      }
                      disabled={!connectionForm.pricing_enabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cached-price">Cached Input Price</Label>
                    <Input
                      id="cached-price"
                      placeholder="Optional"
                      inputMode="decimal"
                      value={connectionForm.cached_input_price ?? ""}
                      onChange={(e) =>
                        setConnectionForm({ ...connectionForm, cached_input_price: e.target.value })
                      }
                      disabled={!connectionForm.pricing_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cache-create-price">Cache Creation Price</Label>
                    <Input
                      id="cache-create-price"
                      placeholder="Optional"
                      inputMode="decimal"
                      value={connectionForm.cache_creation_price ?? ""}
                      onChange={(e) =>
                        setConnectionForm({ ...connectionForm, cache_creation_price: e.target.value })
                      }
                      disabled={!connectionForm.pricing_enabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reasoning-price">Reasoning Price</Label>
                    <Input
                      id="reasoning-price"
                      placeholder="Optional"
                      inputMode="decimal"
                      value={connectionForm.reasoning_price ?? ""}
                      onChange={(e) =>
                        setConnectionForm({ ...connectionForm, reasoning_price: e.target.value })
                      }
                      disabled={!connectionForm.pricing_enabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="missing-policy">Missing Special Token Policy</Label>
                  <Select
                    value={connectionForm.missing_special_token_price_policy ?? "MAP_TO_OUTPUT"}
                    onValueChange={(value) =>
                      setConnectionForm({
                        ...connectionForm,
                        missing_special_token_price_policy: value as "MAP_TO_OUTPUT" | "ZERO_COST",
                      })
                    }
                    disabled={!connectionForm.pricing_enabled}
                  >
                    <SelectTrigger id="missing-policy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAP_TO_OUTPUT">Map to Output (Default)</SelectItem>
                      <SelectItem value="ZERO_COST">Zero Cost</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    How to price special tokens (reasoning, cache) if their specific price is not set.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Custom Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Headers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHeaderRows([...headerRows, { key: "", value: "" }])}
                >
                  <Plus className="mr-1.5 h-3 w-3" />
                  Add Header
                </Button>
              </div>
              {headerRows.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No custom headers configured.</p>
              )}
              <div className="space-y-2">
                {headerRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Header Key"
                      value={row.key}
                      onChange={(e) => {
                        const newRows = [...headerRows];
                        newRows[index].key = e.target.value;
                        setHeaderRows(newRows);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) => {
                        const newRows = [...headerRows];
                        newRows[index].value = e.target.value;
                        setHeaderRows(newRows);
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newRows = [...headerRows];
                        newRows.splice(index, 1);
                        setHeaderRows(newRows);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {pricingValidationError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {pricingValidationError}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {editingConnection && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogTestConnection}
                  disabled={dialogTestingConnection}
                >
                  {dialogTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={() => setIsConnectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Connection</Button>
            </DialogFooter>
          </form>

          {dialogTestResult && (
            <div className={cn(
              "mt-4 rounded-md p-3 text-sm",
              dialogTestResult.status === "healthy" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" :
              "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200"
            )}>
              <p className="font-medium">
                {dialogTestResult.status === "healthy" ? "Connection Healthy" : "Connection Unhealthy"}
              </p>
              <p className="mt-1 text-xs opacity-90">{dialogTestResult.detail}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isEditModelDialogOpen} onOpenChange={setIsEditModelDialogOpen}>
        <DialogContent>
          {model && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Model</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditModelSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-display-name">Display Name</Label>
                  <Input
                    id="edit-display-name"
                    name="display_name"
                    defaultValue={model.display_name || ""}
                    placeholder="Friendly name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-model-id">Model ID</Label>
                  <Input
                    id="edit-model-id"
                    name="model_id"
                    defaultValue={model.model_id}
                    required
                  />
                </div>
                {model.model_type === "proxy" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-redirect-to">Redirect To</Label>
                    <Input
                      id="edit-redirect-to"
                      name="redirect_to"
                      defaultValue={model.redirect_to || ""}
                      placeholder="Target model ID"
                    />
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditModelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
