import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { cn, formatProviderType, formatLabel } from "@/lib/utils";
import { formatMoneyMicros } from "@/lib/costing";
import type {
  ModelConfig,
  ModelConfigListItem,
  Connection,
  ConnectionCreate,
  ConnectionUpdate,
  Endpoint,
  EndpointCreate,
  SpendingSummary,
  ModelConfigUpdate,
  StatsSummary,
  HealthCheckResponse,
  PricingTemplate,
} from "@/lib/types";
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
import { useProfileContext } from "@/context/ProfileContext";
import { useTimezone } from "@/hooks/useTimezone";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  if (params.timeRange) {
    search.set("time_range", params.timeRange);
  }
  if (params.outcomeFilter) {
    search.set("outcome_filter", params.outcomeFilter);
  }
  if (params.connectionId !== undefined) {
    search.set("connection_id", String(params.connectionId));
  }
  const query = search.toString();
  return query.length > 0 ? `/request-logs?${query}` : "/request-logs";
};
const getConnectionName = (
  connection: Pick<Connection, "id" | "name" | "endpoint">
): string => {
  const explicitName = connection.name?.trim();
  if (explicitName && explicitName.length > 0) {
    return explicitName;
  }
  const endpointName = connection.endpoint?.name?.trim();
  if (endpointName && endpointName.length > 0) {
    return endpointName;
  }
  return `Connection ${connection.id}`;
};
export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { revision } = useProfileContext();
  const { format: formatTime } = useTimezone();
  const [searchParams, setSearchParams] = useSearchParams();
  const [model, setModel] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModelDialogOpen, setIsEditModelDialogOpen] = useState(false);
  const [allModels, setAllModels] = useState<ModelConfigListItem[]>([]);
  const [editRedirectTo, setEditRedirectTo] = useState("");
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
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
  const [connectionMetrics24h, setConnectionMetrics24h] = useState<Map<number, ConnectionDerivedMetrics>>(new Map());
  const [focusedConnectionId, setFocusedConnectionId] = useState<number | null>(null);
  const [connectionCardRefs] = useState<Map<number, HTMLDivElement>>(new Map());
  const focusTimeoutRef = useRef<number | null>(null);
  const autoHealthCheckKeyRef = useRef<string | null>(null);

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
    pricing_template_id: null,
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
      setSpendingCurrencySymbol(data.report_currency_symbol);
      setSpendingCurrencyCode(data.report_currency_code);
    } catch (error) {
      console.error("Failed to fetch spending", error);
    } finally {
      setSpendingLoading(false);
    }
  }, []);

  const fetchModel = useCallback(async () => {
    if (!id) return;
    try {
      const [data, endpointsList, modelsList, pricingTemplatesList] = await Promise.all([
        api.models.get(parseInt(id)),
        api.endpoints.list(),
        api.models.list(),
        api.pricingTemplates.list(),
      ]);
      setModel(data);
      setConnections(data.connections || []);
      setGlobalEndpoints(endpointsList);
      setAllModels(modelsList);
      setPricingTemplates(pricingTemplatesList);

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

  const runHealthChecks = useCallback(async (connectionIds: number[]) => {
    if (connectionIds.length === 0) {
      return { successfulChecks: new Map<number, HealthCheckResponse>(), failedCount: 0 };
    }

    setHealthCheckingIds((prev) => {
      const next = new Set(prev);
      connectionIds.forEach((connectionId) => next.add(connectionId));
      return next;
    });

    const results = await Promise.allSettled(
      connectionIds.map(async (connectionId) => ({
        connectionId,
        response: await api.connections.healthCheck(connectionId),
      }))
    );

    const successfulChecks = new Map<number, HealthCheckResponse>();
    let failedCount = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        successfulChecks.set(result.value.connectionId, result.value.response);
      } else {
        failedCount += 1;
      }
    }

    setConnections((prevConnections) =>
      prevConnections.map((connection) => {
        const check = successfulChecks.get(connection.id);
        if (!check) return connection;

        return {
          ...connection,
          health_status: check.health_status,
          health_detail: check.detail,
          last_health_check: check.checked_at,
        };
      })
    );

    setHealthCheckingIds((prev) => {
      const next = new Set(prev);
      connectionIds.forEach((connectionId) => next.delete(connectionId));
      return next;
    });

    return { successfulChecks, failedCount };
  }, []);

  useEffect(() => { fetchModel(); }, [fetchModel, revision]);

  useEffect(() => {
    if (!isEditModelDialogOpen || !model || model.model_type !== "proxy") return;
    setEditRedirectTo(model.redirect_to || "");
  }, [isEditModelDialogOpen, model]);

  useEffect(() => {
    if (!model) return;
    const focusId = searchParams.get("focus_connection_id");
    if (!focusId) return;
    const cid = Number.parseInt(focusId, 10);
    if (!Number.isFinite(cid)) return;

    setFocusedConnectionId(cid);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("focus_connection_id");
    setSearchParams(nextSearchParams, { replace: true });

    let cancelled = false;
    let animationFrameId: number | null = null;
    let attempts = 0;

    const focusConnectionCard = () => {
      if (cancelled) return;

      const el = connectionCardRefs.get(cid);
      if (!el) {
        attempts += 1;
        if (attempts >= 30) {
          setFocusedConnectionId(null);
          return;
        }
        animationFrameId = window.requestAnimationFrame(focusConnectionCard);
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });

      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = window.setTimeout(() => {
        setFocusedConnectionId(null);
        focusTimeoutRef.current = null;
      }, 3000);
    };

    animationFrameId = window.requestAnimationFrame(focusConnectionCard);

    return () => {
      cancelled = true;
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (focusTimeoutRef.current !== null) {
        window.clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
    };
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
  }, [model, connections, revision]);

  useEffect(() => {
    autoHealthCheckKeyRef.current = null;
  }, [id, revision]);

  useEffect(() => {
    if (!id || loading) {
      return;
    }

    const connectionIds = [...connections]
      .map((connection) => connection.id)
      .sort((a, b) => a - b);
    if (connectionIds.length === 0) {
      return;
    }

    const endpointIdsHash = connectionIds.join(",");
    const runKey = `${id}:${revision}:${endpointIdsHash}`;
    if (autoHealthCheckKeyRef.current === runKey) {
      return;
    }
    autoHealthCheckKeyRef.current = runKey;

    let cancelled = false;

    const runAutoHealthChecks = async () => {
      const { failedCount } = await runHealthChecks(connectionIds);
      if (cancelled) {
        return;
      }
      if (failedCount > 0) {
        toast.warning(
          `Auto health check could not verify ${failedCount} connection${failedCount === 1 ? "" : "s"}.`
        );
      }
    };

    runAutoHealthChecks();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    revision,
    loading,
    connections,
    runHealthChecks,
  ]);

  const modelKpis = useMemo(() => {
    return {
      successRate: kpiSummary24h?.success_rate ?? null,
      p95LatencyMs: kpiSummary24h?.p95_response_time_ms ?? null,
      requestCount24h: kpiSummary24h?.total_requests ?? 0,
      spend24hMicros: kpiSpend24hMicros,
    };
  }, [kpiSummary24h, kpiSpend24hMicros]);

  const redirectTargetOptions = useMemo(() => {
    if (!model || model.model_type !== "proxy") return [];

    const nativeTargets = allModels
      .filter((candidate) => (
        candidate.provider_id === model.provider_id &&
        candidate.model_type === "native"
      ))
      .map((candidate) => ({
        modelId: candidate.model_id,
        label: candidate.display_name
          ? `${candidate.display_name} (${candidate.model_id})`
          : candidate.model_id,
      }));

    if (
      model.redirect_to &&
      !nativeTargets.some((target) => target.modelId === model.redirect_to)
    ) {
      return [
        { modelId: model.redirect_to, label: `${model.redirect_to} (current target)` },
        ...nativeTargets,
      ];
    }

    return nativeTargets;
  }, [allModels, model]);

  const selectedEndpoint = useMemo(() => {
    const parsedEndpointId = Number.parseInt(selectedEndpointId, 10);
    if (!Number.isFinite(parsedEndpointId)) {
      return null;
    }
    return globalEndpoints.find((endpoint) => endpoint.id === parsedEndpointId) ?? null;
  }, [globalEndpoints, selectedEndpointId]);

  const endpointSourceDefaultName = useMemo(() => {
    if (createMode === "select") {
      const selectedName = selectedEndpoint?.name?.trim();
      return selectedName && selectedName.length > 0 ? selectedName : null;
    }

    const inlineEndpointName = newEndpointForm.name.trim();
    return inlineEndpointName.length > 0 ? inlineEndpointName : null;
  }, [createMode, newEndpointForm.name, selectedEndpoint]);


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
        name: connection.name ?? "",
        is_active: connection.is_active,
        custom_headers: connection.custom_headers,
        pricing_template_id: connection.pricing_template_id,
      });
      setNewEndpointForm({
        name: "",
        base_url: "",
        api_key: "",
      });
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
        pricing_template_id: null,
      });
      setNewEndpointForm({
        name: "",
        base_url: "",
        api_key: "",
      });
      setCreateMode("select");
      setSelectedEndpointId("");
    }
    setDialogTestResult(null);
    setIsConnectionDialogOpen(true);
  };

  const handleConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customHeaders = headerRows.length > 0
      ? Object.fromEntries(headerRows.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value]))
      : null;

    const typedConnectionName = (connectionForm.name ?? "").trim();
    const resolvedConnectionName = typedConnectionName.length > 0
      ? typedConnectionName
      : (!editingConnection ? endpointSourceDefaultName : null);

    const payload: ConnectionCreate = {
      ...connectionForm,
      name: resolvedConnectionName,
      custom_headers: customHeaders,
      pricing_template_id: connectionForm.pricing_template_id,
    };

    if (createMode === "select") {
      if (!selectedEndpointId) {
        toast.error("Please select an endpoint");
        return;
      }
      payload.endpoint_id = parseInt(selectedEndpointId, 10);
      delete payload.endpoint_create;
    } else {
      if (!newEndpointForm.name || !newEndpointForm.base_url || !newEndpointForm.api_key) {
        toast.error("Please fill in all endpoint fields");
        return;
      }
      payload.endpoint_create = newEndpointForm;
      delete payload.endpoint_id;
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
    const { successfulChecks, failedCount } = await runHealthChecks([connectionId]);
    const result = successfulChecks.get(connectionId);

    if (result) {
      toast.success(`Health: ${result.health_status} (${result.response_time_ms}ms)`);
    }
    if (failedCount > 0) {
      toast.error("Health check failed");
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
      redirect_to: model.model_type === "proxy" ? (editRedirectTo || null) : null,
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
      <div className="space-y-[var(--density-page-gap)]">
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
    <div className="space-y-[var(--density-page-gap)] pb-2">
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="relative flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-md" onClick={() => navigate("/models")}>
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
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              {model.display_name ? model.model_id : "Model configuration and connection routing"}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Edit Model"
            onClick={() => setIsEditModelDialogOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
                  {formatTime(model.created_at, { year: "numeric", month: "numeric", day: "numeric" })}
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

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">
            Connections
            <span className="ml-2 text-xs font-normal text-muted-foreground">({connections.length})</span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Health checks run automatically when this page opens. Use manual check for spot validation.
          </p>
        </div>
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
        <div className="space-y-3">
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
                ref={(el) => {
                  if (el) {
                    connectionCardRefs.set(conn.id, el);
                  } else {
                    connectionCardRefs.delete(conn.id);
                  }
                }}
                tabIndex={-1}
                className={cn(
                  "rounded-xl border bg-card p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isFocused && "ring-2 ring-primary/40 border-primary/30 bg-muted/20",
                  !isFocused && "hover:border-border"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "inline-flex h-2.5 w-2.5 rounded-full shrink-0",
                        isChecking
                          ? "animate-pulse bg-primary/70"
                          : conn.health_status === "healthy"
                            ? "bg-emerald-500"
                            : conn.health_status === "unhealthy"
                              ? "bg-destructive"
                              : "bg-muted-foreground/50"
                      )} />
                      <span className="text-sm font-medium truncate">
                        {getConnectionName(conn)}
                      </span>
                      <StatusBadge
                        label={
                          isChecking
                            ? "Checking"
                            : conn.health_status === "healthy"
                              ? "Healthy"
                              : conn.health_status === "unhealthy"
                                ? "Unhealthy"
                                : "Unknown"
                        }
                        intent={
                          isChecking
                            ? "info"
                            : conn.health_status === "healthy"
                              ? "success"
                              : conn.health_status === "unhealthy"
                                ? "danger"
                                : "muted"
                        }
                      />
                      <ValueBadge
                        label={`P${conn.priority}`}
                        intent={conn.priority >= 10 ? "warning" : conn.priority >= 1 ? "info" : "muted"}
                      />
                      <StatusBadge
                        label={conn.pricing_template ? "Pricing On" : "Pricing Off"}
                        intent={conn.pricing_template ? "success" : "muted"}
                      />
                      {conn.pricing_template && (
                        <div className="flex items-center gap-1">
                          <ValueBadge
                            label={conn.pricing_template.name}
                            intent="info"
                          />
                          <ValueBadge
                            label={`v${conn.pricing_template.version}`}
                            intent="muted"
                          />
                          <ValueBadge
                            label={conn.pricing_template.pricing_currency_code}
                            intent="accent"
                          />
                        </div>
                      )}
                      {!conn.is_active && (
                        <StatusBadge label="Inactive" intent="muted" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate font-medium">{endpoint?.name ?? "Unknown endpoint"}</span>
                      <span className="text-muted-foreground/70">•</span>
                      <span className="font-mono break-all">{endpoint?.base_url}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Key: {maskedKey}</span>
                      {isChecking ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking now...
                        </span>
                      ) : conn.last_health_check ? (
                        <span>Checked {formatTime(conn.last_health_check, { hour: "numeric", minute: "numeric", second: "numeric", hour12: true })}</span>
                      ) : (
                        <span>Not checked yet</span>
                      )}
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span>Success rate (24h)</span>
                        <span className="text-[10px]">n={(metrics24h?.request_count_24h ?? 0).toLocaleString()}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5" />
                            </TooltipTrigger>
                            <TooltipContent className="pointer-events-none">
                              <p className="text-xs">
                                Success rate = successful requests / total requests for this connection in the last 24 hours. n = total requests counted in that 24h window.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                              ? formatTime(metrics24h.last_failover_like_at)
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConnection ? "Edit Connection" : "Add Connection"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnectionSubmit} className="space-y-5">
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm font-medium">Endpoint Source</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {editingConnection
                      ? "Switch this connection to another endpoint or create a new one."
                      : "Choose an existing endpoint or create one inline for this connection."}
                  </p>
                </div>
                {editingConnection && (
                  <StatusBadge label="Editable" intent="info" />
                )}
              </div>

              <Tabs
                value={createMode}
                onValueChange={(value) => setCreateMode(value as "select" | "new")}
                className="gap-3"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Select Existing</TabsTrigger>
                  <TabsTrigger value="new">Create New</TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="space-y-2">
                  <Label>Select Endpoint</Label>
                  <Select value={selectedEndpointId} onValueChange={setSelectedEndpointId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an endpoint..." />
                    </SelectTrigger>
                    <SelectContent>
                      {globalEndpoints.map((endpoint) => (
                        <SelectItem key={endpoint.id} value={String(endpoint.id)}>
                          {endpoint.name} ({endpoint.base_url})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEndpoint && (
                    <p className="text-[11px] text-muted-foreground">
                      Selected: <span className="font-medium text-foreground">{selectedEndpoint.name}</span>
                    </p>
                  )}
                  {globalEndpoints.length === 0 && (
                    <p className="text-xs text-muted-foreground">No global endpoints found.</p>
                  )}
                </TabsContent>

                <TabsContent value="new" className="space-y-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. OpenAI Primary"
                      value={newEndpointForm.name}
                      onChange={(e) => setNewEndpointForm({ ...newEndpointForm, name: e.target.value })}
                      required={createMode === "new"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                      placeholder="https://api.openai.com/v1"
                      value={newEndpointForm.base_url}
                      onChange={(e) => setNewEndpointForm({ ...newEndpointForm, base_url: e.target.value })}
                      required={createMode === "new"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={newEndpointForm.api_key}
                      onChange={(e) => setNewEndpointForm({ ...newEndpointForm, api_key: e.target.value })}
                      required={createMode === "new"}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to use endpoint name{endpointSourceDefaultName ? `: ${endpointSourceDefaultName}` : ""}.
                </p>
              </div>
            </div>

            <SwitchController
              label="Active"
              description="Include in load balancing"
              checked={connectionForm.is_active ?? true}
              onCheckedChange={(checked) => setConnectionForm({ ...connectionForm, is_active: checked })}
            />

            <div className="space-y-2">
              <Label>Pricing Template</Label>
              <Select
                value={connectionForm.pricing_template_id ? String(connectionForm.pricing_template_id) : "unpriced"}
                onValueChange={(value) => {
                  setConnectionForm({
                    ...connectionForm,
                    pricing_template_id: value === "unpriced" ? null : parseInt(value, 10),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pricing template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpriced">Unpriced (No cost tracking)</SelectItem>
                  {pricingTemplates.map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name} ({template.pricing_currency_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Assign a pricing template to track costs for this connection.
              </p>
            </div>

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


            <DialogFooter className="gap-2">
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
                <DialogTitle>Model Settings</DialogTitle>
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
                    {redirectTargetOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No native models available for this provider. Create a native model first.
                      </p>
                    ) : (
                      <Select value={editRedirectTo || undefined} onValueChange={setEditRedirectTo}>
                        <SelectTrigger id="edit-redirect-to">
                          <SelectValue placeholder="Select target model" />
                        </SelectTrigger>
                        <SelectContent>
                          {redirectTargetOptions.map((target) => (
                            <SelectItem key={target.modelId} value={target.modelId}>
                              {target.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
