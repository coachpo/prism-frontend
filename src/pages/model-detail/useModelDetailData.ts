import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProfileContext } from "@/context/ProfileContext";
import type {
  ModelConfig,
  ModelConfigListItem,
  Connection,
  Endpoint,
  SpendingSummary,
  StatsSummary,
  PricingTemplate,
} from "@/lib/types";
import type { ConnectionDerivedMetrics } from "./modelDetailMetricsAndPaths";
import { useConnectionFocus } from "./useConnectionFocus";
import { useModelDetailBootstrap } from "./useModelDetailBootstrap";
import { useModelDetailConnectionFlows } from "./useModelDetailConnectionFlows";
import { useModelDetailConnectionMutations } from "./useModelDetailConnectionMutations";
import { useModelDetailDialogState } from "./useModelDetailDialogState";
import { useModelDetailMetrics24h } from "./useModelDetailMetrics24h";
import { useModelDetailModelForm } from "./useModelDetailModelForm";

export function useModelDetailData(id: string | undefined) {
  const navigate = useNavigate();
  const { revision } = useProfileContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [model, setModel] = useState<ModelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [allModels, setAllModels] = useState<ModelConfigListItem[]>([]);
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
    editRedirectTo,
    setEditRedirectTo,
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
  } = useModelDetailDialogState({ globalEndpoints });

  const { fetchModel } = useModelDetailBootstrap({
    id,
    revision,
    navigate,
    setModel,
    setConnections,
    setGlobalEndpoints,
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
    createMode,
    selectedEndpointId,
    newEndpointForm,
    connectionForm,
    headerRows,
    editingConnection,
    endpointSourceDefaultName,
    setIsConnectionDialogOpen,
    fetchModel,
  });

  const { redirectTargetOptions, handleEditModelSubmit } = useModelDetailModelForm({
    model,
    allModels,
    isEditModelDialogOpen,
    revision,
    editRedirectTo,
    setEditRedirectTo,
    setIsEditModelDialogOpen,
    fetchModel,
  });

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
    endpointSourceDefaultName,
    openConnectionDialog,
    handleConnectionSubmit,
    handleDeleteConnection,
    handleHealthCheck,
    handleHealthCheckAll,
    handleDialogTestConnection,
    handleToggleActive,
    handleEditModelSubmit,
    pricingTemplates,
    reorderInFlight,
    handleReorderConnections,
  };
}
