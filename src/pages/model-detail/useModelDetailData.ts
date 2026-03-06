import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useProfileContext } from "@/context/ProfileContext";
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
import { get24hFromTime } from "./utils";
import type { ConnectionDerivedMetrics } from "./utils";
import {
  applyConnectionHealthChecks,
  buildRedirectTargetOptions,
  createDefaultConnectionForm,
  createDefaultEndpointForm,
  getSelectedEndpoint,
} from "./useModelDetailData.helpers";
export function useModelDetailData(id: string | undefined) {
  const navigate = useNavigate();
  const { revision } = useProfileContext();
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
    ...createDefaultEndpointForm(),
  });

  const [connectionForm, setConnectionForm] = useState<ConnectionCreate>({
    ...createDefaultConnectionForm(),
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

    setConnections((prevConnections) => applyConnectionHealthChecks(prevConnections, successfulChecks));

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

  const redirectTargetOptions = useMemo(
    () => buildRedirectTargetOptions(model, allModels),
    [allModels, model]
  );

  const selectedEndpoint = useMemo(
    () => getSelectedEndpoint(globalEndpoints, selectedEndpointId),
    [globalEndpoints, selectedEndpointId]
  );

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
        ...createDefaultEndpointForm(),
      });
      setCreateMode("select");
      setSelectedEndpointId(String(connection.endpoint_id));
    } else {
      setEditingConnection(null);
      setHeaderRows([]);
      setConnectionForm({
        ...createDefaultConnectionForm(),
      });
      setNewEndpointForm({ ...createDefaultEndpointForm() });
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

  return {
    model,
    loading,
    isEditModelDialogOpen,
    setIsEditModelDialogOpen,
    editRedirectTo,
    setEditRedirectTo,
    spending,
    spendingLoading,
    spendingCurrencySymbol,
    spendingCurrencyCode,
    kpiSummary24h,
    kpiSpend24hMicros,
    metrics24hLoading,
    connections,
    isConnectionDialogOpen,
    setIsConnectionDialogOpen,
    editingConnection,
    connectionSearch,
    setConnectionSearch,
    healthCheckingIds,
    dialogTestingConnection,
    dialogTestResult,
    connectionMetrics24h,
    focusedConnectionId,
    connectionCardRefs,
    globalEndpoints,
    createMode,
    setCreateMode,
    selectedEndpointId,
    setSelectedEndpointId,
    newEndpointForm,
    setNewEndpointForm,
    connectionForm,
    setConnectionForm,
    headerRows,
    setHeaderRows,
    modelKpis,
    redirectTargetOptions,
    selectedEndpoint,
    endpointSourceDefaultName,
    openConnectionDialog,
    handleConnectionSubmit,
    handleDeleteConnection,
    handleHealthCheck,
    handleDialogTestConnection,
    handleToggleActive,
    handleEditModelSubmit,
    pricingTemplates,
  };
}
