import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type {
  LoadBalancingStrategy,
  ModelConfigCreate,
  ModelConfigListItem,
  ModelConfigUpdate,
  Provider,
} from "@/lib/types";
import { toast } from "sonner";
import { DEFAULT_VISIBLE_COLUMNS, getLast24hFromTime } from "./modelTableDefaults";
import type { ModelColumnKey, ModelDerivedMetric } from "./modelTableContracts";

const DEFAULT_FORM_DATA: ModelConfigCreate = {
  provider_id: 0,
  model_id: "",
  display_name: "",
  model_type: "native",
  redirect_to: null,
  lb_strategy: "single",
  is_enabled: true,
  failover_recovery_enabled: true,
  failover_recovery_cooldown_seconds: 60,
};

export function useModelsPageData(revision: number) {
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfigListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelConfigListItem | null>(null);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState<Record<ModelColumnKey, boolean>>(DEFAULT_VISIBLE_COLUMNS);
  const [modelMetrics24h, setModelMetrics24h] = useState<Record<number, ModelDerivedMetric>>({});
  const [modelSpend30dMicros, setModelSpend30dMicros] = useState<Record<number, number>>({});
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [formData, setFormData] = useState<ModelConfigCreate>(DEFAULT_FORM_DATA);

  const fetchData = async () => {
    try {
      const [modelsData, providersData] = await Promise.all([
        api.models.list(),
        api.providers.list(),
      ]);
      setModels(modelsData);
      setProviders(providersData);
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [revision]);

  useEffect(() => {
    let cancelled = false;

    const fetchModelMetrics = async () => {
      if (models.length === 0) {
        setModelMetrics24h({});
        setModelSpend30dMicros({});
        return;
      }

      setMetricsLoading(true);
      const fromTime = getLast24hFromTime();

      try {
        const rows = await Promise.all(
          models.map(async (model) => {
            try {
              const [summary, spending] = await Promise.all([
                api.stats.summary({ model_id: model.model_id, from_time: fromTime }),
                api.stats.spending({ model_id: model.model_id, preset: "last_30_days", group_by: "none" }),
              ]);
              return {
                id: model.id,
                success_rate: summary.success_rate,
                request_count_24h: summary.total_requests,
                p95_latency_ms: summary.p95_response_time_ms,
                spend_30d_micros: spending.summary.total_cost_micros,
              };
            } catch {
              return {
                id: model.id,
                success_rate: null,
                request_count_24h: 0,
                p95_latency_ms: null,
                spend_30d_micros: 0,
              };
            }
          })
        );

        if (cancelled) return;

        const nextMetrics: Record<number, ModelDerivedMetric> = {};
        const nextSpend: Record<number, number> = {};

        for (const row of rows) {
          nextMetrics[row.id] = {
            success_rate: row.success_rate,
            request_count_24h: row.request_count_24h,
            p95_latency_ms: row.p95_latency_ms,
          };
          nextSpend[row.id] = row.spend_30d_micros;
        }

        setModelMetrics24h(nextMetrics);
        setModelSpend30dMicros(nextSpend);
      } finally {
        if (!cancelled) {
          setMetricsLoading(false);
        }
      }
    };

    void fetchModelMetrics();

    return () => {
      cancelled = true;
    };
  }, [models]);

  const handleOpenDialog = (model?: ModelConfigListItem) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        provider_id: model.provider_id,
        model_id: model.model_id,
        display_name: model.display_name || "",
        model_type: model.model_type,
        redirect_to: model.redirect_to,
        lb_strategy: model.lb_strategy,
        is_enabled: model.is_enabled,
        failover_recovery_enabled: model.failover_recovery_enabled,
        failover_recovery_cooldown_seconds: model.failover_recovery_cooldown_seconds,
      });
    } else {
      setEditingModel(null);
      setFormData({
        ...DEFAULT_FORM_DATA,
        provider_id: providers[0]?.id ?? 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider_id) {
      toast.error("Please select a provider");
      return;
    }
    if (formData.model_type === "proxy" && !formData.redirect_to) {
      toast.error("Please select a native target model for proxy type");
      return;
    }
    try {
      if (editingModel) {
        const updateData: ModelConfigUpdate = {
          provider_id: formData.provider_id,
          display_name: formData.display_name || null,
          model_type: formData.model_type,
          redirect_to: formData.model_type === "proxy" ? formData.redirect_to : null,
          lb_strategy: formData.model_type === "native" ? formData.lb_strategy : "single",
          is_enabled: formData.is_enabled,
          failover_recovery_enabled: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_enabled : true,
          failover_recovery_cooldown_seconds: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_cooldown_seconds : 60,
        };
        await api.models.update(editingModel.id, updateData);
        toast.success("Model updated");
      } else {
        const createData: ModelConfigCreate = {
          ...formData,
          redirect_to: formData.model_type === "proxy" ? formData.redirect_to : null,
          lb_strategy: formData.model_type === "native" ? formData.lb_strategy : "single",
          failover_recovery_enabled: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_enabled : true,
          failover_recovery_cooldown_seconds: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_cooldown_seconds : 60,
        };
        await api.models.create(createData);
        toast.success("Model created");
      }
      setIsDialogOpen(false);
      void fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save model");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.models.delete(deleteTarget.id);
      toast.success("Model deleted");
      setDeleteTarget(null);
      void fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete model");
    }
  };

  const selectedProvider = providers.find((p) => p.id === formData.provider_id);
  const nativeModelsForProvider = models.filter(
    (m) =>
      m.model_type === "native" &&
      m.provider_id === formData.provider_id &&
      (!editingModel || m.model_id !== formData.model_id)
  );

  const filtered = models.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (!m.model_id.toLowerCase().includes(q) && !(m.display_name || "").toLowerCase().includes(q)) {
        return false;
      }
    }
    if (providerFilter !== "all" && m.provider.provider_type !== providerFilter) return false;
    if (statusFilter === "enabled" && !m.is_enabled) return false;
    if (statusFilter === "disabled" && m.is_enabled) return false;
    if (typeFilter !== "all" && m.model_type !== typeFilter) return false;
    return true;
  });

  const hasActiveFilters = Boolean(search) || providerFilter !== "all" || statusFilter !== "all" || typeFilter !== "all";
  const activeColumns = useMemo(
    () => ({
      provider: visibleColumns.provider,
      type: visibleColumns.type,
      strategy: visibleColumns.strategy,
      endpoints: visibleColumns.endpoints,
      success: visibleColumns.success,
      p95: visibleColumns.p95,
      requests: visibleColumns.requests,
      spend: visibleColumns.spend,
      status: visibleColumns.status,
    }),
    [visibleColumns]
  );

  const resetVisibleColumns = () => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  const updateColumnVisibility = (key: ModelColumnKey, checked: boolean) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: checked }));
  };

  const setModelType = (value: "native" | "proxy") => {
    setFormData({
      ...formData,
      model_type: value,
      redirect_to: value === "native" ? null : formData.redirect_to,
    });
  };

  const setLoadBalancingStrategy = (value: LoadBalancingStrategy) => {
    setFormData({ ...formData, lb_strategy: value });
  };

  return {
    activeColumns,
    deleteTarget,
    editingModel,
    filtered,
    formData,
    handleDelete,
    handleOpenDialog,
    handleSubmit,
    hasActiveFilters,
    isDialogOpen,
    loading,
    metricsLoading,
    modelMetrics24h,
    modelSpend30dMicros,
    models,
    nativeModelsForProvider,
    providerFilter,
    providers,
    resetVisibleColumns,
    search,
    selectedProvider,
    setDeleteTarget,
    setFormData,
    setIsDialogOpen,
    setLoadBalancingStrategy,
    setModelType,
    setProviderFilter,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    statusFilter,
    typeFilter,
    updateColumnVisibility,
    visibleColumns,
  };
}
