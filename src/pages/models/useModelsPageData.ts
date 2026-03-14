import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  getSharedModels,
  getSharedProviders,
  setSharedModels,
} from "@/lib/referenceData";
import type {
  LoadBalancingStrategy,
  ModelConfig,
  ModelConfigCreate,
  ModelConfigListItem,
  ModelConfigUpdate,
  Provider,
} from "@/lib/types";
import { toast } from "sonner";
import { DEFAULT_VISIBLE_COLUMNS } from "./modelTableDefaults";
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

  const applyBootstrapData = (data: { modelsData: ModelConfigListItem[]; providersData: Provider[] }) => {
    setModels(data.modelsData);
    setProviders(data.providersData);
  };

  const fetchData = async (currentRevision: number) => {
    return Promise.all([
      getSharedModels(currentRevision),
      getSharedProviders(currentRevision),
    ]).then(
      ([modelsData, providersData]) => ({
        modelsData,
        providersData,
      })
    );
  };

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    void (async () => {
      try {
        const data = await fetchData(revision);
        if (cancelled) return;
        applyBootstrapData(data);
      } catch (error) {
        if (!cancelled) {
          toast.error("Failed to fetch data");
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [revision]);

  useEffect(() => {
    let cancelled = false;

    const fetchModelMetrics = async () => {
      if (models.length === 0) {
        setModelMetrics24h({});
        setModelSpend30dMicros({});
        setMetricsLoading(false);
        return;
      }

      setMetricsLoading(true);

      try {
        const uniqueModelIds = Array.from(new Set(models.map((model) => model.model_id)));
        const response = await api.stats.modelMetrics({
          model_ids: uniqueModelIds,
          summary_window_hours: 24,
          spending_preset: "last_30_days",
        });

        if (cancelled) return;

        const metricsByModelId = new Map(response.items.map((item) => [item.model_id, item]));

        const nextMetrics: Record<number, ModelDerivedMetric> = {};
        const nextSpend: Record<number, number> = {};

        for (const model of models) {
          const row = metricsByModelId.get(model.model_id);
          nextMetrics[model.id] = {
            success_rate: row?.success_rate ?? null,
            request_count_24h: row?.request_count_24h ?? 0,
            p95_latency_ms: row?.p95_latency_ms ?? null,
          };
          nextSpend[model.id] = row?.spend_30d_micros ?? 0;
        }

        setModelMetrics24h(nextMetrics);
        setModelSpend30dMicros(nextSpend);
      } catch {
        if (!cancelled) {
          const nextMetrics: Record<number, ModelDerivedMetric> = {};
          const nextSpend: Record<number, number> = {};
          for (const model of models) {
            nextMetrics[model.id] = {
              success_rate: null,
              request_count_24h: 0,
              p95_latency_ms: null,
            };
            nextSpend[model.id] = 0;
          }
          setModelMetrics24h(nextMetrics);
          setModelSpend30dMicros(nextSpend);
        }
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

  const commitModels = (updater: (current: ModelConfigListItem[]) => ModelConfigListItem[]) => {
    setModels((current) => {
      const next = updater(current);
      setSharedModels(revision, next);
      return next;
    });
  };

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
          const updated = await api.models.update(editingModel.id, updateData);
          commitModels((current) =>
            current.map((model) =>
              model.id === editingModel.id ? toModelListItem(updated, model) : model
            )
          );
          toast.success("Model updated");
        } else {
        const createData: ModelConfigCreate = {
          ...formData,
          redirect_to: formData.model_type === "proxy" ? formData.redirect_to : null,
          lb_strategy: formData.model_type === "native" ? formData.lb_strategy : "single",
          failover_recovery_enabled: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_enabled : true,
          failover_recovery_cooldown_seconds: formData.model_type === "native" && formData.lb_strategy === "failover" ? formData.failover_recovery_cooldown_seconds : 60,
        };
          const created = await api.models.create(createData);
          commitModels((current) => [...current, toModelListItem(created)]);
          toast.success("Model created");
        }
        setIsDialogOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save model");
      }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.models.delete(deleteTarget.id);
      commitModels((current) => current.filter((model) => model.id !== deleteTarget.id));
      toast.success("Model deleted");
      setDeleteTarget(null);
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

function toModelListItem(model: ModelConfig, existing?: ModelConfigListItem): ModelConfigListItem {
  return {
    id: model.id,
    provider_id: model.provider_id,
    provider: model.provider,
    model_id: model.model_id,
    display_name: model.display_name,
    model_type: model.model_type,
    redirect_to: model.redirect_to,
    lb_strategy: model.lb_strategy,
    is_enabled: model.is_enabled,
    failover_recovery_enabled: model.failover_recovery_enabled,
    failover_recovery_cooldown_seconds: model.failover_recovery_cooldown_seconds,
    connection_count: model.connections.length,
    active_connection_count: model.connections.filter((connection) => connection.is_active).length,
    health_success_rate: existing?.health_success_rate ?? null,
    health_total_requests: existing?.health_total_requests ?? 0,
    created_at: model.created_at,
    updated_at: model.updated_at,
  };
}
