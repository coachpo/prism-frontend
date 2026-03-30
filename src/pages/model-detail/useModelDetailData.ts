import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfileContext } from "@/context/ProfileContext";
import type {
  ModelConfig,
  ModelConfigListItem,
  Connection,
  Endpoint,
  LoadbalanceStrategy,
  Vendor,
  ProxyTarget,
  SpendingSummary,
  StatsSummary,
  PricingTemplate,
} from "@/lib/types";
import { buildProxyTargetSummary } from "./useModelDetailDataSupport";
import type { ConnectionDerivedMetrics } from "./modelDetailMetricsAndPaths";
import { useConnectionFocus } from "./useConnectionFocus";
import { useModelDetailBootstrap } from "./useModelDetailBootstrap";
import { useModelDetailConnectionFlows } from "./useModelDetailConnectionFlows";
import { useModelDetailConnectionMutations } from "./useModelDetailConnectionMutations";
import { useModelDetailDialogState } from "./useModelDetailDialogState";
import { useModelDetailMetrics24h } from "./useModelDetailMetrics24h";
import { useModelDetailModelForm } from "./useModelDetailModelForm";
import { useModelLoadbalanceCurrentState } from "./useModelLoadbalanceCurrentState";

export function useModelDetailData(id: string | undefined) {
  const navigate = useNavigate();
  const { revision } = useProfileContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const modelConfigId = id ? Number.parseInt(id, 10) : undefined;

  const [model, setModel] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [allModels, setAllModels] = useState<ModelConfigListItem[]>([]);
  const [loadbalanceStrategies, setLoadbalanceStrategies] = useState<LoadbalanceStrategy[]>([]);
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [spending, setSpending] = useState<SpendingSummary | null>(null);
  const [spendingLoading, setSpendingLoading] = useState(false);
  const [spendingCurrencySymbol, setSpendingCurrencySymbol] = useState("$");
  const [spendingCurrencyCode, setSpendingCurrencyCode] = useState("USD");
  const [kpiSummary24h, setKpiSummary24h] = useState<StatsSummary | null>(null);
  const [kpiSpend24hMicros, setKpiSpend24hMicros] = useState<number | null>(null);
  const [metrics24hLoading, setMetrics24hLoading] = useState(false);
  const [connectionMetricsEnabled, setConnectionMetricsEnabled] = useState(false);
  const [connectionMetricsLoading, setConnectionMetricsLoading] = useState(false);
  const [editLoadbalanceStrategyId, setEditLoadbalanceStrategyId] = useState("");
  const [editProxyTargets, setEditProxyTargets] = useState<ProxyTarget[]>([]);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionSearch, setConnectionSearch] = useState("");
  const [connectionMetrics24h, setConnectionMetrics24h] = useState<
    Map<number, ConnectionDerivedMetrics>
  >(new Map());
  const [focusedConnectionId, setFocusedConnectionId] = useState<number | null>(null);
  const [connectionCardRefs] = useState<Map<number, HTMLDivElement>>(new Map());

  const [globalEndpoints, setGlobalEndpoints] = useState<Endpoint[]>([]);

  const {
    isEditModelDialogOpen,
    setIsEditModelDialogOpen,
    isConnectionDialogOpen,
    setIsConnectionDialogOpen,
    editingConnection,
    dialogTestingConnection,
    setDialogTestingConnection,
    dialogTestResult,
    setDialogTestResult,
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
    endpointSourceDefaultName,
    openConnectionDialog,
  } = useModelDetailDialogState({
    modelApiFamily: model?.api_family,
    globalEndpoints,
  });

  useModelDetailBootstrap({
    id,
    revision,
    navigate,
    setModel,
    setConnections,
    setGlobalEndpoints,
    setLoadbalanceStrategies,
    setAllModels,
    setPricingTemplates,
    setLoading,
    setSpending,
    setSpendingLoading,
    setSpendingCurrencySymbol,
    setSpendingCurrencyCode,
    setConnectionMetricsEnabled,
    setConnectionMetricsLoading,
    setConnectionMetrics24h,
  });

  const {
    currentStateByConnectionId,
    resettingConnectionIds,
    refreshCurrentState,
    resetCooldown,
  } = useModelLoadbalanceCurrentState({
    modelConfigId,
    revision,
    enabled: model?.model_type === "native",
  });

  const {
    healthCheckingIds,
    reorderInFlight,
    handleReorderConnections,
    handleHealthCheck,
    handleHealthCheckAll,
    handleDialogTestConnection,
  } = useModelDetailConnectionFlows({
    connections,
    setConnections,
    model,
    setModel,
    editingConnection,
    refreshCurrentState,
    setDialogTestingConnection,
    setDialogTestResult,
  });

  const {
    handleConnectionSubmit,
    handleDeleteConnection,
    handleToggleActive,
  } = useModelDetailConnectionMutations({
    id,
    revision,
    modelApiFamily: model?.api_family,
    createMode,
    selectedEndpointId,
    newEndpointForm,
    connectionForm,
    headerRows,
    editingConnection,
    pricingTemplates,
    endpointSourceDefaultName,
    refreshCurrentState,
    setIsConnectionDialogOpen,
    setAllModels,
    setConnections,
    setGlobalEndpoints,
    setModel,
  });

  const { proxyTargetOptions, handleEditModelSubmit, handleSaveProxyTargets } = useModelDetailModelForm({
    editLoadbalanceStrategyId,
    editProxyTargets,
    model,
    allModels,
    isEditModelDialogOpen,
    revision,
    setEditLoadbalanceStrategyId,
    setEditProxyTargets,
    setIsEditModelDialogOpen,
    setAllModels,
    setModel,
  });

  const proxyTargetSummary = useMemo(
    () => buildProxyTargetSummary(model, allModels),
    [allModels, model],
  );

  useConnectionFocus({
    model,
    searchParams,
    setSearchParams,
    connectionCardRefs,
    setFocusedConnectionId,
  });

  useModelDetailMetrics24h({
    connectionMetricsEnabled,
    model,
    connections,
    revision,
    setConnectionMetricsLoading,
    setMetrics24hLoading,
    setConnectionMetrics24h,
    setKpiSummary24h,
    setKpiSpend24hMicros,
  });

  const modelKpis = useMemo(() => {
    return {
      successRate: kpiSummary24h?.success_rate ?? null,
      p95LatencyMs: kpiSummary24h?.p95_response_time_ms ?? null,
      requestCount24h: kpiSummary24h?.total_requests ?? 0,
      spend24hMicros: kpiSpend24hMicros,
    };
  }, [kpiSummary24h, kpiSpend24hMicros]);

  const vendors = useMemo(() => {
    const seenVendorIds = new Set<number>();
    const nextVendors: Vendor[] = [];

    const pushVendor = (vendor: Vendor | undefined) => {
      if (!vendor || seenVendorIds.has(vendor.id)) {
        return;
      }

      seenVendorIds.add(vendor.id);
      nextVendors.push(vendor);
    };

    pushVendor(model?.vendor);
    allModels.forEach((item) => {
      pushVendor(item.vendor);
    });

    return nextVendors;
  }, [allModels, model?.vendor]);

  return {
    model,
    loading,
    loadbalanceStrategies,
    vendors,
    isEditModelDialogOpen,
    setIsEditModelDialogOpen,
    editLoadbalanceStrategyId,
    setEditLoadbalanceStrategyId,
    editProxyTargets,
    setEditProxyTargets,
    spending,
    spendingLoading,
    spendingCurrencySymbol,
    spendingCurrencyCode,
    kpiSummary24h,
    kpiSpend24hMicros,
    metrics24hLoading,
    connectionMetricsEnabled,
    connectionMetricsLoading,
    connections,
    isConnectionDialogOpen,
    setIsConnectionDialogOpen,
    editingConnection,
    connectionSearch,
    setConnectionSearch,
    setConnectionMetricsEnabled,
    healthCheckingIds,
    dialogTestingConnection,
    dialogTestResult,
    connectionMetrics24h,
    currentStateByConnectionId,
    resettingConnectionIds,
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
    proxyTargetOptions,
    proxyTargetSummary,
    endpointSourceDefaultName,
    openConnectionDialog,
    handleConnectionSubmit,
    handleDeleteConnection,
    handleHealthCheck,
    handleHealthCheckAll,
    handleDialogTestConnection,
    handleToggleActive,
    handleEditModelSubmit,
    handleSaveProxyTargets,
    pricingTemplates,
    reorderInFlight,
    handleReorderConnections,
    handleResetCooldown: resetCooldown,
  };
}
