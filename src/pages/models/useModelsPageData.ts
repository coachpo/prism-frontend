import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getCurrentLocale } from "@/i18n/format";
import {
  getSharedLoadbalanceStrategies,
  getSharedModels,
  getSharedVendors,
  setSharedModels,
} from "@/lib/referenceData";
import type {
  LoadbalanceStrategy,
  ModelConfigCreate,
  ModelConfigListItem,
  Vendor,
} from "@/lib/types";
import { toast } from "sonner";
import {
  createEditModelFormData,
  createNewModelFormData,
  DEFAULT_MODEL_FORM_DATA,
  getNativeModelsForApiFamily,
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
    vendorsData: Vendor[];
  }) => {
    setLoadbalanceStrategies(data.loadbalanceStrategiesData);
    setModels(data.modelsData);
    setVendors(data.vendorsData);
  }, []);

  const fetchData = useCallback(async (currentRevision: number) => {
    return Promise.all([
      getSharedLoadbalanceStrategies(currentRevision),
      getSharedModels(currentRevision),
      getSharedVendors(currentRevision),
    ]).then(
      ([loadbalanceStrategiesData, modelsData, vendorsData]) => ({
        loadbalanceStrategiesData,
        modelsData,
        vendorsData,
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
          toast.error(getCurrentLocale() === "zh-CN" ? "获取数据失败" : "Failed to fetch data");
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
      setFormData(createNewModelFormData(vendors));
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: SubmitEventLike) => {
    const isChinese = getCurrentLocale() === "zh-CN";
    event.preventDefault();
    if (!formData.vendor_id) {
      toast.error(isChinese ? "请选择供应商" : "Please select a vendor");
      return;
    }
    if (!formData.api_family) {
      toast.error(isChinese ? "请选择 API 家族" : "Please select an API family");
      return;
    }
    if (formData.model_type === "native" && formData.loadbalance_strategy_id === null) {
      toast.error(
        isChinese
          ? "请为原生模型选择负载均衡策略"
          : "Please select a loadbalance strategy for native models",
      );
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
        toast.success(isChinese ? "模型已更新" : "Model updated");
      } else {
        const created = await api.models.create(toModelCreatePayload(formData));
        commitModels((current) => [...current, toModelListItem(created)]);
        toast.success(isChinese ? "模型已创建" : "Model created");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "保存模型失败" : "Failed to save model");
    }
  };

  const handleDelete = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    if (!deleteTarget) return;
    try {
      await api.models.delete(deleteTarget.id);
      commitModels((current) => current.filter((model) => model.id !== deleteTarget.id));
      toast.success(isChinese ? "模型已删除" : "Model deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "删除模型失败" : "Failed to delete model");
    }
  };

  const selectedVendor = vendors.find((vendor) => vendor.id === formData.vendor_id);
  const nativeModelsForApiFamily = getNativeModelsForApiFamily(
    models,
    formData.api_family ?? "openai",
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
    nativeModelsForApiFamily,
    vendors,
    search,
    selectedVendor,
    setDeleteTarget,
    setFormData,
    setIsDialogOpen,
    setLoadbalanceStrategyId,
    setModelType,
    setSearch,
  };
}
