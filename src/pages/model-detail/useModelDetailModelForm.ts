import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { clearSharedReferenceData } from "@/lib/referenceData";
import type { ModelConfig, ModelConfigListItem, ModelConfigUpdate } from "@/lib/types";
import {
  buildRedirectTargetOptions,
  patchModelListItemFromDetail,
} from "./useModelDetailDataSupport";

interface UseModelDetailModelFormInput {
  editLoadbalanceStrategyId: string;
  model: ModelConfig | null;
  allModels: ModelConfigListItem[];
  isEditModelDialogOpen: boolean;
  revision: number;
  editRedirectTo: string;
  setEditLoadbalanceStrategyId: (value: string) => void;
  setEditRedirectTo: (value: string) => void;
  setIsEditModelDialogOpen: (open: boolean) => void;
  setAllModels: React.Dispatch<React.SetStateAction<ModelConfigListItem[]>>;
  setModel: React.Dispatch<React.SetStateAction<ModelConfig | null>>;
}

export function useModelDetailModelForm({
  editLoadbalanceStrategyId,
  model,
  allModels,
  isEditModelDialogOpen,
  revision,
  editRedirectTo,
  setEditLoadbalanceStrategyId,
  setEditRedirectTo,
  setIsEditModelDialogOpen,
  setAllModels,
  setModel,
}: UseModelDetailModelFormInput) {
  useEffect(() => {
    if (!isEditModelDialogOpen || !model) {
      return;
    }

    if (model.model_type === "proxy") {
      setEditRedirectTo(model.redirect_to || "");
      return;
    }

    setEditLoadbalanceStrategyId(model.loadbalance_strategy_id ? String(model.loadbalance_strategy_id) : "");
  }, [
    isEditModelDialogOpen,
    model,
    setEditLoadbalanceStrategyId,
    setEditRedirectTo,
  ]);

  const redirectTargetOptions = useMemo(
    () => buildRedirectTargetOptions(model, allModels),
    [allModels, model],
  );

  const handleEditModelSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!model) {
        return;
      }

      if (model.model_type === "native" && !editLoadbalanceStrategyId) {
        toast.error("Please select a loadbalance strategy for this native model");
        return;
      }

      const formData = new FormData(event.currentTarget);
      const updateData: ModelConfigUpdate = {
        display_name: (formData.get("display_name") as string) || null,
        model_id: formData.get("model_id") as string,
        redirect_to: model.model_type === "proxy" ? editRedirectTo || null : null,
        loadbalance_strategy_id:
          model.model_type === "native"
            ? Number.parseInt(editLoadbalanceStrategyId, 10) || null
            : null,
      };

      try {
        const updatedModel = await api.models.update(model.id, updateData);
        clearSharedReferenceData(undefined, revision);
        setModel(updatedModel);
        setAllModels((currentModels) => patchModelListItemFromDetail(currentModels, updatedModel));
        setEditLoadbalanceStrategyId(updatedModel.loadbalance_strategy_id ? String(updatedModel.loadbalance_strategy_id) : "");
        setEditRedirectTo(updatedModel.redirect_to || "");
        toast.success("Model updated");
        setIsEditModelDialogOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update model");
      }
    },
    [
      editLoadbalanceStrategyId,
      editRedirectTo,
      model,
      revision,
      setAllModels,
      setEditLoadbalanceStrategyId,
      setEditRedirectTo,
      setIsEditModelDialogOpen,
      setModel,
    ],
  );

  return {
    redirectTargetOptions,
    handleEditModelSubmit,
  };
}
