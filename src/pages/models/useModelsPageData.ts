import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  getSharedLoadbalanceStrategies,
  getSharedModels,
  getSharedProviders,
  setSharedModels,
} from "@/lib/referenceData";
import type {
  LoadbalanceStrategy,
  ModelConfigCreate,
  ModelConfigListItem,
  Provider,
} from "@/lib/types";
import { toast } from "sonner";
import {
  createEditModelFormData,
  createNewModelFormData,
  DEFAULT_MODEL_FORM_DATA,
  getNativeModelsForProvider,
  setLoadbalanceStrategyIdOnForm,
  setModelTypeOnForm,
  toModelCreatePayload,
  toModelListItem,
  toModelUpdatePayload,
  type SubmitEventLike,
} from "./modelFormState";
import { useModelMetrics24h } from "./useModelMetrics24h";

export function useModelsPageData(revision: number) {
  const [loadbalanceStrategies, setLoadbalanceStrategies] = useState<LoadbalanceStrategy[]>([]);
  const [models, setModels] = useState<ModelConfigListItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfigListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelConfigListItem | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<ModelConfigCreate>(DEFAULT_MODEL_FORM_DATA);
  const { metricsLoading, modelMetrics24h, modelSpend30dMicros } = useModelMetrics24h(models);

  const applyBootstrapData = useCallback((data: {
    loadbalanceStrategiesData: LoadbalanceStrategy[];
    modelsData: ModelConfigListItem[];
    providersData: Provider[];
  }) => {
    setLoadbalanceStrategies(data.loadbalanceStrategiesData);
    setModels(data.modelsData);
    setProviders(data.providersData);
  }, []);

  const fetchData = useCallback(async (currentRevision: number) => {
    return Promise.all([
      getSharedLoadbalanceStrategies(currentRevision),
      getSharedModels(currentRevision),
      getSharedProviders(currentRevision),
    ]).then(
      ([loadbalanceStrategiesData, modelsData, providersData]) => ({
        loadbalanceStrategiesData,
        modelsData,
        providersData,
      })
    );
  }, []);

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
  }, [applyBootstrapData, fetchData, revision]);

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
    if (formData.model_type === "native" && formData.loadbalance_strategy_id === null) {
      toast.error("Please select a loadbalance strategy for native models");
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

  const filtered = useMemo(
    () =>
      models.filter((model) => {
        if (!search) {
          return true;
        }

        const query = search.toLowerCase();
        return (
          model.model_id.toLowerCase().includes(query) ||
          (model.display_name ?? "").toLowerCase().includes(query)
        );
      }),
    [models, search]
  );

  const setModelType = (value: "native" | "proxy") => {
    setFormData((current) => setModelTypeOnForm(current, value));
  };

  const setLoadbalanceStrategyId = (value: number | null) => {
    setFormData((current) => setLoadbalanceStrategyIdOnForm(current, value));
  };

  return {
    deleteTarget,
    editingModel,
    filtered,
    formData,
    handleDelete,
    handleOpenDialog,
    handleSubmit,
    isDialogOpen,
    loadbalanceStrategies,
    loading,
    metricsLoading,
    modelMetrics24h,
    modelSpend30dMicros,
    models,
    nativeModelsForProvider,
    providers,
    search,
    selectedProvider,
    setDeleteTarget,
    setFormData,
    setIsDialogOpen,
    setLoadbalanceStrategyId,
    setModelType,
    setSearch,
  };
}
