import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { getCurrentLocale } from "@/i18n/format";
import {
  getSharedLoadbalanceStrategies,
  setSharedLoadbalanceStrategies,
} from "@/lib/referenceData";
import type {
  LoadbalanceStrategy,
  LoadbalanceStrategyCreate,
  LoadbalanceStrategyUpdate,
} from "@/lib/types";
import {
  DEFAULT_LOADBALANCE_STRATEGY_FORM,
  getAttachedModelCountFromErrorDetail,
  getLoadbalanceStrategyFormValidationError,
  loadbalanceStrategyFormStateFromStrategy,
  toLoadbalanceStrategyPayload,
  type LoadbalanceStrategyFormState,
} from "./loadbalanceStrategyFormState";

export function useLoadbalanceStrategiesPageData(revision: number) {
  const [loadbalanceStrategies, setLoadbalanceStrategies] = useState<LoadbalanceStrategy[]>([]);
  const [loadbalanceStrategiesLoading, setLoadbalanceStrategiesLoading] = useState(false);
  const [loadbalanceStrategyDialogOpen, setLoadbalanceStrategyDialogOpen] = useState(false);
  const [editingLoadbalanceStrategy, setEditingLoadbalanceStrategy] = useState<LoadbalanceStrategy | null>(null);
  const [loadbalanceStrategyPreparingEditId, setLoadbalanceStrategyPreparingEditId] = useState<number | null>(null);
  const [loadbalanceStrategyForm, setLoadbalanceStrategyForm] = useState<LoadbalanceStrategyFormState>(DEFAULT_LOADBALANCE_STRATEGY_FORM);
  const [loadbalanceStrategySaving, setLoadbalanceStrategySaving] = useState(false);
  const [deleteLoadbalanceStrategyConfirm, setDeleteLoadbalanceStrategyConfirm] = useState<LoadbalanceStrategy | null>(null);
  const [loadbalanceStrategyDeleting, setLoadbalanceStrategyDeleting] = useState(false);

  const commitLoadbalanceStrategies = useCallback(
    (updater: (current: LoadbalanceStrategy[]) => LoadbalanceStrategy[]) => {
      setLoadbalanceStrategies((current) => {
        const next = sortLoadbalanceStrategies(updater(current));
        setSharedLoadbalanceStrategies(revision, next);
        return next;
      });
    },
    [revision],
  );

  const fetchLoadbalanceStrategies = useCallback(async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    setLoadbalanceStrategiesLoading(true);
    try {
      const data = await getSharedLoadbalanceStrategies(revision);
      setLoadbalanceStrategies(sortLoadbalanceStrategies(data));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载负载均衡策略失败" : "Failed to load loadbalance strategies");
    } finally {
      setLoadbalanceStrategiesLoading(false);
    }
  }, [revision]);

  useEffect(() => {
    void fetchLoadbalanceStrategies();
  }, [fetchLoadbalanceStrategies]);

  const closeLoadbalanceStrategyDialog = () => {
    setLoadbalanceStrategyDialogOpen(false);
    setEditingLoadbalanceStrategy(null);
    setLoadbalanceStrategyPreparingEditId(null);
    setLoadbalanceStrategyForm(DEFAULT_LOADBALANCE_STRATEGY_FORM);
  };

  const openCreateLoadbalanceStrategyDialog = () => {
    setEditingLoadbalanceStrategy(null);
    setLoadbalanceStrategyPreparingEditId(null);
    setLoadbalanceStrategyForm(DEFAULT_LOADBALANCE_STRATEGY_FORM);
    setLoadbalanceStrategyDialogOpen(true);
  };

  const handleEditLoadbalanceStrategy = async (strategySummary: LoadbalanceStrategy) => {
    const isChinese = getCurrentLocale() === "zh-CN";
    setLoadbalanceStrategyPreparingEditId(strategySummary.id);
    try {
      const strategy = await api.loadbalanceStrategies.get(strategySummary.id);
      setEditingLoadbalanceStrategy(strategy);
      setLoadbalanceStrategyForm(loadbalanceStrategyFormStateFromStrategy(strategy));
      setLoadbalanceStrategyDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "加载负载均衡策略失败" : "Failed to load loadbalance strategy");
    } finally {
      setLoadbalanceStrategyPreparingEditId(null);
    }
  };

  const handleSaveLoadbalanceStrategy = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    const validationError = getLoadbalanceStrategyFormValidationError(loadbalanceStrategyForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = toLoadbalanceStrategyPayload(loadbalanceStrategyForm);

    setLoadbalanceStrategySaving(true);
    try {
      if (editingLoadbalanceStrategy) {
        const updatePayload: LoadbalanceStrategyUpdate = payload;
        const updated = await api.loadbalanceStrategies.update(editingLoadbalanceStrategy.id, updatePayload);
        commitLoadbalanceStrategies((current) =>
          current.map((strategy) =>
            strategy.id === editingLoadbalanceStrategy.id ? updated : strategy,
          ),
        );
        toast.success(isChinese ? "负载均衡策略已更新" : "Loadbalance strategy updated");
      } else {
        const createPayload: LoadbalanceStrategyCreate = payload;
        const created = await api.loadbalanceStrategies.create(createPayload);
        commitLoadbalanceStrategies((current) => [created, ...current]);
        toast.success(isChinese ? "负载均衡策略已创建" : "Loadbalance strategy created");
      }

      closeLoadbalanceStrategyDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : isChinese ? "保存负载均衡策略失败" : "Failed to save loadbalance strategy");
    } finally {
      setLoadbalanceStrategySaving(false);
    }
  };

  const handleDeleteLoadbalanceStrategyClick = (strategy: LoadbalanceStrategy) => {
    setDeleteLoadbalanceStrategyConfirm(strategy);
  };

  const handleDeleteLoadbalanceStrategy = async () => {
    const isChinese = getCurrentLocale() === "zh-CN";
    if (!deleteLoadbalanceStrategyConfirm) {
      return;
    }

    setLoadbalanceStrategyDeleting(true);
    try {
      await api.loadbalanceStrategies.delete(deleteLoadbalanceStrategyConfirm.id);
      commitLoadbalanceStrategies((current) =>
        current.filter((strategy) => strategy.id !== deleteLoadbalanceStrategyConfirm.id),
      );
      toast.success(isChinese ? "负载均衡策略已删除" : "Loadbalance strategy deleted");
      setDeleteLoadbalanceStrategyConfirm(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const attachedModelCount = getAttachedModelCountFromErrorDetail(error.detail);
        if (attachedModelCount !== null) {
          setDeleteLoadbalanceStrategyConfirm((current) =>
            current
              ? {
                  ...current,
                  attached_model_count: attachedModelCount,
                }
              : current,
          );
        }
      }
      toast.error(error instanceof Error ? error.message : isChinese ? "删除负载均衡策略失败" : "Failed to delete loadbalance strategy");
    } finally {
      setLoadbalanceStrategyDeleting(false);
    }
  };

  return {
    closeLoadbalanceStrategyDialog,
    deleteLoadbalanceStrategyConfirm,
    editingLoadbalanceStrategy,
    handleDeleteLoadbalanceStrategy,
    handleDeleteLoadbalanceStrategyClick,
    handleEditLoadbalanceStrategy,
    handleSaveLoadbalanceStrategy,
    loadbalanceStrategies,
    loadbalanceStrategiesLoading,
    loadbalanceStrategyDeleting,
    loadbalanceStrategyDialogOpen,
    loadbalanceStrategyForm,
    loadbalanceStrategyPreparingEditId,
    loadbalanceStrategySaving,
    openCreateLoadbalanceStrategyDialog,
    setDeleteLoadbalanceStrategyConfirm,
    setLoadbalanceStrategyDialogOpen,
    setLoadbalanceStrategyForm,
  };
}

function sortLoadbalanceStrategies(strategies: LoadbalanceStrategy[]) {
  return [...strategies].sort((left, right) => {
    const updatedAtDelta =
      new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();

    if (updatedAtDelta !== 0) {
      return updatedAtDelta;
    }

    return right.id - left.id;
  });
}
