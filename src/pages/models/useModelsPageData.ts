import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  getSharedModels,
  getSharedProviders,
  setSharedModels,
} from "@/lib/referenceData";
import type {
  LoadBalancingStrategy,
  ModelConfigCreate,
  ModelConfigListItem,
  Provider,
} from "@/lib/types";
import { toast } from "sonner";
import { DEFAULT_VISIBLE_COLUMNS } from "./modelTableDefaults";
import type { ModelColumnKey } from "./modelTableContracts";
import {
  createEditModelFormData,
  createNewModelFormData,
  DEFAULT_MODEL_FORM_DATA,
  getNativeModelsForProvider,
  setLoadBalancingStrategyOnForm,
  setModelTypeOnForm,
  toModelCreatePayload,
  toModelListItem,
  toModelUpdatePayload,
  type SubmitEventLike,
} from "./modelFormState";
import { useModelMetrics24h } from "./useModelMetrics24h";

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
  const [formData, setFormData] = useState<ModelConfigCreate>(DEFAULT_MODEL_FORM_DATA);
  const { metricsLoading, modelMetrics24h, modelSpend30dMicros } = useModelMetrics24h(models);

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
      setFormData(createEditModelFormData(model));
    } else {
      setEditingModel(null);
      setFormData(createNewModelFormData(providers));
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: SubmitEventLike) => {
    event.preventDefault();
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
        const updated = await api.models.update(editingModel.id, toModelUpdatePayload(formData));
        commitModels((current) =>
          current.map((model) =>
            model.id === editingModel.id ? toModelListItem(updated, model) : model
          )
        );
        toast.success("Model updated");
      } else {
        const created = await api.models.create(toModelCreatePayload(formData));
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
  const nativeModelsForProvider = getNativeModelsForProvider(
    models,
    formData.provider_id,
    editingModel ? formData.model_id : undefined,
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
    setFormData((current) => setModelTypeOnForm(current, value));
  };

  const setLoadBalancingStrategy = (value: LoadBalancingStrategy) => {
    setFormData((current) => setLoadBalancingStrategyOnForm(current, value));
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
